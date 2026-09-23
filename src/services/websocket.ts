import { GiftItem, SongItem, PrivateMessage, CamViewRequest } from '../types';

type MessageHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: any = null;
  private isConnected: boolean = false;
  public userId: string = '';
  public userName: string = '';
  public role: string = 'member';
  public vipTier: string = 'none';

  constructor() {
    this.connect();
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.emit('connection_status', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init_connection') {
            this.userId = data.userId;
            this.userName = data.userName;
            this.role = data.role || 'member';
            this.vipTier = data.vipTier || 'none';
          }
          this.emit(data.type, data);
        } catch (err) {
          console.error('Error parsing ws message', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection_status', { connected: false });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error, will reconnect', err);
        this.ws?.close();
      };
    } catch (err) {
      console.error('WebSocket connection initialization error:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  public on(event: string, handler: MessageHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emit(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(h => {
        try {
          h(data);
        } catch (e) {
          console.error(`Error in handler for ${event}`, e);
        }
      });
    }
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // --- ACTIONS ---
  public setProfile(name: string, avatar: string, role?: string, vipTier?: string) {
    this.userName = name;
    if (role) this.role = role;
    if (vipTier) this.vipTier = vipTier;
    this.send({ type: 'set_profile', name, avatar, role, vipTier });
  }

  public updateProfile(name: string, avatar: string) {
    this.setProfile(name, avatar);
  }

  public registerAccount(username: string, password: string, displayName?: string, avatar?: string) {
    this.send({ type: 'register_account', username, password, displayName, avatar });
  }

  public loginAccount(username: string, password: string) {
    this.send({ type: 'login_account', username, password });
  }

  public upgradeVIP(tier: 'silver' | 'gold' | 'diamond') {
    this.vipTier = tier;
    this.role = 'vip';
    this.send({ type: 'upgrade_vip', tier });
  }

  public joinRoom(roomId: string) {
    this.send({ type: 'join_room', roomId });
  }

  public leaveRoom() {
    this.send({ type: 'leave_room' });
  }

  public createRoom(roomData: {
    name: string;
    topic: string;
    category: string;
    password?: string;
    maxMicMinutes: number;
  }) {
    this.send({ type: 'create_room', ...roomData });
  }

  public updateRoomSettings(
    arg1: string | { maxMicMinutes?: number; name?: string; topic?: string; category?: string; isLocked?: boolean; password?: string; },
    arg2?: { maxMicMinutes?: number; name?: string; topic?: string; category?: string; isLocked?: boolean; password?: string; }
  ) {
    if (typeof arg1 === 'string') {
      this.send({ type: 'update_room_settings', roomId: arg1, ...arg2 });
    } else {
      this.send({ type: 'update_room_settings', ...arg1 });
    }
  }

  public queueMic(songData?: any) {
    this.send({ type: 'queue_mic', songData });
  }

  public sendWebRTCSignal(targetUserId: string, signal: any) {
    this.send({ type: 'webrtc_signal', targetUserId, signal });
  }

  public cancelQueue() {
    this.send({ type: 'cancel_queue' });
  }

  public releaseMic(forceByHost: boolean = false) {
    this.send({ type: 'release_mic', forceByHost });
  }

  public sendMessage(text: string) {
    this.send({ type: 'send_chat', text });
  }

  public sendPrivateMessage(targetUserId: string, targetUserName: string, text: string) {
    this.send({ type: 'send_private_message', targetUserId, targetUserName, text });
  }

  public sendGift(gift: GiftItem) {
    this.send({ type: 'send_gift', gift });
  }

  public triggerSoundEffect(effect: 'applause' | 'cheer' | 'laugh' | 'drum' | 'fanfare') {
    this.send({ type: 'sound_effect', effect });
  }

  public setMediaState(hasVideo: boolean, hasAudio: boolean, isStreaming: boolean) {
    this.send({ type: 'media_state_change', hasVideo, hasAudio, isStreaming });
  }

  // --- WEBCAM PERMISSIONS & ONCAM ---
  public toggleUserCam(isCamOn: boolean, autoAccept: boolean = false) {
    this.send({ type: 'toggle_user_cam', isCamOn, autoAccept });
  }

  public requestCamView(broadcasterId: string) {
    this.send({ type: 'request_cam_view', broadcasterId });
  }

  public respondCamView(requesterId: string, approved: boolean) {
    this.send({ type: 'respond_cam_view', requesterId, approved });
  }

  public controlKaraoke(action: string, payload?: any) {
    this.send({ type: 'karaoke_control', action, ...payload });
  }

  // --- ADMIN ACTIONS ---
  public adminGetAllData() {
    this.send({ type: 'admin_get_all_data' });
  }

  public adminManageRoom(roomId: string, action: 'delete' | 'reset_mic' | 'clear_queue' | 'update', roomData?: any) {
    this.send({ type: 'admin_manage_room', roomId, action, roomData });
  }

  public adminManageUser(targetUserId: string, action: 'set_role' | 'kick' | 'ban' | 'unban', role?: string, vipTier?: string, reason?: string) {
    this.send({ type: 'admin_manage_user', targetUserId, action, role, vipTier, reason });
  }
}

export const wsClient = new WebSocketClient();
