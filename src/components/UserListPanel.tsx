import React, { useState } from 'react';
import {
  Users, Mic, Crown, Shield, User, Clock, ChevronRight, Gift,
  CheckCircle, ArrowUp, MessageSquare, Video
} from 'lucide-react';
import { UserPresence, MicQueueItem } from '../types';

interface UserListPanelProps {
  users: UserPresence[];
  micQueue: MicQueueItem[];
  activeMicUser: UserPresence | null;
  localUserId: string;
  isHost: boolean;
  onGrantMic?: (userId: string) => void;
  onKickFromQueue?: (userId: string) => void;
  onSelectPmUser?: (user: UserPresence) => void;
}

export const UserListPanel: React.FC<UserListPanelProps> = ({
  users,
  micQueue,
  activeMicUser,
  localUserId,
  isHost,
  onGrantMic,
  onKickFromQueue,
  onSelectPmUser
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'users'>('queue');

  const hosts = users.filter(u => u.role === 'host');
  const supermods = users.filter(u => u.role === 'supermod');
  const mods = users.filter(u => u.role === 'mod');
  const vips = users.filter(u => (u.role === 'vip' || (u.vipTier && u.vipTier !== 'none')) && u.role !== 'host' && u.role !== 'supermod' && u.role !== 'mod' && u.id !== activeMicUser?.id);
  const members = users.filter(u => u.role !== 'host' && u.role !== 'supermod' && u.role !== 'mod' && u.role !== 'vip' && (!u.vipTier || u.vipTier === 'none') && u.id !== activeMicUser?.id);

  return (
    <div className="bg-[#0e1322] border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-xl overflow-hidden">
      {/* Tab Switcher Header */}
      <div className="p-2 border-b border-slate-800 bg-[#0b0f1a] flex items-center gap-1.5">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'queue'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Hàng Chờ Mic ({micQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Thành Viên ({users.length})</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'queue' ? (
          <div className="space-y-3">
            {/* Active Singer Card */}
            {activeMicUser && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-rose-500/15 border border-amber-500/30 space-y-2">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Đang Giữ Mic Sân Khấu
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border-2 border-amber-400 shrink-0">
                    <img
                      src={activeMicUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={activeMicUser.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {activeMicUser.name}
                    </div>
                    <div className="text-[10px] text-amber-300">
                      {activeMicUser.role === 'vip' ? '🌟 VIP' : 'Ca sĩ chính'}
                    </div>
                  </div>
                  <Mic className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                </div>
              </div>
            )}

            {/* Waiting Queue List */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Danh Sách Xếp Hàng ({micQueue.length})
              </div>

              {micQueue.length === 0 ? (
                <div className="text-center py-10 text-slate-500 space-y-2">
                  <Mic className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">Chưa có ai xếp hàng</p>
                  <p className="text-[11px] text-slate-600">Bấm [Cầm Mic] để nhận lượt hát tiếp theo</p>
                </div>
              ) : (
                micQueue.map((item, idx) => {
                  const isCurrent = item.userId === localUserId;
                  const waitMinutes = Math.max(1, Math.round((Date.now() - item.queuedAt) / 60000));
                  return (
                    <div
                      key={item.userId}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-amber-400 shrink-0">
                          #{idx + 1}
                        </div>

                        <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 shrink-0">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.userName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                              {item.userName.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                            <span>{item.userName}</span>
                            {item.vipTier === 'diamond' && <span className="text-[9px] text-sky-400 font-bold">💎 VIP</span>}
                            {item.vipTier === 'gold' && <span className="text-[9px] text-amber-400 font-bold">🌟 VIP</span>}
                            {isCurrent && <span className="text-slate-400">(Bạn)</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Đã chờ ~{waitMinutes} phút
                          </div>
                        </div>
                      </div>

                      {/* Host Actions */}
                      {isHost && (
                        <div className="flex items-center gap-1 shrink-0">
                          {onGrantMic && (
                            <button
                              onClick={() => onGrantMic(item.userId)}
                              className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10"
                              title="Mời lên mic ngay"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Users in Room List */
          <div className="space-y-4 text-xs">
            {/* Hosts / Admins */}
            {hosts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider px-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Quản Trị Viên & Chủ Phòng ({hosts.length})
                </div>
                {hosts.map(u => (
                  <div key={u.id} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-rose-500/50 shrink-0">
                        {u.avatar ? <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : null}
                      </div>
                      <span className="font-bold text-rose-300 truncate">{u.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {u.id !== localUserId && onSelectPmUser && (
                        <button
                          onClick={() => onSelectPmUser(u)}
                          className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                          title="Nhắn tin riêng (PM)"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                        👑 Tổng Quản Trị
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Super Mods */}
            {supermods.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider px-1 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-purple-400" />
                  Super Mod / Tổng Quản Lý ({supermods.length})
                </div>
                {supermods.map(u => (
                  <div key={u.id} className="p-2 rounded-xl bg-purple-950/20 border border-purple-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-purple-400/50 shrink-0">
                        {u.avatar ? <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : null}
                      </div>
                      <span className="font-bold text-purple-300 truncate">{u.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {u.id !== localUserId && onSelectPmUser && (
                        <button
                          onClick={() => onSelectPmUser(u)}
                          className="p-1 text-slate-400 hover:text-purple-400 transition-colors"
                          title="Nhắn tin riêng (PM)"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-200 font-bold border border-purple-500/40">
                        🛡️ SUPER MOD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Room Mods */}
            {mods.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider px-1 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-teal-400" />
                  Điều Hành Viên / Mod ({mods.length})
                </div>
                {mods.map(u => (
                  <div key={u.id} className="p-2 rounded-xl bg-teal-950/20 border border-teal-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-teal-400/50 shrink-0">
                        {u.avatar ? <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : null}
                      </div>
                      <span className="font-bold text-teal-300 truncate">{u.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {u.id !== localUserId && onSelectPmUser && (
                        <button
                          onClick={() => onSelectPmUser(u)}
                          className="p-1 text-slate-400 hover:text-teal-400 transition-colors"
                          title="Nhắn tin riêng (PM)"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/25 text-teal-200 font-bold border border-teal-500/40">
                        ⚖️ MOD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIP members */}
            {vips.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Hội Viên VIP ({vips.length})
                </div>
                {vips.map(u => (
                  <div key={u.id} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-amber-400/50 shrink-0">
                        {u.avatar ? <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : null}
                      </div>
                      <span className="font-bold text-amber-300 truncate">{u.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {u.id !== localUserId && onSelectPmUser && (
                        <button
                          onClick={() => onSelectPmUser(u)}
                          className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                          title="Nhắn tin riêng (PM)"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                        {u.vipTier === 'diamond' ? 'VIP Kim Cương' : 'VIP Star'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* General members / Guests (Nick Đen) */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider px-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>Khách & Thành Viên (Nick Đen) ({members.length})</span>
              </div>
              {members.map(u => (
                <div key={u.id} className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                      {u.avatar ? <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : null}
                    </div>
                    <span className="font-black text-slate-950 bg-slate-200 px-1.5 py-0.5 rounded text-[11px] border border-slate-300 shadow-sm truncate">
                      {u.name} {u.id === localUserId && '(Bạn)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u.id !== localUserId && onSelectPmUser && (
                      <button
                        onClick={() => onSelectPmUser(u)}
                        className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                        title="Nhắn tin riêng (PM)"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                    )}
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                      Nick Đen
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
