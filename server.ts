import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { UserPresence, MicQueueItem, ChatMessage, RegisteredAccount, PrivateMessage, CamViewRequest, UserRole } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

export interface ExtendedUserPresence extends UserPresence {
  isCamOn?: boolean;
  camAllowedViewers?: string[];
  camAutoAccept?: boolean;
}

export interface RoomData {
  id: string;
  name: string;
  topic: string;
  category: string;
  hostId: string;
  hostName: string;
  isLocked: boolean;
  password?: string;
  maxMicMinutes: number;
  activeMicUser: ExtendedUserPresence | null;
  activeCoMicUser: ExtendedUserPresence | null;
  micStartedAt: number | null;
  micQueue: MicQueueItem[];
  users: Map<string, ExtendedUserPresence>;
  messages: ChatMessage[];
  currentSong: any | null;
}

// In-memory registered accounts with Super Mod, Mod & Admin credentials
const registeredAccounts = new Map<string, RegisteredAccount>([
  [
    'admin',
    {
      id: 'acc_admin',
      username: 'admin',
      password: 'admin123',
      displayName: 'Tổng Quản Trị Điệp Khúc',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      role: 'host', // Super Admin / Tổng Quản Trị
      vipTier: 'diamond',
      createdAt: Date.now() - 365 * 86400000,
      coins: 99999,
      status: 'active',
      note: 'Tài khoản Quản Trị Viên Tối Cao (Master Admin)'
    }
  ],
  [
    'supermod1',
    {
      id: 'acc_supermod1',
      username: 'supermod1',
      password: 'super123',
      displayName: 'Super Mod Quốc Bảo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: 'supermod', // Super Moderator / Tổng Quản Lý
      vipTier: 'diamond',
      createdAt: Date.now() - 120 * 86400000,
      coins: 35000,
      status: 'active',
      note: 'Tổng Quản Lý điều phối toàn hệ thống và các phòng hát'
    }
  ],
  [
    'mod1',
    {
      id: 'acc_mod1',
      username: 'mod1',
      password: 'mod123',
      displayName: 'Mod Minh Tuấn (Phòng 1)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      role: 'mod', // Moderator / Điều Hành Viên
      vipTier: 'gold',
      createdAt: Date.now() - 60 * 86400000,
      coins: 15000,
      status: 'active',
      note: 'Điều hành viên trực phòng Bolero & Nhạc Trữ Tình'
    }
  ],
  [
    'huonglan',
    {
      id: 'acc_singer1',
      username: 'huonglan',
      password: '123456',
      displayName: 'Hương Lan (Cần Thơ)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'vip',
      vipTier: 'gold',
      createdAt: Date.now() - 30 * 86400000,
      coins: 5200,
      status: 'active',
      note: 'Ca sĩ VIP thân thiết'
    }
  ]
]);

export interface BannedUserInfo {
  id: string;
  name: string;
  username?: string;
  reason: string;
  bannedAt: number;
  bannedBy: string;
}

const bannedUsers = new Map<string, BannedUserInfo>();

// Initial default rooms inspired by classic DiepKhuc
const initialRooms: RoomData[] = [
  {
    id: 'phong-1',
    name: '🎤 Hát Cho Nhau Nghe - Phòng 01',
    topic: 'Giao lưu giọng ca vàng Bolero & Nhạc Trữ Tình. Lịch sự, văn minh!',
    category: 'Âm Nhạc',
    hostId: 'acc_admin',
    hostName: 'Tổng Quản Trị Điệp Khúc',
    isLocked: false,
    maxMicMinutes: 3, // Default 3 mins for active rotation
    activeMicUser: {
      id: 'demo_singer_1',
      name: 'Hương Lan (Cần Thơ)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'vip',
      vipTier: 'gold',
      isMuted: false,
      hasVideo: true,
      hasAudio: true,
      isStreaming: true,
      isCamOn: true,
      camAllowedViewers: ['*'], // auto allow all
      camAutoAccept: true
    },
    activeCoMicUser: null,
    micStartedAt: Date.now() - 40000,
    micQueue: [
      {
        userId: 'queue_u1',
        userName: 'Quang Dũng Sài Gòn',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'member',
        vipTier: 'none',
        queuedAt: Date.now() - 30000
      },
      {
        userId: 'queue_u2',
        userName: 'Thùy Chi Hà Nội',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'vip',
        vipTier: 'silver',
        queuedAt: Date.now() - 15000
      }
    ],
    users: new Map([
      ['acc_admin', { id: 'acc_admin', name: 'Tổng Quản Trị Điệp Khúc', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', role: 'host', vipTier: 'diamond', isMuted: false, hasVideo: false, hasAudio: false, isStreaming: false, isCamOn: false, camAllowedViewers: [] }],
      ['demo_singer_1', { id: 'demo_singer_1', name: 'Hương Lan (Cần Thơ)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', role: 'vip', vipTier: 'gold', isMuted: false, hasVideo: true, hasAudio: true, isStreaming: true, isCamOn: true, camAllowedViewers: ['*'], camAutoAccept: true }],
      ['queue_u1', { id: 'queue_u1', name: 'Quang Dũng Sài Gòn', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', role: 'member', vipTier: 'none', isMuted: true, hasVideo: false, hasAudio: false, isStreaming: false, isCamOn: true, camAllowedViewers: [], camAutoAccept: false }],
      ['queue_u2', { id: 'queue_u2', name: 'Thùy Chi Hà Nội', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'vip', vipTier: 'silver', isMuted: true, hasVideo: false, hasAudio: false, isStreaming: false, isCamOn: false, camAllowedViewers: [] }]
    ]),
    messages: [
      {
        id: 'msg-1',
        roomId: 'phong-1',
        userId: 'system',
        userName: 'Hệ Thống Điệp Khúc',
        role: 'host',
        avatar: '',
        text: 'Chào mừng quý bạn bè đến với Phòng Hát Cho Nhau Nghe! Chúc mọi người có những phút giây thư giãn tuyệt vời!',
        type: 'system',
        timestamp: Date.now() - 120000
      },
      {
        id: 'msg-2',
        roomId: 'phong-1',
        userId: 'demo_singer_1',
        userName: 'Hương Lan (Cần Thơ)',
        role: 'vip',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        text: 'Em xin gửi tặng cả phòng ca khúc Duyên Phận ạ! Mọi người cổ vũ cho em nhé 💖',
        type: 'chat',
        timestamp: Date.now() - 40000
      }
    ],
    currentSong: {
      id: 'song-duyenphan',
      title: 'Duyên Phận',
      artist: 'Thái Châu / Như Quỳnh',
      isPlaying: true,
      currentTime: 45,
      updatedAt: Date.now()
    }
  },
  {
    id: 'phong-2',
    name: '🎸 Tuyệt Đỉnh Bolero & Dân Ca Ba Miền',
    topic: 'Nơi tụ hội những giọng ca trữ tình quê hương mượt mà, sâu lắng.',
    category: 'Bolero',
    hostId: 'host_bolero',
    hostName: 'Minh Tuấn Guitar',
    isLocked: false,
    maxMicMinutes: 4,
    activeMicUser: null,
    activeCoMicUser: null,
    micStartedAt: null,
    micQueue: [],
    users: new Map([
      ['host_bolero', { id: 'host_bolero', name: 'Minh Tuấn Guitar', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', role: 'host', vipTier: 'gold', isMuted: false, hasVideo: false, hasAudio: false, isStreaming: false, isCamOn: false, camAllowedViewers: [] }]
    ]),
    messages: [],
    currentSong: null
  },
  {
    id: 'phong-3',
    name: '🎧 Điệp Khúc DJ Bar - Nonstop Vinahouse',
    topic: 'Âm thanh cực đỉnh, ánh sáng sôi động! Quẩy hết mình cùng anh em!',
    category: 'DJ & Remix',
    hostId: 'host_dj',
    hostName: 'DJ Hoàng Anh Live',
    isLocked: false,
    maxMicMinutes: 6,
    activeMicUser: null,
    activeCoMicUser: null,
    micStartedAt: null,
    micQueue: [],
    users: new Map(),
    messages: [],
    currentSong: null
  },
  {
    id: 'phong-4',
    name: '☕ Góc Cà Phê Tâm Sự Bốn Phương',
    topic: 'Kết bạn bốn phương, giao lưu nói chuyện thân mật, lịch thiệp.',
    category: 'Tâm Sự',
    hostId: 'host_tamsu',
    hostName: 'Bảo Trâm (Hà Nội)',
    isLocked: false,
    maxMicMinutes: 5,
    activeMicUser: null,
    activeCoMicUser: null,
    micStartedAt: null,
    micQueue: [],
    users: new Map(),
    messages: [],
    currentSong: null
  }
];

const roomsMap = new Map<string, RoomData>();
initialRooms.forEach(room => roomsMap.set(room.id, room));

// Connected sockets state mapping: ws -> ClientContext
interface ClientContext {
  ws: WebSocket;
  userId: string;
  roomId: string | null;
  userName: string;
  avatar: string;
  role: UserRole;
  vipTier: 'none' | 'silver' | 'gold' | 'diamond';
  accountUsername?: string;
}

const clients = new Map<WebSocket, ClientContext>();

function getSerializedRoom(room: RoomData) {
  return {
    id: room.id,
    name: room.name,
    topic: room.topic,
    category: room.category,
    hostId: room.hostId,
    hostName: room.hostName,
    isLocked: room.isLocked,
    maxMicMinutes: room.maxMicMinutes,
    activeMicUser: room.activeMicUser,
    activeCoMicUser: room.activeCoMicUser,
    micStartedAt: room.micStartedAt,
    micQueue: room.micQueue,
    userCount: room.users.size,
    users: Array.from(room.users.values()),
    messages: room.messages.slice(-60),
    currentSong: room.currentSong
  };
}

function broadcastToRoom(roomId: string, data: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const [ws, ctx] of clients.entries()) {
    if (ctx.roomId === roomId && ws.readyState === WebSocket.OPEN && ws !== excludeWs) {
      ws.send(payload);
    }
  }
}

function broadcastRoomsList() {
  const list = Array.from(roomsMap.values()).map(r => ({
    id: r.id,
    name: r.name,
    topic: r.topic,
    category: r.category,
    hostName: r.hostName,
    isLocked: r.isLocked,
    maxMicMinutes: r.maxMicMinutes,
    userCount: r.users.size,
    queueCount: r.micQueue.length,
    activeSinger: r.activeMicUser?.name || null,
    openCamCount: Array.from(r.users.values()).filter(u => u.isCamOn).length
  }));
  const payload = JSON.stringify({ type: 'rooms_list', rooms: list });
  for (const [ws] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// SERVER TICKER: AUTOMATIC PASS MIC ON TIMEOUT!
// When singer reaches maxMicMinutes, automatically hand over mic to next person!
setInterval(() => {
  const now = Date.now();
  for (const room of roomsMap.values()) {
    if (room.activeMicUser && room.micStartedAt && room.maxMicMinutes > 0) {
      const elapsedSeconds = (now - room.micStartedAt) / 1000;
      const allowedSeconds = room.maxMicMinutes * 60;

      if (elapsedSeconds >= allowedSeconds) {
        // Time expired! Automatically transfer mic
        const prevUser = room.activeMicUser;
        if (room.users.has(prevUser.id)) {
          room.users.get(prevUser.id)!.isMuted = true;
        }

        let nextUser: ExtendedUserPresence | null = null;
        let nextSongData: any = null;
        if (room.micQueue.length > 0) {
          const nextQ = room.micQueue.shift()!;
          nextUser = room.users.get(nextQ.userId) || null;
          nextSongData = nextQ.songData || null;
          if (nextUser) {
            nextUser.isMuted = false;
            room.activeMicUser = nextUser;
            room.micStartedAt = Date.now();
            if (nextSongData) {
              room.currentSong = {
                ...nextSongData,
                isPlaying: true,
                currentTime: 0,
                updatedAt: Date.now(),
                singerId: nextUser.id,
                singerName: nextUser.name
              };
            }
          } else {
            room.activeMicUser = null;
            room.micStartedAt = null;
          }
        } else {
          room.activeMicUser = null;
          room.micStartedAt = null;
        }

        const timeoutMsg: ChatMessage = {
          id: 'sys_' + Date.now(),
          roomId: room.id,
          userId: 'system',
          userName: 'Hệ Thống Điệp Khúc',
          role: 'host',
          avatar: '',
          text: `⏰ Ca sĩ ${prevUser.name} đã hết thời gian biểu diễn (${room.maxMicMinutes} phút). ${
            nextUser
              ? `Micro tự động chuyển sang cho ${nextUser.name}! ${nextSongData ? `(Bài hát: ${nextSongData.title})` : ''}`
              : `Micro hiện đang trống, xin mời quý vị bấm [Cầm Mic]!`
          }`,
          type: 'action',
          timestamp: Date.now()
        };
        room.messages.push(timeoutMsg);
        if (room.messages.length > 100) room.messages.shift();

        broadcastToRoom(room.id, {
          type: 'mic_changed',
          activeMicUser: room.activeMicUser,
          micStartedAt: room.micStartedAt,
          micQueue: room.micQueue,
          message: timeoutMsg
        });

        if (nextSongData && room.currentSong) {
          broadcastToRoom(room.id, {
            type: 'karaoke_updated',
            currentSong: room.currentSong,
            action: 'select_song'
          });
        }
        broadcastRoomsList();
      }
    }
  }
}, 1000);

wss.on('connection', (ws) => {
  const ctx: ClientContext = {
    ws,
    userId: 'user_' + Math.random().toString(36).substring(2, 9),
    roomId: null,
    userName: 'Khách ' + Math.floor(100 + Math.random() * 900),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'member',
    vipTier: 'none'
  };
  clients.set(ws, ctx);

  // Send initial identity & rooms list
  ws.send(JSON.stringify({
    type: 'init_connection',
    userId: ctx.userId,
    userName: ctx.userName,
    role: ctx.role,
    vipTier: ctx.vipTier,
    rooms: Array.from(roomsMap.values()).map(r => ({
      id: r.id,
      name: r.name,
      topic: r.topic,
      category: r.category,
      hostName: r.hostName,
      isLocked: r.isLocked,
      maxMicMinutes: r.maxMicMinutes,
      userCount: r.users.size,
      queueCount: r.micQueue.length,
      activeSinger: r.activeMicUser?.name || null,
      openCamCount: Array.from(r.users.values()).filter(u => u.isCamOn).length
    }))
  }));

  ws.on('message', (rawData) => {
    try {
      const msg = JSON.parse(rawData.toString());

      switch (msg.type) {
        // --- AUTH & VIP REGISTRATION ---
        case 'register_account': {
          const { username, password, displayName, avatar } = msg;
          if (!username || !password) {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Tên đăng nhập và mật khẩu không được trống!' }));
            return;
          }
          if (registeredAccounts.has(username.toLowerCase())) {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Tên tài khoản này đã tồn tại!' }));
            return;
          }

          const newAcc: RegisteredAccount = {
            id: 'acc_' + Date.now(),
            username: username.toLowerCase(),
            displayName: displayName || username,
            avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            role: 'member',
            vipTier: 'none',
            createdAt: Date.now(),
            coins: 100
          };
          registeredAccounts.set(newAcc.username, newAcc);

          ctx.userId = newAcc.id;
          ctx.userName = newAcc.displayName;
          ctx.avatar = newAcc.avatar;
          ctx.role = newAcc.role;
          ctx.vipTier = newAcc.vipTier;
          ctx.accountUsername = newAcc.username;

          ws.send(JSON.stringify({
            type: 'auth_success',
            account: newAcc
          }));
          break;
        }

        case 'login_account': {
          const { username, password } = msg;
          const acc = registeredAccounts.get(username?.toLowerCase()?.trim());
          if (!acc) {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Tài khoản không tồn tại!' }));
            return;
          }

          if (acc.password && acc.password !== password) {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Mật khẩu không chính xác!' }));
            return;
          }

          if (acc.status === 'suspended') {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Tài khoản này hiện đang bị tạm khóa!' }));
            return;
          }

          ctx.userId = acc.id;
          ctx.userName = acc.displayName;
          ctx.avatar = acc.avatar;
          ctx.role = acc.role;
          ctx.vipTier = acc.vipTier;
          ctx.accountUsername = acc.username;

          const { password: _, ...safeAcc } = acc;
          ws.send(JSON.stringify({
            type: 'auth_success',
            account: safeAcc
          }));
          break;
        }

        case 'upgrade_vip': {
          const tier = msg.tier as 'silver' | 'gold' | 'diamond';
          ctx.vipTier = tier;
          ctx.role = 'vip';

          if (ctx.accountUsername && registeredAccounts.has(ctx.accountUsername)) {
            const acc = registeredAccounts.get(ctx.accountUsername)!;
            acc.vipTier = tier;
            acc.role = 'vip';
            acc.coins += tier === 'diamond' ? 2000 : tier === 'gold' ? 800 : 300;
          }

          if (ctx.roomId) {
            const room = roomsMap.get(ctx.roomId);
            if (room && room.users.has(ctx.userId)) {
              const u = room.users.get(ctx.userId)!;
              u.role = 'vip';
              u.vipTier = tier;

              const vipCelebration: ChatMessage = {
                id: 'sys_' + Date.now(),
                roomId: room.id,
                userId: 'system',
                userName: 'Hệ Thống Điệp Khúc',
                role: 'host',
                avatar: '',
                text: `🎉 Chúc mừng ${ctx.userName} vừa nâng cấp thành công danh hiệu ${
                  tier === 'diamond' ? '👑 VIP KIM CƯƠNG' : tier === 'gold' ? '🌟 VIP VÀNG' : '🥈 VIP BẠC'
                }!`,
                type: 'action',
                timestamp: Date.now()
              };
              room.messages.push(vipCelebration);

              broadcastToRoom(room.id, {
                type: 'user_updated',
                user: u,
                message: vipCelebration
              });
            }
          }

          ws.send(JSON.stringify({
            type: 'vip_upgraded',
            vipTier: tier,
            role: 'vip'
          }));
          break;
        }

        // --- UPDATE ROOM SETTINGS (MIC TIME & DETAILS) ---
        case 'update_room_settings': {
          if (!ctx.roomId) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;

          // Host, Super Mod, Mod or room creator can edit
          const isStaff = ctx.role === 'host' || ctx.role === 'supermod' || ctx.role === 'mod';
          if (room.hostId !== ctx.userId && !isStaff) {
            ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc ban quản trị mới có quyền sửa thông tin phòng!' }));
            return;
          }

          const oldTime = room.maxMicMinutes;
          if (typeof msg.maxMicMinutes === 'number' && msg.maxMicMinutes > 0) {
            room.maxMicMinutes = Number(msg.maxMicMinutes);
          }
          if (msg.name?.trim()) room.name = msg.name.trim();
          if (msg.topic?.trim()) room.topic = msg.topic.trim();
          if (msg.category) room.category = msg.category;
          if (typeof msg.isLocked === 'boolean') room.isLocked = msg.isLocked;
          if (msg.password !== undefined) room.password = msg.password ? msg.password.trim() : undefined;

          const updateMsg: ChatMessage = {
            id: 'sys_' + Date.now(),
            roomId: room.id,
            userId: ctx.userId,
            userName: ctx.userName,
            role: ctx.role,
            avatar: ctx.avatar,
            text: `⚙️ ${ctx.userName} đã cập nhật thông tin phòng. Thời gian cầm mic: ${room.maxMicMinutes} phút/lượt.`,
            type: 'system',
            timestamp: Date.now()
          };
          room.messages.push(updateMsg);

          broadcastToRoom(room.id, {
            type: 'room_settings_updated',
            room: getSerializedRoom(room),
            message: updateMsg
          });
          broadcastRoomsList();
          break;
        }

        // --- PRIVATE CHAT (PM) ---
        case 'send_private_message': {
          const { targetUserId, text } = msg;
          if (!targetUserId || !text?.trim()) return;

          const pm: PrivateMessage = {
            id: 'pm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            senderId: ctx.userId,
            senderName: ctx.userName,
            senderAvatar: ctx.avatar,
            receiverId: targetUserId,
            receiverName: msg.targetUserName || 'Thành viên',
            text: text.trim(),
            timestamp: Date.now()
          };

          // Send to sender
          ws.send(JSON.stringify({ type: 'private_message', message: pm }));

          // Send to recipient
          for (const [targetWs, targetCtx] of clients.entries()) {
            if (targetCtx.userId === targetUserId && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({ type: 'private_message', message: pm }));
              break;
            }
          }
          break;
        }

        // --- ONCAM & WEBCAM PERMISSIONS ---
        case 'toggle_user_cam': {
          if (!ctx.roomId) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;

          const u = room.users.get(ctx.userId);
          if (u) {
            u.isCamOn = !!msg.isCamOn;
            u.camAutoAccept = !!msg.autoAccept;
            if (u.camAutoAccept) {
              u.camAllowedViewers = ['*'];
            } else if (!u.camAllowedViewers) {
              u.camAllowedViewers = [];
            }

            broadcastToRoom(room.id, {
              type: 'user_cam_updated',
              userId: ctx.userId,
              userName: ctx.userName,
              avatar: ctx.avatar,
              isCamOn: u.isCamOn,
              camAutoAccept: u.camAutoAccept,
              camAllowedViewers: u.camAllowedViewers
            });
            broadcastRoomsList();
          }
          break;
        }

        case 'request_cam_view': {
          const { broadcasterId } = msg;
          if (!broadcasterId || !ctx.roomId) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;

          const broadcaster = room.users.get(broadcasterId);
          if (!broadcaster || !broadcaster.isCamOn) return;

          // If broadcaster auto accepts or allows all, or if user is diamond VIP, instantly approve!
          if (broadcaster.camAutoAccept || broadcaster.camAllowedViewers?.includes('*') || ctx.vipTier === 'diamond') {
            if (!broadcaster.camAllowedViewers) broadcaster.camAllowedViewers = [];
            if (!broadcaster.camAllowedViewers.includes(ctx.userId)) {
              broadcaster.camAllowedViewers.push(ctx.userId);
            }
            ws.send(JSON.stringify({
              type: 'cam_view_approved',
              broadcasterId,
              broadcasterName: broadcaster.name
            }));
            return;
          }

          // Otherwise forward permission request to broadcaster
          for (const [targetWs, targetCtx] of clients.entries()) {
            if (targetCtx.userId === broadcasterId && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({
                type: 'cam_view_request',
                request: {
                  requestId: 'req_' + Date.now(),
                  requesterId: ctx.userId,
                  requesterName: ctx.userName,
                  requesterAvatar: ctx.avatar,
                  broadcasterId,
                  timestamp: Date.now()
                }
              }));
              break;
            }
          }
          break;
        }

        case 'respond_cam_view': {
          const { requesterId, approved } = msg;
          if (!requesterId || !ctx.roomId) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;

          const broadcaster = room.users.get(ctx.userId);
          if (broadcaster && approved) {
            if (!broadcaster.camAllowedViewers) broadcaster.camAllowedViewers = [];
            if (!broadcaster.camAllowedViewers.includes(requesterId)) {
              broadcaster.camAllowedViewers.push(requesterId);
            }
          }

          for (const [targetWs, targetCtx] of clients.entries()) {
            if (targetCtx.userId === requesterId && targetWs.readyState === WebSocket.OPEN) {
              if (approved) {
                targetWs.send(JSON.stringify({
                  type: 'cam_view_approved',
                  broadcasterId: ctx.userId,
                  broadcasterName: ctx.userName
                }));
              } else {
                targetWs.send(JSON.stringify({
                  type: 'cam_view_declined',
                  broadcasterId: ctx.userId,
                  broadcasterName: ctx.userName
                }));
              }
              break;
            }
          }
          break;
        }

        // --- ADMIN DASHBOARD ACTIONS ---
        case 'admin_get_all_data': {
          const allRooms = Array.from(roomsMap.values()).map(r => ({
            id: r.id,
            name: r.name,
            topic: r.topic,
            category: r.category,
            hostId: r.hostId,
            hostName: r.hostName,
            isLocked: r.isLocked,
            maxMicMinutes: r.maxMicMinutes,
            userCount: r.users.size,
            queueCount: r.micQueue.length,
            activeSinger: r.activeMicUser?.name || null,
            micStartedAt: r.micStartedAt
          }));

          const allUsers = Array.from(clients.values()).map(c => {
            const userRoom = c.roomId ? roomsMap.get(c.roomId) : null;
            return {
              id: c.userId,
              name: c.userName,
              avatar: c.avatar,
              role: c.role,
              vipTier: c.vipTier,
              roomId: c.roomId,
              roomName: userRoom ? userRoom.name : null,
              accountUsername: c.accountUsername,
              isSinging: userRoom ? userRoom.activeMicUser?.id === c.userId : false,
              inQueue: userRoom ? userRoom.micQueue.some(q => q.userId === c.userId) : false,
              isCamOn: userRoom ? userRoom.users.get(c.userId)?.isCamOn || false : false
            };
          });

          const allAccounts = Array.from(registeredAccounts.values());
          const allBanned = Array.from(new Set(bannedUsers.values()));

          ws.send(JSON.stringify({
            type: 'admin_data_response',
            rooms: allRooms,
            onlineUsers: allUsers,
            accounts: allAccounts,
            bannedUsers: allBanned
          }));
          break;
        }

        case 'admin_manage_room': {
          const { roomId, action, roomData } = msg;
          const room = roomsMap.get(roomId);
          if (!room) return;

          if (action === 'delete') {
            roomsMap.delete(roomId);
            broadcastRoomsList();
          } else if (action === 'reset_mic') {
            room.activeMicUser = null;
            room.micStartedAt = null;
            broadcastToRoom(roomId, {
              type: 'mic_changed',
              activeMicUser: null,
              micStartedAt: null,
              micQueue: room.micQueue
            });
            broadcastRoomsList();
          } else if (action === 'clear_queue') {
            room.micQueue = [];
            broadcastToRoom(roomId, {
              type: 'queue_updated',
              micQueue: []
            });
            broadcastRoomsList();
          } else if (action === 'update' && roomData) {
            if (roomData.name) room.name = roomData.name;
            if (roomData.topic) room.topic = roomData.topic;
            if (roomData.category) room.category = roomData.category;
            if (typeof roomData.maxMicMinutes === 'number') room.maxMicMinutes = roomData.maxMicMinutes;
            if (typeof roomData.isLocked === 'boolean') room.isLocked = roomData.isLocked;

            broadcastToRoom(roomId, {
              type: 'room_settings_updated',
              room: getSerializedRoom(room)
            });
            broadcastRoomsList();
          }
          break;
        }

        case 'admin_manage_user': {
          const { targetUserId, action, role, vipTier, reason } = msg;

          // Unban user action
          if (action === 'unban') {
            bannedUsers.delete(targetUserId);
            for (const [k, b] of bannedUsers.entries()) {
              if (b.id === targetUserId || (b.username && b.username.toLowerCase() === targetUserId.toLowerCase())) {
                bannedUsers.delete(k);
                if (b.username && registeredAccounts.has(b.username.toLowerCase())) {
                  registeredAccounts.get(b.username.toLowerCase())!.status = 'active';
                }
              }
            }
            break;
          }

          for (const [targetWs, targetCtx] of clients.entries()) {
            if (targetCtx.userId === targetUserId) {
              if (action === 'set_role' && role) {
                targetCtx.role = role as UserRole;
                if (vipTier) targetCtx.vipTier = vipTier;

                if (targetCtx.accountUsername && registeredAccounts.has(targetCtx.accountUsername)) {
                  const acc = registeredAccounts.get(targetCtx.accountUsername)!;
                  acc.role = role as UserRole;
                  if (vipTier) acc.vipTier = vipTier;
                }

                if (targetCtx.roomId) {
                  const room = roomsMap.get(targetCtx.roomId);
                  if (room && room.users.has(targetUserId)) {
                    const u = room.users.get(targetUserId)!;
                    u.role = role as UserRole;
                    if (vipTier) u.vipTier = vipTier;
                    broadcastToRoom(targetCtx.roomId, {
                      type: 'user_updated',
                      user: u
                    });
                  }
                }
                targetWs.send(JSON.stringify({
                  type: 'user_role_changed',
                  role,
                  vipTier: targetCtx.vipTier
                }));
              } else if (action === 'kick') {
                const kickReason = reason || 'Quản trị viên đã mời bạn ra khỏi phòng!';
                targetWs.send(JSON.stringify({
                  type: 'kicked_by_admin',
                  reason: kickReason
                }));

                if (targetCtx.roomId) {
                  const currentRoomId = targetCtx.roomId;
                  const room = roomsMap.get(currentRoomId);
                  if (room) {
                    const kickNotice: ChatMessage = {
                      id: 'sys_' + Date.now(),
                      roomId: currentRoomId,
                      userId: 'system',
                      userName: 'Hệ Thống Điệp Khúc',
                      role: 'host',
                      avatar: '',
                      text: `⚠️ Quản trị viên đã mời ${targetCtx.userName} rời khỏi phòng. Lý do: ${kickReason}`,
                      type: 'system',
                      timestamp: Date.now()
                    };
                    room.messages.push(kickNotice);
                    broadcastToRoom(currentRoomId, {
                      type: 'chat_message',
                      message: kickNotice
                    });
                  }
                }
                leaveCurrentRoom(targetCtx);
                broadcastRoomsList();
              } else if (action === 'ban') {
                const banReason = reason || 'Vi phạm nghiêm trọng nội quy hệ thống Điệp Khúc';
                const banData: BannedUserInfo = {
                  id: targetCtx.userId,
                  name: targetCtx.userName,
                  username: targetCtx.accountUsername,
                  reason: banReason,
                  bannedAt: Date.now(),
                  bannedBy: ctx.userName || 'Quản Trị Viên'
                };
                bannedUsers.set(targetCtx.userId, banData);
                if (targetCtx.accountUsername) {
                  bannedUsers.set(targetCtx.accountUsername.toLowerCase(), banData);
                  if (registeredAccounts.has(targetCtx.accountUsername.toLowerCase())) {
                    registeredAccounts.get(targetCtx.accountUsername.toLowerCase())!.status = 'suspended';
                  }
                }

                targetWs.send(JSON.stringify({
                  type: 'banned_by_admin',
                  reason: banReason,
                  bannedAt: banData.bannedAt,
                  bannedBy: banData.bannedBy
                }));

                if (targetCtx.roomId) {
                  const currentRoomId = targetCtx.roomId;
                  const room = roomsMap.get(currentRoomId);
                  if (room) {
                    const banNotice: ChatMessage = {
                      id: 'sys_' + Date.now(),
                      roomId: currentRoomId,
                      userId: 'system',
                      userName: 'Hệ Thống Điệp Khúc',
                      role: 'host',
                      avatar: '',
                      text: `🚫 [CẤM TRUY CẬP] Quản trị viên đã cấm (Ban) tài khoản ${targetCtx.userName}. Lý do: ${banReason}`,
                      type: 'system',
                      timestamp: Date.now()
                    };
                    room.messages.push(banNotice);
                    broadcastToRoom(currentRoomId, {
                      type: 'chat_message',
                      message: banNotice
                    });
                  }
                }

                leaveCurrentRoom(targetCtx);
                broadcastRoomsList();
              }
              break;
            }
          }
          break;
        }

        // --- EXISTING WS EVENTS ---
        case 'set_profile': {
          ctx.userName = msg.name || ctx.userName;
          ctx.avatar = msg.avatar || ctx.avatar;
          if (msg.role) ctx.role = msg.role;
          if (msg.vipTier) ctx.vipTier = msg.vipTier;
          if (ctx.roomId) {
            const room = roomsMap.get(ctx.roomId);
            if (room && room.users.has(ctx.userId)) {
              const u = room.users.get(ctx.userId)!;
              u.name = ctx.userName;
              u.avatar = ctx.avatar;
              u.role = ctx.role;
              u.vipTier = ctx.vipTier;
              broadcastToRoom(ctx.roomId, {
                type: 'user_updated',
                user: u
              });
            }
          }
          break;
        }

        case 'join_room': {
          const targetRoomId = msg.roomId;
          const room = roomsMap.get(targetRoomId);
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Phòng không tồn tại!' }));
            return;
          }

          if (bannedUsers.has(ctx.userId) || (ctx.accountUsername && bannedUsers.has(ctx.accountUsername.toLowerCase()))) {
            const ban = bannedUsers.get(ctx.userId) || bannedUsers.get(ctx.accountUsername!.toLowerCase());
            ws.send(JSON.stringify({
              type: 'banned_by_admin',
              reason: ban?.reason || 'Bạn đã bị cấm tham gia các phòng hát!',
              bannedAt: ban?.bannedAt,
              bannedBy: ban?.bannedBy
            }));
            return;
          }

          if (ctx.roomId && ctx.roomId !== targetRoomId) {
            leaveCurrentRoom(ctx);
          }

          ctx.roomId = targetRoomId;
          const userPresence: ExtendedUserPresence = {
            id: ctx.userId,
            name: ctx.userName,
            avatar: ctx.avatar,
            role: ctx.userId === room.hostId ? 'host' : ctx.role,
            vipTier: ctx.vipTier,
            isMuted: true,
            hasVideo: false,
            hasAudio: false,
            isStreaming: false,
            isCamOn: false,
            camAllowedViewers: []
          };
          room.users.set(ctx.userId, userPresence);

          const joinMsg: ChatMessage = {
            id: 'sys_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            roomId: targetRoomId,
            userId: ctx.userId,
            userName: ctx.userName,
            role: userPresence.role,
            vipTier: userPresence.vipTier,
            avatar: ctx.avatar,
            text: `${ctx.userName} vừa vào phòng chat`,
            type: 'system',
            timestamp: Date.now()
          };
          room.messages.push(joinMsg);
          if (room.messages.length > 100) room.messages.shift();

          ws.send(JSON.stringify({
            type: 'room_joined',
            room: getSerializedRoom(room)
          }));

          broadcastToRoom(targetRoomId, {
            type: 'user_joined',
            user: userPresence,
            message: joinMsg
          }, ws);

          broadcastRoomsList();
          break;
        }

        case 'leave_room': {
          leaveCurrentRoom(ctx);
          broadcastRoomsList();
          break;
        }

        case 'queue_mic': {
          if (!ctx.roomId) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;

          if (room.activeMicUser?.id === ctx.userId) return;
          if (room.micQueue.some(q => q.userId === ctx.userId)) return;

          const chosenSong = msg.songData || null;

          if (!room.activeMicUser) {
            const user = room.users.get(ctx.userId);
            if (user) {
              user.isMuted = false;
              room.activeMicUser = user;
              room.micStartedAt = Date.now();

              if (chosenSong) {
                room.currentSong = {
                  ...chosenSong,
                  source: chosenSong.source || 'diepkhuc',
                  isPlaying: true,
                  currentTime: 0,
                  updatedAt: Date.now(),
                  singerId: ctx.userId,
                  singerName: ctx.userName
                };
              }

              const micMsg: ChatMessage = {
                id: 'sys_' + Date.now(),
                roomId: room.id,
                userId: ctx.userId,
                userName: ctx.userName,
                role: user.role,
                vipTier: user.vipTier,
                avatar: ctx.avatar,
                text: `🎤 ${ctx.userName} đang giữ Micro và biểu diễn trên sân khấu! ${
                  chosenSong ? `(Bài hát: ${chosenSong.title}${chosenSong.source === 'youtube' ? ' - YouTube Karaoke' : ''})` : ''
                } - Thời gian: ${room.maxMicMinutes} phút`,
                type: 'action',
                timestamp: Date.now()
              };
              room.messages.push(micMsg);

              broadcastToRoom(room.id, {
                type: 'mic_changed',
                activeMicUser: room.activeMicUser,
                micStartedAt: room.micStartedAt,
                micQueue: room.micQueue,
                message: micMsg
              });

              if (room.currentSong) {
                broadcastToRoom(room.id, {
                  type: 'karaoke_updated',
                  currentSong: room.currentSong,
                  action: 'select_song'
                });
              }

              broadcastRoomsList();
              return;
            }
          }

          const queueItem: MicQueueItem = {
            userId: ctx.userId,
            userName: ctx.userName,
            avatar: ctx.avatar,
            role: ctx.role,
            vipTier: ctx.vipTier,
            queuedAt: Date.now(),
            songData: chosenSong
          };

          // VIP users get front priority in queue!
          if (ctx.vipTier === 'diamond' || ctx.vipTier === 'gold') {
            const firstNonVip = room.micQueue.findIndex(q => q.vipTier !== 'diamond' && q.vipTier !== 'gold');
            if (firstNonVip !== -1) {
              room.micQueue.splice(firstNonVip, 0, queueItem);
            } else {
              room.micQueue.push(queueItem);
            }
          } else {
            room.micQueue.push(queueItem);
          }

          broadcastToRoom(room.id, {
            type: 'queue_updated',
            micQueue: room.micQueue,
            message: {
              id: 'sys_' + Date.now(),
              roomId: room.id,
              userId: ctx.userId,
              userName: ctx.userName,
              role: ctx.role,
              vipTier: ctx.vipTier,
              avatar: ctx.avatar,
              text: `${ctx.userName} đã xếp hàng giữ mic (#${room.micQueue.findIndex(q => q.userId === ctx.userId) + 1}) ${
                chosenSong ? `[Bài hát: ${chosenSong.title}]` : ''
              }`,
              type: 'system',
              timestamp: Date.now()
            }
          });
          break;
        }

        case 'cancel_queue': {
          if (!ctx.roomId) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;

          room.micQueue = room.micQueue.filter(q => q.userId !== ctx.userId);
          broadcastToRoom(room.id, {
            type: 'queue_updated',
            micQueue: room.micQueue
          });
          break;
        }

        case 'release_mic': {
          if (!ctx.roomId) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;

          if (room.activeMicUser?.id === ctx.userId || msg.forceByHost) {
            const prevUser = room.activeMicUser;
            if (prevUser && room.users.has(prevUser.id)) {
              room.users.get(prevUser.id)!.isMuted = true;
            }

            let nextSongData: any = null;
            if (room.micQueue.length > 0) {
              const nextQueue = room.micQueue.shift()!;
              const nextUser = room.users.get(nextQueue.userId);
              nextSongData = nextQueue.songData || null;

              if (nextUser) {
                nextUser.isMuted = false;
                room.activeMicUser = nextUser;
                room.micStartedAt = Date.now();

                if (nextSongData) {
                  room.currentSong = {
                    ...nextSongData,
                    source: nextSongData.source || 'diepkhuc',
                    isPlaying: true,
                    currentTime: 0,
                    updatedAt: Date.now(),
                    singerId: nextUser.id,
                    singerName: nextUser.name
                  };
                }
              } else {
                room.activeMicUser = null;
                room.micStartedAt = null;
              }
            } else {
              room.activeMicUser = null;
              room.micStartedAt = null;
            }

            const changeMsg: ChatMessage = {
              id: 'sys_' + Date.now(),
              roomId: room.id,
              userId: ctx.userId,
              userName: ctx.userName,
              role: ctx.role,
              avatar: ctx.avatar,
              text: room.activeMicUser
                ? `🎤 Micro đã được chuyển giao cho ${room.activeMicUser.name}! ${nextSongData ? `(Bài hát: ${nextSongData.title})` : ''} - (${room.maxMicMinutes} phút)`
                : `Micro hiện đang trống, xin mời quý vị bấm [Cầm Mic]!`,
              type: 'system',
              timestamp: Date.now()
            };
            room.messages.push(changeMsg);

            broadcastToRoom(room.id, {
              type: 'mic_changed',
              activeMicUser: room.activeMicUser,
              micStartedAt: room.micStartedAt,
              micQueue: room.micQueue,
              message: changeMsg
            });

            if (nextSongData && room.currentSong) {
              broadcastToRoom(room.id, {
                type: 'karaoke_updated',
                currentSong: room.currentSong,
                action: 'select_song'
              });
            }

            broadcastRoomsList();
          }
          break;
        }

        case 'send_chat': {
          if (!ctx.roomId || !msg.text?.trim()) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;

          const chatMsg: ChatMessage = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            roomId: room.id,
            userId: ctx.userId,
            userName: ctx.userName,
            role: ctx.role,
            vipTier: ctx.vipTier,
            avatar: ctx.avatar,
            text: msg.text.trim(),
            type: 'chat',
            timestamp: Date.now()
          };
          room.messages.push(chatMsg);
          if (room.messages.length > 100) room.messages.shift();

          broadcastToRoom(room.id, {
            type: 'new_message',
            message: chatMsg
          });
          break;
        }

        case 'send_gift': {
          if (!ctx.roomId || !msg.gift) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;

          const giftMsg: ChatMessage = {
            id: 'gift_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            roomId: room.id,
            userId: ctx.userId,
            userName: ctx.userName,
            role: ctx.role,
            vipTier: ctx.vipTier,
            avatar: ctx.avatar,
            text: `${ctx.userName} vừa tặng ${msg.gift.name} ${msg.gift.icon} cho sân khấu!`,
            type: 'gift',
            gift: msg.gift,
            timestamp: Date.now()
          };
          room.messages.push(giftMsg);
          if (room.messages.length > 100) room.messages.shift();

          broadcastToRoom(room.id, {
            type: 'gift_sent',
            gift: msg.gift,
            sender: { id: ctx.userId, name: ctx.userName, avatar: ctx.avatar },
            receiver: room.activeMicUser ? { id: room.activeMicUser.id, name: room.activeMicUser.name } : null,
            message: giftMsg
          });
          break;
        }

        case 'sound_effect': {
          if (!ctx.roomId) return;
          broadcastToRoom(ctx.roomId, {
            type: 'play_sound_effect',
            effect: msg.effect,
            senderName: ctx.userName
          });
          break;
        }

        case 'media_state_change': {
          if (!ctx.roomId) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;
          const u = room.users.get(ctx.userId);
          if (u) {
            if (typeof msg.hasVideo === 'boolean') u.hasVideo = msg.hasVideo;
            if (typeof msg.hasAudio === 'boolean') u.hasAudio = msg.hasAudio;
            if (typeof msg.isStreaming === 'boolean') u.isStreaming = msg.isStreaming;

            if (room.activeMicUser?.id === ctx.userId) {
              room.activeMicUser.hasVideo = u.hasVideo;
              room.activeMicUser.hasAudio = u.hasAudio;
              room.activeMicUser.isStreaming = u.isStreaming;
            }

            broadcastToRoom(ctx.roomId, {
              type: 'media_state_updated',
              userId: ctx.userId,
              hasVideo: u.hasVideo,
              hasAudio: u.hasAudio,
              isStreaming: u.isStreaming
            });
          }
          break;
        }

        // --- WEBRTC P2P SIGNALING (VIDEO & AUDIO STREAMING) ---
        case 'webrtc_signal': {
          const { targetUserId, signal } = msg;
          if (!targetUserId || !signal || !ctx.roomId) return;
          for (const [targetWs, targetCtx] of clients.entries()) {
            if (targetCtx.userId === targetUserId && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({
                type: 'webrtc_signal',
                fromUserId: ctx.userId,
                fromUserName: ctx.userName,
                signal
              }));
              break;
            }
          }
          break;
        }

        case 'karaoke_control': {
          if (!ctx.roomId) return;
          const room = roomsMap.get(ctx.roomId);
          if (!room) return;

          if (msg.action === 'select_song' && msg.song) {
            room.currentSong = {
              id: msg.song.id,
              title: msg.song.title,
              artist: msg.song.artist,
              source: msg.song.source || (msg.song.youtubeId ? 'youtube' : 'diepkhuc'),
              youtubeId: msg.song.youtubeId,
              youtubeUrl: msg.song.youtubeUrl,
              genre: msg.song.genre,
              tempo: msg.song.tempo,
              key: msg.song.key,
              lyrics: msg.song.lyrics,
              isPlaying: true,
              currentTime: 0,
              updatedAt: Date.now(),
              singerId: ctx.userId,
              singerName: ctx.userName
            };
          } else if (msg.action === 'toggle_play' && room.currentSong) {
            room.currentSong.isPlaying = msg.isPlaying;
            room.currentSong.currentTime = msg.currentTime !== undefined ? msg.currentTime : room.currentSong.currentTime;
            room.currentSong.updatedAt = Date.now();
          } else if (msg.action === 'stop') {
            room.currentSong = null;
          }

          broadcastToRoom(ctx.roomId, {
            type: 'karaoke_updated',
            currentSong: room.currentSong,
            action: msg.action
          });
          break;
        }

        case 'create_room': {
          const newRoomId = 'phong_' + Date.now();
          const newRoom: RoomData = {
            id: newRoomId,
            name: msg.name?.trim() || `Phòng Ca Nhạc của ${ctx.userName}`,
            topic: msg.topic?.trim() || 'Hát cho nhau nghe, giao lưu kết bạn',
            category: msg.category || 'Âm Nhạc',
            hostId: ctx.userId,
            hostName: ctx.userName,
            isLocked: !!msg.password,
            password: msg.password || undefined,
            maxMicMinutes: Number(msg.maxMicMinutes) || 5,
            activeMicUser: null,
            activeCoMicUser: null,
            micStartedAt: null,
            micQueue: [],
            users: new Map(),
            messages: [{
              id: 'sys_' + Date.now(),
              roomId: newRoomId,
              userId: 'system',
              userName: 'Hệ Thống',
              role: 'host',
              avatar: '',
              text: `Chào mừng bạn đến với phòng "${msg.name}". Hãy mời bạn bè cùng vào hát nào!`,
              type: 'system',
              timestamp: Date.now()
            }],
            currentSong: null
          };

          roomsMap.set(newRoomId, newRoom);
          ws.send(JSON.stringify({
            type: 'room_created',
            roomId: newRoomId
          }));
          broadcastRoomsList();
          break;
        }
      }
    } catch (err) {
      console.error('Error handling ws message:', err);
    }
  });

  ws.on('close', () => {
    leaveCurrentRoom(ctx);
    clients.delete(ws);
    broadcastRoomsList();
  });
});

function leaveCurrentRoom(ctx: ClientContext) {
  if (!ctx.roomId) return;
  const room = roomsMap.get(ctx.roomId);
  if (room) {
    room.users.delete(ctx.userId);
    room.micQueue = room.micQueue.filter(q => q.userId !== ctx.userId);

    if (room.activeMicUser?.id === ctx.userId) {
      if (room.micQueue.length > 0) {
        const next = room.micQueue.shift()!;
        const nextUser = room.users.get(next.userId);
        if (nextUser) {
          nextUser.isMuted = false;
          room.activeMicUser = nextUser;
          room.micStartedAt = Date.now();
        } else {
          room.activeMicUser = null;
          room.micStartedAt = null;
        }
      } else {
        room.activeMicUser = null;
        room.micStartedAt = null;
      }

      broadcastToRoom(room.id, {
        type: 'mic_changed',
        activeMicUser: room.activeMicUser,
        micStartedAt: room.micStartedAt,
        micQueue: room.micQueue
      });
    }

    const leaveMsg: ChatMessage = {
      id: 'sys_' + Date.now(),
      roomId: room.id,
      userId: ctx.userId,
      userName: ctx.userName,
      role: ctx.role,
      avatar: ctx.avatar,
      text: `${ctx.userName} đã rời phòng chat`,
      type: 'system',
      timestamp: Date.now()
    };
    room.messages.push(leaveMsg);

    broadcastToRoom(room.id, {
      type: 'user_left',
      userId: ctx.userId,
      userName: ctx.userName,
      message: leaveMsg
    });
  }
  ctx.roomId = null;
}

function syncUserRoleToActiveSockets(username: string, newRole: UserRole, newVipTier?: string, newName?: string, newAvatar?: string) {
  for (const [ws, ctx] of clients.entries()) {
    if (ctx.accountUsername?.toLowerCase() === username.toLowerCase()) {
      ctx.role = newRole;
      if (newVipTier) ctx.vipTier = newVipTier as any;
      if (newName) ctx.userName = newName;
      if (newAvatar) ctx.avatar = newAvatar;

      if (ctx.roomId) {
        const room = roomsMap.get(ctx.roomId);
        if (room && room.users.has(ctx.userId)) {
          const u = room.users.get(ctx.userId)!;
          u.role = newRole;
          if (newVipTier) u.vipTier = newVipTier as any;
          if (newName) u.name = newName;
          if (newAvatar) u.avatar = newAvatar;
          broadcastToRoom(ctx.roomId, {
            type: 'user_updated',
            user: u
          });
        }
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'user_role_changed',
          role: newRole,
          vipTier: ctx.vipTier,
          userName: ctx.userName
        }));
      }
    }
  }
}

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.get('/api/download-source', (req, res) => {
  const zipPath = path.join(__dirname, 'public', 'diepkhuc-source.zip');
  res.download(zipPath, 'diepkhuc-source.zip', (err) => {
    if (err) {
      console.error('Error sending zip:', err);
      res.status(500).send('Không thể tải mã nguồn.');
    }
  });
});

app.get('/api/rooms', (req, res) => {
  const list = Array.from(roomsMap.values()).map(r => ({
    id: r.id,
    name: r.name,
    topic: r.topic,
    category: r.category,
    hostName: r.hostName,
    isLocked: r.isLocked,
    maxMicMinutes: r.maxMicMinutes,
    userCount: r.users.size,
    queueCount: r.micQueue.length,
    activeSinger: r.activeMicUser?.name || null,
    openCamCount: Array.from(r.users.values()).filter(u => u.isCamOn).length
  }));
  res.json({ rooms: list });
});

// --- ADMIN REST API ENDPOINTS ---
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!' });
  }

  const acc = registeredAccounts.get(username.toLowerCase().trim());
  if (!acc) {
    return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại trên hệ thống!' });
  }

  if (acc.password && acc.password !== password) {
    return res.status(401).json({ success: false, message: 'Mật khẩu quản trị không chính xác!' });
  }

  if (acc.role !== 'host' && acc.role !== 'supermod' && acc.role !== 'mod') {
    return res.status(403).json({ success: false, message: 'Tài khoản này không có quyền truy cập trang quản trị!' });
  }

  if (acc.status === 'suspended') {
    return res.status(403).json({ success: false, message: 'Tài khoản quản trị viên này hiện đang bị khóa!' });
  }

  const token = 'adm_' + Buffer.from(`${acc.id}:${Date.now()}:${acc.role}`).toString('base64');
  return res.json({
    success: true,
    token,
    user: {
      id: acc.id,
      username: acc.username,
      displayName: acc.displayName,
      avatar: acc.avatar,
      role: acc.role,
      vipTier: acc.vipTier,
      coins: acc.coins,
      note: acc.note
    }
  });
});

app.get('/api/admin/staff', (req, res) => {
  const staffList = Array.from(registeredAccounts.values()).map(({ password, ...rest }) => rest);
  res.json({ success: true, staff: staffList });
});

app.post('/api/admin/staff', (req, res) => {
  const { username, password, displayName, avatar, role, vipTier, coins, note } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Thiếu tên đăng nhập hoặc mật khẩu!' });
  }

  const lower = username.toLowerCase().trim();
  if (registeredAccounts.has(lower)) {
    return res.status(400).json({ success: false, message: 'Tên đăng nhập này đã tồn tại!' });
  }

  const newStaff: RegisteredAccount = {
    id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    username: lower,
    password: password.trim(),
    displayName: displayName?.trim() || lower,
    avatar: avatar?.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: (role as UserRole) || 'mod',
    vipTier: vipTier || (role === 'host' || role === 'supermod' ? 'diamond' : 'gold'),
    createdAt: Date.now(),
    coins: Number(coins) || 10000,
    status: 'active',
    note: note?.trim() || ''
  };

  registeredAccounts.set(lower, newStaff);
  syncUserRoleToActiveSockets(lower, newStaff.role, newStaff.vipTier, newStaff.displayName, newStaff.avatar);

  const { password: _, ...safeStaff } = newStaff;
  return res.json({ success: true, staff: safeStaff });
});

app.put('/api/admin/staff/:id', (req, res) => {
  const { id } = req.params;
  const { displayName, avatar, role, vipTier, coins, note, password, status } = req.body;

  let targetKey: string | null = null;
  for (const [k, acc] of registeredAccounts.entries()) {
    if (acc.id === id) {
      targetKey = k;
      break;
    }
  }

  if (!targetKey) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản quản trị!' });
  }

  const acc = registeredAccounts.get(targetKey)!;
  if (displayName) acc.displayName = displayName.trim();
  if (avatar) acc.avatar = avatar.trim();
  if (role) acc.role = role as UserRole;
  if (vipTier) acc.vipTier = vipTier;
  if (typeof coins === 'number') acc.coins = coins;
  if (note !== undefined) acc.note = note.trim();
  if (password && password.trim()) acc.password = password.trim();
  if (status) acc.status = status;

  syncUserRoleToActiveSockets(acc.username, acc.role, acc.vipTier, acc.displayName, acc.avatar);

  const { password: _, ...safeStaff } = acc;
  return res.json({ success: true, staff: safeStaff });
});

app.delete('/api/admin/staff/:id', (req, res) => {
  const { id } = req.params;
  let targetKey: string | null = null;
  for (const [k, acc] of registeredAccounts.entries()) {
    if (acc.id === id) {
      targetKey = k;
      break;
    }
  }

  if (!targetKey) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản quản trị!' });
  }

  if (targetKey === 'admin') {
    return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản Quản Trị Viên Tối Cao mặc định!' });
  }

  registeredAccounts.delete(targetKey);
  return res.json({ success: true, message: 'Đã xóa tài khoản quản trị thành công!' });
});

// User Moderation REST Endpoints
app.get('/api/admin/users/banned', (req, res) => {
  const list = Array.from(new Set(bannedUsers.values()));
  return res.json({ success: true, bannedUsers: list });
});

app.post('/api/admin/users/kick', (req, res) => {
  const { userId, reason } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });

  for (const [targetWs, targetCtx] of clients.entries()) {
    if (targetCtx.userId === userId) {
      const kickReason = reason || 'Quản trị viên đã mời bạn ra khỏi phòng!';
      targetWs.send(JSON.stringify({ type: 'kicked_by_admin', reason: kickReason }));
      if (targetCtx.roomId) {
        const currentRoomId = targetCtx.roomId;
        const room = roomsMap.get(currentRoomId);
        if (room) {
          const kickNotice: ChatMessage = {
            id: 'sys_' + Date.now(),
            roomId: currentRoomId,
            userId: 'system',
            userName: 'Hệ Thống Điệp Khúc',
            role: 'host',
            avatar: '',
            text: `⚠️ Quản trị viên đã mời ${targetCtx.userName} rời khỏi phòng. Lý do: ${kickReason}`,
            type: 'system',
            timestamp: Date.now()
          };
          room.messages.push(kickNotice);
          broadcastToRoom(currentRoomId, { type: 'chat_message', message: kickNotice });
        }
      }
      leaveCurrentRoom(targetCtx);
      broadcastRoomsList();
      return res.json({ success: true, message: `Đã mời ${targetCtx.userName} rời khỏi phòng!` });
    }
  }
  return res.status(404).json({ success: false, message: 'Người dùng không trực tuyến' });
});

app.post('/api/admin/users/ban', (req, res) => {
  const { userId, reason, bannedBy } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });

  for (const [targetWs, targetCtx] of clients.entries()) {
    if (targetCtx.userId === userId) {
      const banReason = reason || 'Vi phạm nghiêm trọng nội quy hệ thống';
      const banData: BannedUserInfo = {
        id: targetCtx.userId,
        name: targetCtx.userName,
        username: targetCtx.accountUsername,
        reason: banReason,
        bannedAt: Date.now(),
        bannedBy: bannedBy || 'Quản Trị Viên'
      };
      bannedUsers.set(targetCtx.userId, banData);
      if (targetCtx.accountUsername) {
        bannedUsers.set(targetCtx.accountUsername.toLowerCase(), banData);
        if (registeredAccounts.has(targetCtx.accountUsername.toLowerCase())) {
          registeredAccounts.get(targetCtx.accountUsername.toLowerCase())!.status = 'suspended';
        }
      }

      targetWs.send(JSON.stringify({ type: 'banned_by_admin', reason: banReason, bannedAt: banData.bannedAt, bannedBy: banData.bannedBy }));
      if (targetCtx.roomId) {
        const currentRoomId = targetCtx.roomId;
        const room = roomsMap.get(currentRoomId);
        if (room) {
          const banNotice: ChatMessage = {
            id: 'sys_' + Date.now(),
            roomId: currentRoomId,
            userId: 'system',
            userName: 'Hệ Thống Điệp Khúc',
            role: 'host',
            avatar: '',
            text: `🚫 [CẤM TRUY CẬP] Quản trị viên đã cấm (Ban) tài khoản ${targetCtx.userName}. Lý do: ${banReason}`,
            type: 'system',
            timestamp: Date.now()
          };
          room.messages.push(banNotice);
          broadcastToRoom(currentRoomId, { type: 'chat_message', message: banNotice });
        }
      }
      leaveCurrentRoom(targetCtx);
      broadcastRoomsList();
      return res.json({ success: true, message: `Đã cấm tài khoản ${targetCtx.userName} thành công!` });
    }
  }
  return res.status(404).json({ success: false, message: 'Người dùng không trực tuyến' });
});

app.post('/api/admin/users/unban', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'Thiếu id người dùng cần gỡ ban' });

  bannedUsers.delete(id);
  for (const [k, b] of bannedUsers.entries()) {
    if (b.id === id || (b.username && b.username.toLowerCase() === id.toLowerCase())) {
      bannedUsers.delete(k);
      if (b.username && registeredAccounts.has(b.username.toLowerCase())) {
        registeredAccounts.get(b.username.toLowerCase())!.status = 'active';
      }
    }
  }
  return res.json({ success: true, message: 'Đã gỡ cấm thành công!' });
});

// Dev vs Prod Vite Integration
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
