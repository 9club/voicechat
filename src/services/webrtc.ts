import { wsClient } from './websocket';

interface PeerConnectionMap {
  [peerId: string]: RTCPeerConnection;
}

type RemoteStreamListener = (peerId: string, stream: MediaStream) => void;
type RemoteStreamRemovedListener = (peerId: string) => void;

class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peerConnections: PeerConnectionMap = {};
  private remoteStreamListeners: Set<RemoteStreamListener> = new Set();
  private remoteStreamRemovedListeners: Set<RemoteStreamRemovedListener> = new Set();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' }
    ]
  };

  constructor() {
    this.setupSocketListener();
  }

  private setupSocketListener() {
    wsClient.on('webrtc_signal', async (data: any) => {
      const { fromUserId, signal } = data;
      if (!fromUserId || !signal) return;

      try {
        if (signal.type === 'offer') {
          await this.handleOffer(fromUserId, signal);
        } else if (signal.type === 'answer') {
          await this.handleAnswer(fromUserId, signal);
        } else if (signal.candidate) {
          await this.handleCandidate(fromUserId, signal.candidate);
        }
      } catch (err) {
        console.warn('WebRTC signal processing warning:', err);
      }
    });

    wsClient.on('user_left', (data: any) => {
      if (data.userId) {
        this.closePeer(data.userId);
      }
    });
  }

  public setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;

    // Update existing peer connections with new tracks
    for (const [peerId, pc] of Object.entries(this.peerConnections)) {
      try {
        const senders = pc.getSenders();
        if (stream) {
          stream.getTracks().forEach((track) => {
            const sender = senders.find((s) => s.track && s.track.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            } else {
              pc.addTrack(track, stream);
            }
          });
        } else {
          // If stream stopped, remove tracks
          senders.forEach((sender) => {
            try {
              pc.removeTrack(sender);
            } catch (e) {
              // ignore
            }
          });
        }
      } catch (err) {
        console.warn('Error replacing tracks on peer:', peerId, err);
      }
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(peerId: string): MediaStream | undefined {
    return this.remoteStreams.get(peerId);
  }

  public getAllRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
  }

  public onRemoteStream(listener: RemoteStreamListener) {
    this.remoteStreamListeners.add(listener);
    // Immediately notify already connected streams
    this.remoteStreams.forEach((stream, peerId) => {
      try {
        listener(peerId, stream);
      } catch (e) {
        // ignore
      }
    });
    return () => {
      this.remoteStreamListeners.delete(listener);
    };
  }

  public onRemoteStreamRemoved(listener: RemoteStreamRemovedListener) {
    this.remoteStreamRemovedListeners.add(listener);
    return () => {
      this.remoteStreamRemovedListeners.delete(listener);
    };
  }

  // Call a peer (initiate WebRTC connection)
  public async callPeer(peerId: string) {
    if (peerId === wsClient.userId) return;

    let pc = this.peerConnections[peerId];
    if (pc) {
      this.closePeer(peerId);
    }

    pc = this.createPeerConnection(peerId);
    this.peerConnections[peerId] = pc;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      wsClient.send({
        type: 'webrtc_signal',
        targetUserId: peerId,
        signal: offer
      });
    } catch (err) {
      console.error('Error creating WebRTC offer:', err);
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.rtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsClient.send({
          type: 'webrtc_signal',
          targetUserId: peerId,
          signal: { candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      let stream = this.remoteStreams.get(peerId);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(peerId, stream);
      }
      stream.addTrack(event.track);

      this.remoteStreamListeners.forEach((listener) => {
        try {
          listener(peerId, stream!);
        } catch (e) {
          console.error(e);
        }
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(peerId);
      }
    };

    return pc;
  }

  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    let pc = this.peerConnections[peerId];
    if (!pc) {
      pc = this.createPeerConnection(peerId);
      this.peerConnections[peerId] = pc;
    }

    if (this.localStream) {
      const senders = pc.getSenders();
      this.localStream.getTracks().forEach((track) => {
        if (!senders.some((s) => s.track === track)) {
          pc.addTrack(track, this.localStream!);
        }
      });
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    wsClient.send({
      type: 'webrtc_signal',
      targetUserId: peerId,
      signal: answer
    });
  }

  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections[peerId];
    if (pc && pc.signalingState !== 'stable') {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  private async handleCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections[peerId];
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Error adding ice candidate:', e);
      }
    }
  }

  public closePeer(peerId: string) {
    const pc = this.peerConnections[peerId];
    if (pc) {
      try {
        pc.close();
      } catch (e) {
        // ignore
      }
      delete this.peerConnections[peerId];
    }

    if (this.remoteStreams.has(peerId)) {
      this.remoteStreams.delete(peerId);
      this.remoteStreamRemovedListeners.forEach((listener) => {
        try {
          listener(peerId);
        } catch (e) {
          // ignore
        }
      });
    }
  }

  public closeAll() {
    for (const peerId of Object.keys(this.peerConnections)) {
      this.closePeer(peerId);
    }
    this.remoteStreams.clear();
  }
}

export const webrtcManager = new WebRTCManager();
