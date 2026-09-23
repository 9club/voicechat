export type UserRole = 'host' | 'supermod' | 'mod' | 'vip' | 'member';

export interface UserPresence {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  vipTier?: 'none' | 'silver' | 'gold' | 'diamond';
  isMuted: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  isStreaming: boolean;
  isCamOn?: boolean;
  camAllowedViewers?: string[]; // user IDs allowed to view their cam
  camAutoAccept?: boolean;
}

export interface MicQueueItem {
  userId: string;
  userName: string;
  avatar: string;
  role: string;
  vipTier?: string;
  queuedAt: number;
  songData?: any;
}

export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  value: number;
  effect: 'float_heart' | 'rose_storm' | 'golden_crown' | 'supercar' | 'mega_yacht';
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  role: string;
  vipTier?: string;
  avatar: string;
  text: string;
  type: 'chat' | 'system' | 'gift' | 'action';
  gift?: {
    id: string;
    name: string;
    icon: string;
    value: number;
  };
  timestamp: number;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  receiverName: string;
  text: string;
  timestamp: number;
}

export interface CamViewRequest {
  requestId: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string;
  broadcasterId: string;
  timestamp: number;
}

export interface SongLyricLine {
  time: number;
  text: string;
}

export interface SongItem {
  id: string;
  title: string;
  artist: string;
  genre: 'Bolero' | 'Trữ Tình' | 'Nhạc Trẻ' | 'Dân Ca' | 'Remix';
  tempo: number;
  key: string;
  duration: number;
  lyrics: SongLyricLine[];
  source?: 'diepkhuc' | 'youtube';
  youtubeId?: string;
  youtubeUrl?: string;
}

export interface RoomSummary {
  id: string;
  name: string;
  topic: string;
  category: string;
  hostName: string;
  isLocked: boolean;
  maxMicMinutes: number;
  userCount: number;
  queueCount: number;
  activeSinger: string | null;
  openCamCount?: number;
}

export interface CurrentSongState {
  id: string;
  title: string;
  artist: string;
  source: 'diepkhuc' | 'youtube';
  youtubeId?: string;
  youtubeUrl?: string;
  genre?: string;
  tempo?: number;
  key?: string;
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number;
  singerId?: string;
  singerName?: string;
}

export interface YouTubeKaraokeItem {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  youtubeUrl: string;
  thumbnail: string;
  genre: string;
  duration: number;
}

export interface RoomDetail {
  id: string;
  name: string;
  topic: string;
  category: string;
  hostId: string;
  hostName: string;
  isLocked: boolean;
  password?: string;
  maxMicMinutes: number;
  activeMicUser: UserPresence | null;
  activeCoMicUser: UserPresence | null;
  micStartedAt: number | null;
  micQueue: MicQueueItem[];
  userCount: number;
  users: UserPresence[];
  messages: ChatMessage[];
  currentSong: CurrentSongState | null;
}

export interface RegisteredAccount {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  avatar: string;
  role: UserRole;
  vipTier: 'none' | 'silver' | 'gold' | 'diamond';
  createdAt: number;
  coins: number;
  status?: 'active' | 'suspended';
  note?: string;
}
