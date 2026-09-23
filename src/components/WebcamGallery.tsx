import React, { useState, useEffect, useRef } from 'react';
import {
  Video, VideoOff, Eye, ShieldCheck, Check, X, Users, Lock, Unlock, Sparkles, Volume2
} from 'lucide-react';
import { UserPresence, CamViewRequest } from '../types';
import { wsClient } from '../services/websocket';
import { webrtcManager } from '../services/webrtc';

interface WebcamGalleryProps {
  users: UserPresence[];
  localUserId: string;
  localVideoStream: MediaStream | null;
  isLocalCamOn: boolean;
  onToggleLocalCam: (enable: boolean, autoAccept: boolean) => void;
  vipTier: string;
}

const RemoteCamPlayer: React.FC<{
  stream?: MediaStream;
  avatar: string;
  userName: string;
}> = ({ stream, avatar, userName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  if (stream) {
    return (
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          WEBRTC LIVE
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <img
        src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
        alt={userName}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
      />
      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] text-emerald-400 font-bold flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        ONCAM HD
      </div>
    </div>
  );
};

export const WebcamGallery: React.FC<WebcamGalleryProps> = ({
  users,
  localUserId,
  localVideoStream,
  isLocalCamOn,
  onToggleLocalCam,
  vipTier
}) => {
  const [autoAccept, setAutoAccept] = useState(true);
  const [approvedBroadcasters, setApprovedBroadcasters] = useState<Set<string>>(new Set());
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [incomingRequests, setIncomingRequests] = useState<CamViewRequest[]>([]);
  const [remoteStreamsMap, setRemoteStreamsMap] = useState<Map<string, MediaStream>>(new Map());

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localVideoStream) {
      localVideoRef.current.srcObject = localVideoStream;
    }
  }, [localVideoStream]);

  // Track WebRTC remote streams
  useEffect(() => {
    const unsubStream = webrtcManager.onRemoteStream((peerId, stream) => {
      setRemoteStreamsMap((prev) => new Map(prev).set(peerId, stream));
    });

    const unsubRemove = webrtcManager.onRemoteStreamRemoved((peerId) => {
      setRemoteStreamsMap((prev) => {
        const next = new Map(prev);
        next.delete(peerId);
        return next;
      });
    });

    return () => {
      unsubStream();
      unsubRemove();
    };
  }, []);

  useEffect(() => {
    const unsubReq = wsClient.on('cam_view_request', (data) => {
      setIncomingRequests((prev) => [...prev, data.request]);
    });

    const unsubApp = wsClient.on('cam_view_approved', (data) => {
      setApprovedBroadcasters((prev) => new Set(prev).add(data.broadcasterId));
      setPendingRequests((prev) => {
        const next = new Set(prev);
        next.delete(data.broadcasterId);
        return next;
      });
      // Call WebRTC peer to connect video stream
      webrtcManager.callPeer(data.broadcasterId);
    });

    const unsubDec = wsClient.on('cam_view_declined', (data) => {
      setPendingRequests((prev) => {
        const next = new Set(prev);
        next.delete(data.broadcasterId);
        return next;
      });
      alert(`Ca sĩ ${data.broadcasterName} hiện chưa thể chia sẻ webcam.`);
    });

    return () => {
      unsubReq();
      unsubApp();
      unsubDec();
    };
  }, []);

  const broadcasters = users.filter((u) => u.isCamOn);

  // Auto connect peers who are broadcasting freely
  useEffect(() => {
    broadcasters.forEach((u) => {
      if (u.id !== localUserId && (u.camAutoAccept || u.camAllowedViewers?.includes('*'))) {
        webrtcManager.callPeer(u.id);
      }
    });
  }, [broadcasters.length, localUserId]);

  const handleRequestView = (broadcasterId: string) => {
    setPendingRequests((prev) => new Set(prev).add(broadcasterId));
    wsClient.requestCamView(broadcasterId);
  };

  const handleRespondRequest = (req: CamViewRequest, approved: boolean) => {
    wsClient.respondCamView(req.requesterId, approved);
    setIncomingRequests((prev) => prev.filter((r) => r.requestId !== req.requestId));
  };

  return (
    <div className="bg-[#0e1322] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      {/* Incoming Webcam Requests Popup */}
      {incomingRequests.length > 0 && (
        <div className="space-y-2 p-3 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 border border-amber-400/40 rounded-xl animate-in slide-in-from-top-2">
          {incomingRequests.map((req) => (
            <div key={req.requestId} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xl">📹</span>
                <span className="text-white">
                  <strong>{req.requesterName}</strong> muốn xin xem Webcam của bạn:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRespondRequest(req, true)}
                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Đồng Ý</span>
                </button>
                <button
                  onClick={() => handleRespondRequest(req, false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Từ Chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header & Local Cam Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Video className="w-4 h-4 text-amber-400" />
            <span>Webcam Thành Viên ({broadcasters.length} đang phát)</span>
          </h3>
          <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
            Tự động chia sẻ P2P giữa các trình duyệt
          </span>
        </div>

        {/* Cam Toggle Button & Auto Accept Option */}
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAccept}
              onChange={(e) => {
                const nextVal = e.target.checked;
                setAutoAccept(nextVal);
                if (isLocalCamOn) {
                  onToggleLocalCam(true, nextVal);
                }
              }}
              className="rounded bg-slate-900 border-slate-700 text-amber-400 focus:ring-0"
            />
            <span>Tự cho phép xem</span>
          </label>

          <button
            onClick={() => onToggleLocalCam(!isLocalCamOn, autoAccept)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isLocalCamOn
                ? 'bg-rose-500 text-white shadow-md shadow-rose-900/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isLocalCamOn ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span>{isLocalCamOn ? 'Tắt Webcam Của Tôi' : 'Mở Webcam Giao Lưu'}</span>
          </button>
        </div>
      </div>

      {/* Broadcasters Webcams Grid */}
      {broadcasters.length === 0 ? (
        <div className="py-6 text-center text-slate-500 space-y-1">
          <Video className="w-7 h-7 mx-auto opacity-30" />
          <p className="text-xs">Chưa có ai mở webcam trong phòng</p>
          <p className="text-[11px] text-slate-600">
            Bấm <strong>[Mở Webcam Giao Lưu]</strong> phía trên để bật camera trò chuyện cùng mọi người!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {broadcasters.map((u) => {
            const isMe = u.id === localUserId;
            const isApproved =
              isMe ||
              vipTier === 'diamond' ||
              u.camAutoAccept ||
              u.camAllowedViewers?.includes('*') ||
              u.camAllowedViewers?.includes(localUserId) ||
              approvedBroadcasters.has(u.id);

            const isPending = pendingRequests.has(u.id);
            const userRemoteStream = remoteStreamsMap.get(u.id);

            return (
              <div
                key={u.id}
                className="bg-[#0b0f1a] border border-slate-800 rounded-xl overflow-hidden flex flex-col group relative shadow-md"
              >
                {/* Video Area */}
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  {isMe && localVideoStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                  ) : isApproved ? (
                    <RemoteCamPlayer
                      stream={userRemoteStream}
                      avatar={u.avatar}
                      userName={u.name}
                    />
                  ) : (
                    /* Locked / Requires Request */
                    <div className="p-3 text-center space-y-2 flex flex-col items-center justify-center">
                      <Lock className="w-5 h-5 text-amber-400 opacity-80" />
                      <span className="text-[10px] text-slate-400">Webcam Riêng Tư</span>
                      {isPending ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold animate-pulse">
                          Đang xin phép...
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRequestView(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[10px] hover:bg-amber-300 transition-colors shadow-sm"
                        >
                          Xin Xem Webcam
                        </button>
                      )}
                    </div>
                  )}

                  {/* VIP diamond bypass badge */}
                  {vipTier === 'diamond' && !isMe && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-sky-500/80 text-white font-extrabold text-[8px] flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> VIP Diamond
                    </div>
                  )}
                </div>

                {/* Footer User Info */}
                <div className="p-2 bg-[#0d1220] flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 truncate text-[11px]">
                    {u.name} {isMe && '(Bạn)'}
                  </span>
                  {isApproved && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 shrink-0">
                      <Eye className="w-3 h-3" />
                      <span>Xem tự do</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
