import React, { useEffect, useRef, useState } from 'react';
import {
  Mic, Video, VideoOff, Volume2, VolumeX, Sparkles, Trophy, Music,
  Flame, Heart, Gift, Users, Eye, Youtube, Disc, Radio
} from 'lucide-react';
import { UserPresence, GiftItem, CurrentSongState } from '../types';
import { KARAOKE_SONGS } from '../data/songs';
import { audioEngine } from '../services/audioEngine';
import { webrtcManager } from '../services/webrtc';

interface StageViewProps {
  activeMicUser: UserPresence | null;
  activeCoMicUser: UserPresence | null;
  localUserId: string;
  localVideoStream: MediaStream | null;
  isLocalStreaming: boolean;
  micStartedAt: number | null;
  maxMicMinutes: number;
  currentSong: CurrentSongState | null;
  onSelectSongModal: () => void;
  celebrations: Array<{
    id: string;
    gift: GiftItem;
    senderName: string;
    receiverName?: string;
  }>;
}

export const StageView: React.FC<StageViewProps> = ({
  activeMicUser,
  activeCoMicUser,
  localUserId,
  localVideoStream,
  isLocalStreaming,
  micStartedAt,
  maxMicMinutes,
  currentSong,
  onSelectSongModal,
  celebrations
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(maxMicMinutes * 60);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioNeedsInteraction, setAudioNeedsInteraction] = useState<boolean>(false);
  const [isStageMuted, setIsStageMuted] = useState<boolean>(false);

  // Check WebRTC remote stream for the active singer
  useEffect(() => {
    if (!activeMicUser || activeMicUser.id === localUserId) {
      setRemoteStream(null);
      return;
    }

    const currentRemote = webrtcManager.getRemoteStream(activeMicUser.id);
    if (currentRemote) {
      setRemoteStream(currentRemote);
    }

    // Call the singer peer to initiate/exchange WebRTC connection if not already connected
    webrtcManager.callPeer(activeMicUser.id);

    const unsubStream = webrtcManager.onRemoteStream((peerId, stream) => {
      if (peerId === activeMicUser.id) {
        setRemoteStream(stream);
      }
    });

    const unsubRemove = webrtcManager.onRemoteStreamRemoved((peerId) => {
      if (peerId === activeMicUser.id) {
        setRemoteStream(null);
      }
    });

    return () => {
      unsubStream();
      unsubRemove();
    };
  }, [activeMicUser, localUserId]);

  // Attach remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {
        // Autoplay may need user gesture
        setAudioNeedsInteraction(true);
      });
    }
  }, [remoteStream]);

  // Bind local webcam stream to video element if local user is singer
  useEffect(() => {
    if (localVideoRef.current && localVideoStream) {
      localVideoRef.current.srcObject = localVideoStream;
    }
  }, [localVideoStream]);

  // Mic Timer countdown
  useEffect(() => {
    if (!micStartedAt || !activeMicUser) {
      setRemainingSeconds(maxMicMinutes * 60);
      return;
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - micStartedAt) / 1000);
      const left = Math.max(0, maxMicMinutes * 60 - elapsed);
      setRemainingSeconds(left);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [micStartedAt, activeMicUser, maxMicMinutes]);

  // Play backing track if it's a DiepKhuc synthetic song
  useEffect(() => {
    if (!currentSong) {
      audioEngine.stopSong();
      return;
    }

    if (currentSong.source === 'diepkhuc' || !currentSong.source) {
      const dkSong = KARAOKE_SONGS.find((s) => s.id === currentSong.id);
      if (dkSong && currentSong.isPlaying) {
        const offset = Math.max(0, Math.floor((Date.now() - currentSong.updatedAt) / 1000) + (currentSong.currentTime || 0));
        audioEngine.playSong(dkSong, offset);
      } else {
        audioEngine.stopSong();
      }
    } else {
      // It's a YouTube song, stop local synth backing track
      audioEngine.stopSong();
    }

    return () => {
      // cleanup on unmount
    };
  }, [currentSong?.id, currentSong?.isPlaying, currentSong?.source]);

  // Audio Visualizer Canvas animation on stage
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isSinging = !!activeMicUser;

      const numBars = 36;
      const barWidth = canvas.width / numBars;

      for (let i = 0; i < numBars; i++) {
        let height = 6;
        if (isSinging) {
          const wave = Math.sin(phase + i * 0.35) * Math.cos(phase * 0.7 + i * 0.2);
          const rand = Math.sin(phase * 2 + i * 1.5) * 0.5 + 0.5;
          height = Math.max(8, (Math.abs(wave) * 0.7 + rand * 0.3) * 65);
        } else {
          height = 6 + Math.sin(phase + i * 0.2) * 3;
        }

        const x = i * barWidth + barWidth * 0.2;
        const y = canvas.height - height;

        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(0.6, '#f43f5e');
        grad.addColorStop(1, 'rgba(168, 85, 247, 0.2)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth * 0.6, height, [4, 4, 0, 0]);
        ctx.fill();
      }

      phase += isSinging ? 0.08 : 0.02;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeMicUser]);

  // Find active song lyrics for DK songs
  const currentSongData = currentSong ? KARAOKE_SONGS.find((s) => s.id === currentSong.id) : null;
  const currentSongTime = currentSong ? Math.floor((Date.now() - currentSong.updatedAt) / 1000) + currentSong.currentTime : 0;

  let activeLyricLine = '';
  let nextLyricLine = '';
  if (currentSongData && currentSongData.lyrics.length > 0) {
    const passed = currentSongData.lyrics.filter((l) => l.time <= (currentSongTime % currentSongData.duration));
    if (passed.length > 0) {
      activeLyricLine = passed[passed.length - 1].text;
      const idx = currentSongData.lyrics.indexOf(passed[passed.length - 1]);
      if (idx + 1 < currentSongData.lyrics.length) {
        nextLyricLine = currentSongData.lyrics[idx + 1].text;
      }
    } else {
      activeLyricLine = currentSongData.lyrics[0].text;
    }
  }

  const isLocalOnMic = activeMicUser?.id === localUserId;
  const isYouTubeSong = currentSong?.source === 'youtube' && !!currentSong?.youtubeId;

  const handleEnableAudio = () => {
    audioEngine.resume();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play().catch(() => {});
    }
    setAudioNeedsInteraction(false);
  };

  return (
    <div className="relative w-full aspect-video max-h-[540px] bg-[#070a13] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between select-none">
      {/* Background Stage Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090d1a] via-[#070a14]/90 to-black pointer-events-none" />

      {/* Stage Spotlights */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-80 h-96 bg-amber-500/15 blur-3xl rounded-full transform -rotate-12 pointer-events-none" />
      <div className="absolute top-0 right-1/4 translate-x-1/2 w-80 h-96 bg-rose-500/15 blur-3xl rounded-full transform rotate-12 pointer-events-none" />

      {/* Floating Gift Celebrations Overlay */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {celebrations.map((item) => (
          <div
            key={item.id}
            className="absolute inset-x-0 bottom-12 flex flex-col items-center animate-bounce duration-1000"
          >
            <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/90 via-rose-500/90 to-amber-500/90 text-white font-extrabold text-sm shadow-2xl shadow-rose-950/80 border border-amber-300/40 flex items-center gap-3 backdrop-blur-md">
              <span className="text-3xl animate-pulse">{item.gift.icon}</span>
              <div>
                <div className="text-[11px] text-amber-200 uppercase tracking-wider">Món Quà Danh Giá!</div>
                <div className="text-sm font-bold">
                  {item.senderName} tặng {item.gift.name} {item.gift.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stage Top Bar Status */}
      <div className="relative z-20 flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/95 text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-rose-900/40">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            LIVE SÂN KHẤU
          </div>

          {currentSong && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-amber-300 text-xs font-bold backdrop-blur-sm shadow-md">
              {currentSong.source === 'youtube' ? (
                <Youtube className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <Music className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
              )}
              <span className="max-w-[220px] truncate">
                {currentSong.title} {currentSong.artist ? `· ${currentSong.artist}` : ''}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                {currentSong.source === 'youtube' ? 'YouTube' : 'Điệp Khúc'}
              </span>
            </div>
          )}
        </div>

        {/* Mic Countdown Timer */}
        {activeMicUser && (
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-sm text-xs shadow-md">
            <span className="text-slate-400 font-medium">Thời gian mic:</span>
            <span
              className={`font-mono font-black ${
                remainingSeconds < 60 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
              }`}
            >
              {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Autoplay Audio Unblocker Banner (Solves Cross-Browser Silent Audio Issue) */}
      <div className="relative z-20 px-4">
        {audioNeedsInteraction && (
          <div className="mx-auto max-w-md bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 p-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2 text-xs font-black text-slate-950">
              <Volume2 className="w-5 h-5 text-slate-950 shrink-0" />
              <span>Click để mở tiếng nhạc & nghe giọng ca sĩ biểu diễn!</span>
            </div>
            <button
              onClick={handleEnableAudio}
              className="px-3.5 py-1 bg-slate-950 text-amber-300 hover:text-white font-extrabold text-xs rounded-xl transition-all shadow-md shrink-0"
            >
              Bật Tiếng Ngay 🔊
            </button>
          </div>
        )}
      </div>

      {/* Main Performer Stage Area */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        {/* CASE 1: YOUTUBE SONG EMBEDDED PLAYER WITH SINGER WEBCAM OVERLAY */}
        {isYouTubeSong && currentSong?.youtubeId ? (
          <div className="relative w-full h-full max-h-[380px] rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
            {/* Embedded YouTube Player */}
            <iframe
              src={`https://www.youtube.com/embed/${currentSong.youtubeId}?autoplay=1&mute=${isStageMuted ? 1 : 0}&enablejsapi=1&playsinline=1&rel=0`}
              title={currentSong.title}
              className="w-full h-full object-cover"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Singer Webcam PiP Overlay on Top Right */}
            {activeMicUser && (
              <div className="absolute top-3 right-3 z-30 w-36 sm:w-48 aspect-video rounded-xl overflow-hidden border-2 border-amber-400 bg-slate-950 shadow-2xl">
                {isLocalOnMic && localVideoStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-slate-900/90 text-center">
                    <img
                      src={activeMicUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={activeMicUser.name}
                      className="w-8 h-8 rounded-full border border-amber-400 object-cover"
                    />
                    <span className="text-[10px] text-amber-300 font-bold truncate max-w-full">
                      🎤 {activeMicUser.name}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] text-amber-300 font-bold">
                  {isLocalOnMic ? 'Cam Bạn' : `Ca Sĩ: ${activeMicUser.name}`}
                </div>
              </div>
            )}
          </div>
        ) : activeMicUser ? (
          /* CASE 2: DIEPKHUC SONG OR LIVE VOCAL WITH WEBCAM / SPOTLIGHT */
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            {/* Show real video if local user is singing OR remote peer is sending stream */}
            {isLocalOnMic && localVideoStream ? (
              <div className="relative w-72 h-44 sm:w-96 sm:h-56 rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl shadow-amber-500/20 bg-slate-950">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-amber-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Camera Trực Tiếp Của Bạn</span>
                </div>
              </div>
            ) : remoteStream ? (
              <div className="relative w-72 h-44 sm:w-96 sm:h-56 rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl shadow-amber-500/20 bg-slate-950">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-amber-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Webcam Ca Sĩ {activeMicUser.name}</span>
                </div>
              </div>
            ) : (
              /* High-fidelity stage spotlight avatar presentation */
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse" />

                <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-br from-amber-400 via-rose-400 to-amber-200 shadow-2xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-slate-900">
                    <img
                      src={activeMicUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                      alt={activeMicUser.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Golden Mic Badge */}
                  <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg border-2 border-[#070a13]">
                    <Mic className="w-5 h-5 fill-current" />
                  </div>

                  {/* VIP Crown */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                    <Trophy className="w-4 h-4 fill-current text-amber-900" />
                  </div>
                </div>
              </div>
            )}

            {/* Performer Name & Role */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Đang Biểu Diễn Trên Sân Khấu</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {activeMicUser.name}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {activeMicUser.role === 'host'
                  ? '👑 Tổng Quản Trị & Chủ Phòng'
                  : activeMicUser.role === 'supermod'
                  ? '🛡️ Super Mod - Tổng Quản Lý'
                  : activeMicUser.role === 'mod'
                  ? '⚖️ Mod Phòng - Điều Hành Viên'
                  : activeMicUser.role === 'vip' || activeMicUser.vipTier
                  ? '🌟 Ca Sĩ VIP Điệp Khúc'
                  : '👤 Khách & Giọng Ca Triển Vọng'}
              </p>
            </div>
          </div>
        ) : (
          /* CASE 3: EMPTY STAGE */
          <div className="flex flex-col items-center justify-center text-center space-y-3.5 max-w-sm">
            <div className="w-20 h-20 rounded-full bg-slate-900/90 border border-slate-700/80 flex items-center justify-center text-amber-400 shadow-2xl">
              <Mic className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Sân Khấu Hiện Đang Trống</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Vui lòng chọn bài hát trước khi nhận micro lên sân khấu biểu diễn!
              </p>
            </div>
            <button
              onClick={onSelectSongModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Music className="w-4 h-4 fill-current" />
              <span>Chọn Bài Hát & Lên Sân Khấu</span>
            </button>
          </div>
        )}
      </div>

      {/* Synchronized Karaoke Lyrics Bar & Audio Visualizer Bottom Area */}
      <div className="relative z-20 bg-gradient-to-t from-black/95 via-black/85 to-transparent pt-4 pb-3 px-4 flex flex-col items-center space-y-2">
        {/* Equalizer Spectrum Canvas */}
        <canvas
          ref={canvasRef}
          width={400}
          height={32}
          className="w-full max-w-md h-7 pointer-events-none opacity-85"
        />

        {/* Live Synchronized Lyric Prompter for DK Songs */}
        {currentSong && currentSong.source !== 'youtube' && activeLyricLine ? (
          <div className="text-center space-y-1 py-1">
            <div className="font-['Be_Vietnam_Pro',sans-serif] text-base sm:text-lg font-black text-amber-300 tracking-wide drop-shadow-md animate-pulse">
              {activeLyricLine}
            </div>
            {nextLyricLine && (
              <div className="text-xs text-slate-400 font-medium">
                (Chuẩn bị: {nextLyricLine})
              </div>
            )}
          </div>
        ) : null}

        {/* Audio interaction helper if user hasn't unmuted */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <button
            onClick={handleEnableAudio}
            className="hover:text-amber-300 transition-colors flex items-center gap-1 underline"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Kích hoạt âm thanh loa phòng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
