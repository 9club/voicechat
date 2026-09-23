import React from 'react';
import { Mic, Plus, User, Sparkles, LogOut, Radio, Crown, Shield, UserPlus, Download } from 'lucide-react';

interface HeaderProps {
  currentRoomId: string | null;
  currentRoomName?: string;
  roomName?: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    vipTier?: string;
  };
  onOpenCreateRoom: () => void;
  onOpenProfile: () => void;
  onOpenVipUpgrade: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onLeaveRoom: () => void;
  onNavigateLobby: () => void;
  activeNav: 'lobby' | 'karaoke' | 'ranking' | 'help' | 'admin';
  setActiveNav: (nav: 'lobby' | 'karaoke' | 'ranking' | 'help' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoomId,
  currentRoomName,
  user,
  onOpenCreateRoom,
  onOpenProfile,
  onOpenVipUpgrade,
  onOpenAdmin,
  onOpenAuth,
  onLeaveRoom,
  onNavigateLobby,
  activeNav,
  setActiveNav
}) => {
  const isVip = user.role === 'vip' || user.vipTier === 'diamond' || user.vipTier === 'gold' || user.vipTier === 'silver';
  const isAdmin = user.role === 'host' || user.role === 'supermod' || user.role === 'mod';

  return (
    <header className="sticky top-0 z-40 bg-[#0c101d]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 h-16 flex items-center justify-between">
      {/* Zone 1: Brand Zone */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateLobby}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 p-0.5 shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-[#0d1222] rounded-[10px] flex items-center justify-center">
              <Mic className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <span className="font-['Cabinet_Grotesk',sans-serif] text-xl font-black tracking-wider bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-200 bg-clip-text text-transparent">
              ĐIỆP KHÚC
            </span>
            <div className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">
              Voice & Video Live
            </div>
          </div>
        </button>

        {currentRoomId && (
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 ml-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200 max-w-[220px] truncate">
              {currentRoomName || 'Phòng Trực Tuyến'}
            </span>
          </div>
        )}
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => { setActiveNav('lobby'); onNavigateLobby(); }}
          className={`transition-colors relative py-1 ${activeNav === 'lobby' && !currentRoomId ? 'text-amber-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
        >
          Sảnh Phòng
          {activeNav === 'lobby' && !currentRoomId && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveNav('karaoke')}
          className={`transition-colors relative py-1 ${activeNav === 'karaoke' ? 'text-amber-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
        >
          Kho Nhạc Karaoke
          {activeNav === 'karaoke' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveNav('ranking')}
          className={`transition-colors relative py-1 ${activeNav === 'ranking' ? 'text-amber-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
        >
          Bảng Xếp Hạng
          {activeNav === 'ranking' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>

        <button
          onClick={onOpenAdmin}
          className={`transition-colors relative py-1 flex items-center gap-1 ${activeNav === 'admin' ? 'text-amber-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Quản Trị</span>
          {activeNav === 'admin' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5">
        {/* Download Source Zip Button */}
        <a
          href="/api/download-source"
          download="diepkhuc-source.zip"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shadow-sm"
          title="Tải trọn bộ mã nguồn (.ZIP) để đưa lên VPS"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Tải Code VPS</span>
        </a>

        {/* VIP Upgrade Button */}
        <button
          onClick={onOpenVipUpgrade}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 hover:from-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-md shadow-amber-500/10 active:scale-95 transition-all group"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Nâng Cấp VIP</span>
        </button>

        {/* Auth / Register Button */}
        <button
          onClick={onOpenAuth}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5 text-slate-400" />
          <span>Đăng Ký</span>
        </button>

        {currentRoomId ? (
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-xl hover:bg-rose-500/20 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rời Phòng</span>
          </button>
        ) : (
          <button
            onClick={onOpenCreateRoom}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl hover:from-amber-300 hover:to-amber-200 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Tạo Phòng</span>
          </button>
        )}

        {/* User Profile Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-colors group"
          title="Thông tin cá nhân"
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-700 border border-amber-400/40 flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-slate-300" />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0c101d] rounded-full" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors max-w-[100px] truncate leading-tight">
              {user.name}
            </div>
            <div className="text-[10px] font-bold leading-none flex items-center gap-0.5">
              {user.role === 'host' ? (
                <span className="text-amber-400">👑 Tổng Quản Trị</span>
              ) : user.role === 'supermod' ? (
                <span className="text-purple-400">🛡️ Super Mod</span>
              ) : user.role === 'mod' ? (
                <span className="text-teal-400">⚖️ Mod Phòng</span>
              ) : user.vipTier === 'diamond' ? (
                <span className="text-sky-400">💎 Kim Cương</span>
              ) : user.vipTier === 'gold' ? (
                <span className="text-amber-400">🌟 VIP Vàng</span>
              ) : user.vipTier === 'silver' ? (
                <span className="text-slate-300">🥈 VIP Bạc</span>
              ) : (
                <span className="text-slate-400">Thành Viên</span>
              )}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
