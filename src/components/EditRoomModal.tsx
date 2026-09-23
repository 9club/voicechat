import React, { useState } from 'react';
import { X, Settings, Clock, Lock, Unlock, Shield, Music, Check, Sparkles } from 'lucide-react';
import { RoomDetail } from '../types';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomDetail;
  onSave: (settings: {
    name?: string;
    topic?: string;
    category?: string;
    maxMicMinutes?: number;
    isLocked?: boolean;
    password?: string;
  }) => void;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  onSave
}) => {
  const [name, setName] = useState(room.name);
  const [topic, setTopic] = useState(room.topic);
  const [category, setCategory] = useState(room.category || 'Âm Nhạc');
  const [micMinutes, setMicMinutes] = useState<number>(room.maxMicMinutes || 5);
  const [isLocked, setIsLocked] = useState(room.isLocked || false);
  const [password, setPassword] = useState(room.password || '');

  if (!isOpen) return null;

  const categories = [
    'Âm Nhạc',
    'Bolero',
    'Nhạc Vàng & Trữ Tình',
    'Dân Ca Quê Hương',
    'Nhạc Trẻ & Remix',
    'Tâm Sự & Giao Lưu',
    'Ca Cổ & Vọng Cổ',
    'Hải Ngoại Sân Khấu'
  ];

  const presetMicTimes = [1, 2, 3, 5, 7, 10, 15, 30];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Tên phòng không được để trống!');
      return;
    }

    if (micMinutes <= 0 || isNaN(micMinutes)) {
      alert('Thời gian cầm mic phải là số phút hợp lệ lớn hơn 0!');
      return;
    }

    onSave({
      name: name.trim(),
      topic: topic.trim(),
      category,
      maxMicMinutes: Number(micMinutes),
      isLocked,
      password: isLocked ? password.trim() : ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f1424] border border-amber-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0a0e19] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Chỉnh Sửa Thông Tin Phòng & Mic</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Quản Trị Viên
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tùy chỉnh tiêu đề phòng, chủ đề và thời gian cầm mic tùy ý
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Tên phòng */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>Tên Phòng Hát:</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Phòng Bolero & Nhạc Vàng Điệp Khúc"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Chủ đề phòng */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>Chủ Đề & Lời Chào Mừng:</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Hát cho nhau nghe, lịch sự, tôn trọng ca sĩ..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Thể loại */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Thể Loại Phòng:</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* SỬA THỜI GIAN CẦM MIC TÙY Ý */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Thời Gian Cầm Mic Tùy Ý (Số Phút):</span>
              </label>
              <span className="text-xs font-black text-white bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40">
                {micMinutes} phút/lượt
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Quản trị viên có thể nhập bất kỳ số phút nào theo nhu cầu phòng hát (từ 1 đến 180 phút):
            </p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={180}
                value={micMinutes}
                onChange={(e) => setMicMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 bg-slate-950 border border-amber-500/60 rounded-xl px-3 py-2 text-center text-sm font-black text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="text-xs text-slate-300 font-bold">Phút / Mỗi Ca Sĩ</span>

              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={() => setMicMinutes(Math.max(1, micMinutes - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm flex items-center justify-center border border-slate-700"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setMicMinutes(micMinutes + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm flex items-center justify-center border border-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 mr-1">Gợi ý nhanh:</span>
              {presetMicTimes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMicMinutes(m)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    micMinutes === m
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {m}p
                </button>
              ))}
            </div>
          </div>

          {/* Khóa phòng & Mật khẩu */}
          <div className="space-y-3 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isLocked ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                <span className="text-xs font-bold text-slate-200">Khóa Phòng / Đặt Mật Khẩu</span>
              </div>
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-400 focus:ring-0 cursor-pointer"
              />
            </div>

            {isLocked && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu vào phòng..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Lưu Cấu Hình Phòng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
