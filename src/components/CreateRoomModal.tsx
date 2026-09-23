import React, { useState } from 'react';
import { X, Plus, Shield, Lock, Radio, Music, Flame, Headphones, Coffee, Award } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (roomData: {
    name: string;
    topic: string;
    category: string;
    password?: string;
    maxMicMinutes: number;
  }) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Âm Nhạc');
  const [password, setPassword] = useState('');
  const [maxMicMinutes, setMaxMicMinutes] = useState(5);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      topic: topic.trim() || 'Hát cho nhau nghe, giao lưu bốn phương',
      category,
      password: password.trim() || undefined,
      maxMicMinutes
    });

    onClose();
  };

  const categories = ['Âm Nhạc', 'Bolero', 'DJ & Remix', 'Tâm Sự', 'Tranh Tài'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1424] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Mở Phòng Hát Trực Tuyến</h2>
              <p className="text-xs text-slate-400">Tạo sân khấu riêng cho bạn bè giao lưu ca hát</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Tên Phòng Hát <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: 🎤 Bolero Hương Quê - Giao Lưu Bắc Trung Nam"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Chủ Đề & Giới Thiệu
            </label>
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Chào mừng quý bạn bè cùng hát và chia sẻ niềm vui âm nhạc..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Thể Loại Phòng
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400 text-xs"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Thời Lượng Mỗi Lượt Mic
              </label>
              <select
                value={maxMicMinutes}
                onChange={(e) => setMaxMicMinutes(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value={3}>3 phút (Hát nhanh)</option>
                <option value={5}>5 phút (Tiêu chuẩn)</option>
                <option value={8}>8 phút (Bài dài / Song ca)</option>
                <option value={10}>10 phút (DJ / Nonstop)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span>Mật Khẩu Vào Phòng (Tùy chọn)</span>
              <span className="text-[10px] text-slate-500">Để trống nếu mở tự do</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu nếu muốn phòng riêng tư"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              Tạo Phòng Ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
