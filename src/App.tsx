import React, { useState, useEffect, useRef } from 'react';
import { wsClient } from './services/websocket';
import { audioEngine } from './services/audioEngine';
import { webrtcManager } from './services/webrtc';
import { RoomDetail, RoomSummary, UserPresence, GiftItem, SongItem, PrivateMessage } from './types';
import { Header } from './components/Header';
import { Lobby } from './components/Lobby';
import { StageView } from './components/StageView';
import { MicQueueBar } from './components/MicQueueBar';
import { ChatPanel } from './components/ChatPanel';
import { UserListPanel } from './components/UserListPanel';
import { WebcamGallery } from './components/WebcamGallery';
import { KaraokePlayer } from './components/KaraokePlayer';
import { CreateRoomModal } from './components/CreateRoomModal';
import { UserProfileModal } from './components/UserProfileModal';
import { VIPUpgradeModal } from './components/VIPUpgradeModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { EditRoomModal } from './components/EditRoomModal';
import { KARAOKE_SONGS } from './data/songs';
import { Clock, Shield, Sparkles, Video, Settings, Sliders, Music } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: 'Khách Bolero ' + Math.floor(100 + Math.random() * 900),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'member',
    vipTier: 'none'
  });

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomDetail | null>(null);

  const [activeNav, setActiveNav] = useState<'lobby' | 'karaoke' | 'ranking' | 'help' | 'admin'>('lobby');

  // Device & Mic states
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isReverbEnabled, setIsReverbEnabled] = useState(false);
  const [isLocalCamOn, setIsLocalCamOn] = useState(false);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);

  // Private Messages (PM)
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [selectedPmUser, setSelectedPmUser] = useState<UserPresence | null>(null);

  // Modals
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isKaraokeModalOpen, setIsKaraokeModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [karaokeMode, setKaraokeMode] = useState<'normal' | 'select_for_mic'>('normal');

  // Floating celebrations queue
  const [celebrations, setCelebrations] = useState<Array<{
    id: string;
    gift: GiftItem;
    senderName: string;
    receiverName?: string;
  }>>([]);

  // Connect WebRTC signaling with WebSocket
  useEffect(() => {
    const unsubLocalSignal = webrtcManager.onLocalSignal((targetUserId, signal) => {
      wsClient.sendWebRTCSignal(targetUserId, signal);
    });

    const unsubSignal = wsClient.on('webrtc_signal', (data) => {
      webrtcManager.handleSignal(data.fromUserId, data.signal);
    });

    return () => {
      unsubLocalSignal();
      unsubSignal();
    };
  }, []);

  // Update WebRTC local stream when video stream changes
  useEffect(() => {
    if (localVideoStream) {
      webrtcManager.setLocalStream(localVideoStream);
    }
  }, [localVideoStream]);

  // Setup WebSocket listeners
  useEffect(() => {
    const unsubInit = wsClient.on('init_connection', (data) => {
      setCurrentUser(prev => ({
        ...prev,
        id: data.userId,
        name: prev.name || data.userName,
        role: data.role || prev.role,
        vipTier: data.vipTier || prev.vipTier
      }));
      if (data.rooms) setRooms(data.rooms);
    });

    const unsubRooms = wsClient.on('rooms_list', (data) => {
      if (data.rooms) setRooms(data.rooms);
    });

    const unsubRoomJoined = wsClient.on('room_joined', (data) => {
      setCurrentRoom(data.room);
      setCurrentRoomId(data.room.id);

      if (data.room.currentSong?.isPlaying) {
        const songData = KARAOKE_SONGS.find(s => s.id === data.room.currentSong.id);
        if (songData) {
          audioEngine.startKaraokeBacking(songData.genre, songData.tempo);
        }
      }
    });

    const unsubUserJoined = wsClient.on('user_joined', (data) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        const exists = prev.users.some(u => u.id === data.user.id);
        const newUsers = exists ? prev.users : [...prev.users, data.user];
        const newMsgs = data.message ? [...prev.messages, data.message] : prev.messages;
        return { ...prev, users: newUsers, messages: newMsgs, userCount: newUsers.length };
      });
    });

    const unsubUserLeft = wsClient.on('user_left', (data) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        const remaining = prev.users.filter(u => u.id !== data.userId);
        return { ...prev, users: remaining, userCount: remaining.length };
      });
    });

    const unsubMicChanged = wsClient.on('mic_changed', (data) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          activeMicUser: data.activeMicUser,
          activeCoMicUser: data.activeCoMicUser,
          micStartedAt: data.micStartedAt
        };
      });
    });

    const unsubQueue = wsClient.on('mic_queue_updated', (data) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        return { ...prev, micQueue: data.queue };
      });
    });

    const unsubRoomSettings = wsClient.on('room_settings_updated', (data) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          name: data.settings.name || prev.name,
          topic: data.settings.topic !== undefined ? data.settings.topic : prev.topic,
          category: data.settings.category || prev.category,
          maxMicMinutes: data.settings.maxMicMinutes || prev.maxMicMinutes,
          isLocked: data.settings.isLocked !== undefined ? data.settings.isLocked : prev.isLocked
        };
      });
    });

    const unsubCamUpdated = wsClient.on('user_cam_updated', (data) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        const updatedUsers = prev.users.map(u => {
          if (u.id === data.userId) {
            return {
              ...u,
              isCamOn: data.isCamOn,
              camAutoAccept: data.camAutoAccept,
              camAllowedViewers: data.camAllowedViewers
            };
          }
          return u;
        });
        return { ...prev, users: updatedUsers };
      });
    });

    const unsubMessage = wsClient.on('new_message', (data) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        return { ...prev, messages: [...prev.messages, data.message] };
      });
    });

    const unsubPrivateMessage = wsClient.on('private_message', (data) => {
      setPrivateMessages(prev => [...prev, data.message]);
    });

    const unsubGift = wsClient.on('gift_sent', (data) => {
      const celebrationItem = {
        id: 'cel_' + Date.now() + '_' + Math.random(),
        gift: data.gift,
        senderName: data.sender.name,
        receiverName: data.receiver?.name
      };
      setCelebrations(prev => [...prev, celebrationItem]);
      setTimeout(() => {
        setCelebrations(prev => prev.filter(c => c.id !== celebrationItem.id));
      }, 4000);

      if (data.gift.value >= 100) {
        audioEngine.playFanfare();
      } else {
        audioEngine.playCheer();
      }

      setCurrentRoom(prev => {
        if (!prev) return null;
        return { ...prev, messages: [...prev.messages, data.message] };
      });
    });

    const unsubSound = wsClient.on('play_sound_effect', (data) => {
      switch (data.effect) {
        case 'applause':
          audioEngine.playApplause();
          break;
        case 'cheer':
          audioEngine.playCheer();
          break;
        case 'laugh':
          audioEngine.playLaugh();
          break;
        case 'drum':
          audioEngine.playDrumRoll();
          break;
        case 'fanfare':
          audioEngine.playFanfare();
          break;
      }
    });

    const unsubKaraoke = wsClient.on('karaoke_updated', (data) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        return { ...prev, currentSong: data.currentSong };
      });

      if (data.currentSong && data.currentSong.isPlaying) {
        if (data.currentSong.source === 'diepkhuc' || !data.currentSong.source) {
          const songData = KARAOKE_SONGS.find(s => s.id === data.currentSong.id);
          if (songData) {
            audioEngine.startKaraokeBacking(songData.genre, songData.tempo);
          }
        } else {
          audioEngine.stopKaraokeBacking();
        }
      } else {
        audioEngine.stopKaraokeBacking();
      }
    });

    const unsubCreated = wsClient.on('room_created', (data) => {
      wsClient.joinRoom(data.roomId);
    });

    const unsubVipUpgraded = wsClient.on('vip_upgraded', (data) => {
      setCurrentUser(prev => ({ ...prev, vipTier: data.vipTier, role: 'vip' }));
    });

    const unsubKicked = wsClient.on('kicked_by_admin', (data) => {
      alert(`⚠️ BẠN ĐÃ BỊ MỜI RA KHỎI PHÒNG!\n\nLý do: ${data.reason || 'Quản trị viên đã mời bạn ra khỏi phòng.'}`);
      setCurrentRoomId(null);
      setCurrentRoom(null);
      setActiveNav('lobby');
    });

    const unsubBanned = wsClient.on('banned_by_admin', (data) => {
      alert(`🚫 TÀI KHOẢN ĐÃ BỊ CẤM (BANNED)!\n\nLý do: ${data.reason || 'Vi phạm nghiêm trọng nội quy hệ thống.'}\nNgười thực hiện: ${data.bannedBy || 'Quản Trị Viên'}`);
      setCurrentRoomId(null);
      setCurrentRoom(null);
      setActiveNav('lobby');
    });

    return () => {
      unsubInit();
      unsubRooms();
      unsubRoomJoined();
      unsubUserJoined();
      unsubUserLeft();
      unsubMicChanged();
      unsubQueue();
      unsubRoomSettings();
      unsubCamUpdated();
      unsubMessage();
      unsubPrivateMessage();
      unsubGift();
      unsubSound();
      unsubKaraoke();
      unsubCreated();
      unsubVipUpgraded();
      unsubKicked();
      unsubBanned();
    };
  }, []);

  // Handle media devices (mic & camera)
  const handleToggleMic = async () => {
    if (isMicMuted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        await audioEngine.setupMicrophone(stream);
        setIsMicMuted(false);
        wsClient.setMediaState(isVideoEnabled, true, true);
      } catch (err) {
        console.warn('Microphone permission error:', err);
        setIsMicMuted(false);
      }
    } else {
      setIsMicMuted(true);
      wsClient.setMediaState(isVideoEnabled, false, isVideoEnabled);
    }
  };

  const handleToggleVideo = async () => {
    if (!isVideoEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
        setLocalVideoStream(stream);
        setIsVideoEnabled(true);
        wsClient.setMediaState(true, !isMicMuted, true);
      } catch (err) {
        console.warn('Camera permission error:', err);
        setIsVideoEnabled(true);
      }
    } else {
      if (localVideoStream) {
        localVideoStream.getTracks().forEach(t => t.stop());
        setLocalVideoStream(null);
      }
      setIsVideoEnabled(false);
      wsClient.setMediaState(false, !isMicMuted, false);
    }
  };

  const handleToggleLocalCam = async (enable: boolean, autoAccept: boolean) => {
    if (enable) {
      try {
        if (!localVideoStream) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
          setLocalVideoStream(stream);
        }
        setIsLocalCamOn(true);
        wsClient.toggleUserCam(true, autoAccept);
      } catch (err) {
        console.warn('Webcam capture error:', err);
        setIsLocalCamOn(true);
        wsClient.toggleUserCam(true, autoAccept);
      }
    } else {
      setIsLocalCamOn(false);
      wsClient.toggleUserCam(false, autoAccept);
    }
  };

  const handleToggleReverb = () => {
    const nextState = !isReverbEnabled;
    setIsReverbEnabled(nextState);
    audioEngine.toggleReverb(nextState);
  };

  const handleJoinRoom = (roomId: string) => {
    wsClient.joinRoom(roomId);
  };

  const handleLeaveRoom = () => {
    audioEngine.stopSong();
    audioEngine.stopKaraokeBacking();
    wsClient.leaveRoom();
    setCurrentRoomId(null);
    setCurrentRoom(null);
    setActiveNav('lobby');
  };

  const handleSaveProfile = (updatedUser: any) => {
    setCurrentUser(prev => ({ ...prev, ...updatedUser }));
    wsClient.updateProfile(updatedUser.name, updatedUser.avatar);
  };

  // QUY TRÌNH BẮT BUỘC CHỌN NHẠC TRƯỚC KHI CẦM MIC
  const handleInitiateQueueMic = () => {
    // Mở modal Karaoke ở chế độ "Chọn bài hát để cầm mic"
    setKaraokeMode('select_for_mic');
    setIsKaraokeModalOpen(true);
  };

  const handleSelectSongForMic = (songData: any) => {
    // Gửi yêu cầu cầm mic kèm thông tin bài hát (DK hoặc YouTube)
    wsClient.queueMic(songData);
    setIsKaraokeModalOpen(false);
  };

  const handleSelectSong = (song: SongItem) => {
    wsClient.controlKaraoke('play', {
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      source: song.source || 'diepkhuc',
      youtubeId: song.youtubeId
    });
  };

  const handleToggleKaraokePlay = (isPlaying: boolean) => {
    wsClient.controlKaraoke(isPlaying ? 'resume' : 'pause');
  };

  const handleStopKaraoke = () => {
    wsClient.controlKaraoke('stop');
  };

  // Quản trị viên cập nhật thời gian mic tùy ý
  const handleUpdateMicMinutes = (minutes: number) => {
    if (minutes > 0) {
      wsClient.updateRoomSettings({ maxMicMinutes: minutes });
    }
  };

  const canManageRoom =
    currentRoom?.hostId === currentUser.id ||
    currentUser.role === 'host' ||
    currentUser.role === 'supermod' ||
    currentUser.role === 'mod';

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <Header
        currentRoomId={currentRoomId}
        roomName={currentRoom?.name}
        user={currentUser}
        onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenVipUpgrade={() => setIsVipModalOpen(true)}
        onOpenAdmin={() => setActiveNav('admin')}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLeaveRoom={handleLeaveRoom}
        onNavigateLobby={() => {
          if (currentRoomId) handleLeaveRoom();
          setActiveNav('lobby');
        }}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeNav === 'admin' ? (
          /* Admin Dashboard */
          <AdminDashboard
            onClose={() => setActiveNav('lobby')}
            onJoinRoom={handleJoinRoom}
          />
        ) : !currentRoomId ? (
          /* Lobby / Room Directory View */
          <Lobby
            rooms={rooms}
            onJoinRoom={handleJoinRoom}
            onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
            activeNav={activeNav}
            setActiveNav={setActiveNav}
          />
        ) : (
          /* Room View (Stage, Oncam Gallery, Mic Queue Bar, User List, Chat) */
          <div className="max-w-[1520px] w-full mx-auto px-3 sm:px-6 py-4 flex-1 flex flex-col gap-4">
            {/* Top Room Banner / Topic & Host Mic Settings */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e1322] border border-slate-800 rounded-2xl px-4 py-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold text-xs">
                  {currentRoom?.category || 'Âm Nhạc'}
                </span>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-white truncate flex items-center gap-2">
                    <span>{currentRoom?.name}</span>
                    {currentRoom?.isLocked && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        🔒 Khóa
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-slate-400 truncate">
                    {currentRoom?.topic || 'Chào mừng quý bạn đến với phòng hát Điệp Khúc!'}
                  </p>
                </div>
              </div>

              {/* Host / Admin Sửa thời gian cầm mic tùy ý & thông tin phòng */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                {/* Thời lượng mic */}
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700/80">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300 font-medium">Thời lượng mic:</span>
                  {canManageRoom ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={180}
                        defaultValue={currentRoom?.maxMicMinutes || 5}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (val > 0 && val !== currentRoom?.maxMicMinutes) {
                            handleUpdateMicMinutes(val);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt((e.target as HTMLInputElement).value);
                            if (val > 0) handleUpdateMicMinutes(val);
                          }
                        }}
                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1 text-center font-black text-amber-300 focus:outline-none focus:border-amber-400"
                        title="Quản trị viên nhập số phút tùy ý rồi Enter"
                      />
                      <span className="text-amber-400 font-bold">phút</span>
                    </div>
                  ) : (
                    <strong className="text-amber-400 font-bold">{currentRoom?.maxMicMinutes} phút</strong>
                  )}
                  <span className="text-[10px] text-emerald-400 font-medium ml-1">
                    (Tự đổi lượt)
                  </span>
                </div>

                {/* Nút Quản Trị Viên Sửa Phòng & Mic Tùy Ý */}
                {canManageRoom && (
                  <button
                    onClick={() => setIsEditRoomOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400/20 via-rose-500/20 to-indigo-500/20 hover:from-amber-400/30 hover:to-indigo-500/30 border border-amber-400/40 text-amber-300 font-black text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    title="Chỉnh sửa toàn bộ thông tin phòng & thời gian cầm mic tùy ý"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚙️ Sửa Phòng & Mic Tùy Ý</span>
                  </button>
                )}

                <div className="text-xs text-slate-400 hidden xl:block">
                  Chủ phòng: <strong className="text-slate-200">{currentRoom?.hostName}</strong>
                </div>
              </div>
            </div>

            {/* Room 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
              {/* Left Column: Hàng Chờ Mic & Thành Viên */}
              <div className="order-2 lg:order-1 lg:col-span-3">
                <UserListPanel
                  users={currentRoom?.users || []}
                  micQueue={currentRoom?.micQueue || []}
                  activeMicUser={currentRoom?.activeMicUser || null}
                  localUserId={currentUser.id}
                  isHost={canManageRoom}
                  onGrantMic={(userId) => wsClient.send({ type: 'grant_mic', userId })}
                  onSelectPmUser={(target) => setSelectedPmUser(target)}
                />
              </div>

              {/* Center Column: Live Stage + Webcam Gallery + Mic Controls */}
              <div className="order-1 lg:order-2 lg:col-span-6 flex flex-col gap-4">
                <StageView
                  activeMicUser={currentRoom?.activeMicUser || null}
                  activeCoMicUser={currentRoom?.activeCoMicUser || null}
                  localUserId={currentUser.id}
                  localVideoStream={localVideoStream}
                  isLocalStreaming={isVideoEnabled}
                  micStartedAt={currentRoom?.micStartedAt || null}
                  maxMicMinutes={currentRoom?.maxMicMinutes || 5}
                  currentSong={currentRoom?.currentSong || null}
                  onSelectSongModal={() => {
                    setKaraokeMode('select_for_mic');
                    setIsKaraokeModalOpen(true);
                  }}
                  celebrations={celebrations}
                />

                {/* Webcam Gallery: Thành viên oncam chat & P2P Stream */}
                <WebcamGallery
                  users={currentRoom?.users || []}
                  localUserId={currentUser.id}
                  localVideoStream={localVideoStream}
                  isLocalCamOn={isLocalCamOn}
                  onToggleLocalCam={handleToggleLocalCam}
                  vipTier={currentUser.vipTier}
                />

                {/* Mic Queue Bar: Buộc chọn nhạc trước khi cầm mic */}
                <MicQueueBar
                  localUserId={currentUser.id}
                  activeMicUser={currentRoom?.activeMicUser || null}
                  micQueue={currentRoom?.micQueue || []}
                  isMicMuted={isMicMuted}
                  isVideoEnabled={isVideoEnabled}
                  isReverbEnabled={isReverbEnabled}
                  onToggleMic={handleToggleMic}
                  onToggleVideo={handleToggleVideo}
                  onToggleReverb={handleToggleReverb}
                  onQueueMic={handleInitiateQueueMic}
                  onCancelQueue={() => wsClient.cancelQueue()}
                  onReleaseMic={() => wsClient.releaseMic()}
                  onTriggerSoundEffect={(effect) => wsClient.triggerSoundEffect(effect)}
                  onOpenKaraokeModal={() => {
                    setKaraokeMode('normal');
                    setIsKaraokeModalOpen(true);
                  }}
                />
              </div>

              {/* Right Column: Chat & Private Messaging (PM) & Virtual Gifts */}
              <div className="order-3 lg:order-3 lg:col-span-3">
                <ChatPanel
                  messages={currentRoom?.messages || []}
                  privateMessages={privateMessages}
                  users={currentRoom?.users || []}
                  localUserId={currentUser.id}
                  onSendMessage={(text) => wsClient.sendMessage(text)}
                  onSendPrivateMessage={(targetId, targetName, text) =>
                    wsClient.sendPrivateMessage(targetId, targetName, text)
                  }
                  onSendGift={(gift) => wsClient.sendGift(gift)}
                  activePerformerName={currentRoom?.activeMicUser?.name}
                  selectedPmUser={selectedPmUser}
                  onSelectPmUser={setSelectedPmUser}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreate={(data) => wsClient.createRoom(data)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
      />

      <VIPUpgradeModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        currentVipTier={currentUser.vipTier}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(acc) => {
          setCurrentUser({
            id: acc.id,
            name: acc.displayName,
            avatar: acc.avatar,
            role: acc.role,
            vipTier: acc.vipTier
          });
        }}
      />

      {/* Karaoke Player Modal with Dual Source: DK & YouTube */}
      <KaraokePlayer
        isOpen={isKaraokeModalOpen}
        onClose={() => setIsKaraokeModalOpen(false)}
        currentSong={currentRoom?.currentSong || null}
        mode={karaokeMode}
        onSelectSong={handleSelectSong}
        onSelectForMic={handleSelectSongForMic}
        onTogglePlay={handleToggleKaraokePlay}
        onStopSong={handleStopKaraoke}
      />

      {/* Quản Trị Viên Sửa Phòng & Mic Modal */}
      {currentRoom && (
        <EditRoomModal
          isOpen={isEditRoomOpen}
          onClose={() => setIsEditRoomOpen(false)}
          room={currentRoom}
          onSave={(settings) => {
            wsClient.updateRoomSettings(settings);
          }}
        />
      )}
    </div>
  );
}
