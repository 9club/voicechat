import React, { useState } from 'react';
import { X, UserPlus, LogIn, User, Lock, Sparkles, Check, Crown } from 'lucide-react';
import { wsClient } from '../services/websocket';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: any) => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [isRegister, setIsRegister] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }

    if (isRegister) {
      wsClient.registerAccount(username.trim(), password.trim(), displayName.trim() || username.trim(), avatar);
    } else {
      wsClient.loginAccount(username.trim(), password.trim());
    }

    const unsubSuccess = wsClient.on('auth_success', (data) => {
      onLoginSuccess(data.account);
      onClose();
      unsubSuccess();
    });

    const unsubError = wsClient.on('auth_error', (data) => {
      setError(data.message);
      unsubError();
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1424] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0b0f1a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isRegister ? 'Đăng Ký Thành Viên Điệp Khúc' : 'Đăng Nhập Tài Khoản'}
              </h2>
              <p className="text-xs text-slate-400">
                Lưu giữ điểm thưởng, danh hiệu và lịch sử biểu diễn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-[#0d1222]">
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              isRegister
                ? 'text-amber-300 border-amber-400 bg-amber-400/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Đăng Ký Thành Viên Mới
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              !isRegister
                ? 'text-amber-300 border-amber-400 bg-amber-400/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Đăng Nhập
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {isRegister && (
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold">Chọn Ảnh Đại Diện:</label>
              <div className="flex justify-center gap-2">
                {AVATAR_OPTIONS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                      avatar === url
                        ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                        : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Tên Đăng Nhập (Username) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="VD: huonglan2026"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Biệt Danh Ca Sĩ / Tên Hiển Thị
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="VD: Hương Lan Bolero"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Mật Khẩu <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all text-xs"
            >
              {isRegister ? 'Đăng Ký & Nhận 100 Xu Quà' : 'Đăng Nhập Ngay'}
            </button>
          </div>

          {!isRegister && (
            <div className="text-center text-[11px] text-slate-400 pt-2">
              Tài khoản mẫu: <strong>admin</strong> / mk: <strong>123</strong> (Quyền Quản Trị Viên)
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
