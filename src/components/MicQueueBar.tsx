import React, { useState } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Music, Volume2, Sparkles,
  Smile, Radio, ChevronUp, Sliders, Waves
} from 'lucide-react';
import { UserPresence, MicQueueItem } from '../types';
import { audioEngine } from '../services/audioEngine';

interface MicQueueBarProps {
  localUserId: string;
  activeMicUser: UserPresence | null;
  micQueue: MicQueueItem[];
  isMicMuted: boolean;
  isVideoEnabled: boolean;
  isReverbEnabled: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleReverb: () => void;
  onQueueMic: () => void;
  onCancelQueue: () => void;
  onReleaseMic: () => void;
  onTriggerSoundEffect: (effect: 'applause' | 'cheer' | 'laugh' | 'drum' | 'fanfare') => void;
  onOpenKaraokeModal: () => void;
}

export const MicQueueBar: React.FC<MicQueueBarProps> = ({
  localUserId,
  activeMicUser,
  micQueue,
  isMicMuted,
  isVideoEnabled,
  isReverbEnabled,
  onToggleMic,
  onToggleVideo,
  onToggleReverb,
  onQueueMic,
  onCancelQueue,
  onReleaseMic,
  onTriggerSoundEffect,
  onOpenKaraokeModal
}) => {
  const isOnMic = activeMicUser?.id === localUserId;
  const queueIndex = micQueue.findIndex(q => q.userId === localUserId);
  const isInQueue = queueIndex !== -1;

  const [soundTooltip, setSoundTooltip] = useState<string | null>(null);

  const handleSound = (effect: 'applause' | 'cheer' | 'laugh' | 'drum' | 'fanfare', label: string) => {
    onTriggerSoundEffect(effect);
    setSoundTooltip(`Đã gửi: ${label}`);
    setTimeout(() => setSoundTooltip(null), 1500);
  };

  return (
    <div className="bg-[#0f1424] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
      {/* Mic Status & Main Action: Cầm Mic / Xếp Hàng / Trả Mic */}
      <div className="flex items-center gap-3">
        {isOnMic ? (
          <button
            onClick={onReleaseMic}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition-all flex items-center gap-2 active:scale-95 animate-pulse"
          >
            <Mic className="w-4 h-4 fill-current" />
            <span>Đang Cầm Mic · Bấm Trả Mic</span>
          </button>
        ) : isInQueue ? (
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Đang đợi xếp hàng mic (#{queueIndex + 1})</span>
            </div>
            <button
              onClick={onCancelQueue}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            onClick={onQueueMic}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95 group"
          >
            <Mic className="w-4 h-4 text-slate-950 stroke-[2.5] group-hover:scale-110 transition-transform" />
            <span>{activeMicUser ? 'Xếp Hàng Cầm Mic' : 'Cầm Mic Lên Sân Khấu'}</span>
          </button>
        )}

        {/* Karaoke Selector Button */}
        <button
          onClick={onOpenKaraokeModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
          title="Chọn bài hát karaoke & phát nhạc đệm"
        >
          <Music className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Chọn Nhạc Đệm</span>
        </button>
      </div>

      {/* Device & Voice FX Controls */}
      <div className="flex items-center gap-2">
        {/* Mic Mute/Unmute */}
        <button
          onClick={onToggleMic}
          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
            isMicMuted
              ? 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-slate-200'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
          }`}
          title={isMicMuted ? 'Mở Micro' : 'Tắt Micro'}
        >
          {isMicMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          <span className="hidden md:inline">{isMicMuted ? 'Mic: Tắt' : 'Mic: Bật'}</span>
        </button>

        {/* Camera On/Off */}
        <button
          onClick={onToggleVideo}
          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
            !isVideoEnabled
              ? 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-slate-200'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          }`}
          title={isVideoEnabled ? 'Tắt Camera' : 'Bật Camera Webcam'}
        >
          {isVideoEnabled ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
          <span className="hidden md:inline">{isVideoEnabled ? 'Cam: Bật' : 'Cam: Tắt'}</span>
        </button>

        {/* Reverb Echo FX Toggle */}
        <button
          onClick={onToggleReverb}
          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
            isReverbEnabled
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
              : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Hiệu ứng tiếng vang Echo/Reverb Bolero"
        >
          <Waves className="w-4 h-4 text-amber-400" />
          <span className="hidden lg:inline">{isReverbEnabled ? 'Echo Vang: BẬT' : 'Echo: Tắt'}</span>
        </button>
      </div>

      {/* Audience Soundboard Reaction Buttons */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1 relative">
        <button
          onClick={() => handleSound('applause', 'Vỗ tay 👏')}
          className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1 active:scale-90"
          title="Tiếng vỗ tay cổ vũ"
        >
          <span>👏</span>
          <span className="hidden xl:inline text-[11px] text-slate-400 font-medium">Vỗ tay</span>
        </button>

        <button
          onClick={() => handleSound('cheer', 'Hò reo 🎉')}
          className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1 active:scale-90"
          title="Tiếng hò reo cổ vũ"
        >
          <span>🎉</span>
          <span className="hidden xl:inline text-[11px] text-slate-400 font-medium">Hò reo</span>
        </button>

        <button
          onClick={() => handleSound('laugh', 'Cười lớn 😂')}
          className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1 active:scale-90"
          title="Tiếng cười vui vẻ"
        >
          <span>😂</span>
          <span className="hidden xl:inline text-[11px] text-slate-400 font-medium">Tiếng cười</span>
        </button>

        <button
          onClick={() => handleSound('drum', 'Trống dồn 🥁')}
          className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1 active:scale-90"
          title="Trống dồn hồi hộp"
        >
          <span>🥁</span>
          <span className="hidden xl:inline text-[11px] text-slate-400 font-medium">Trống</span>
        </button>

        <button
          onClick={() => handleSound('fanfare', 'Kèn chúc mừng 🎺')}
          className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1 active:scale-90"
          title="Kèn fanfare chúc mừng"
        >
          <span>🎺</span>
          <span className="hidden xl:inline text-[11px] text-slate-400 font-medium">Kèn</span>
        </button>

        {soundTooltip && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/90 border border-slate-700 text-amber-300 text-[10px] font-bold rounded-lg pointer-events-none whitespace-nowrap animate-pulse">
            {soundTooltip}
          </div>
        )}
      </div>
    </div>
  );
};
