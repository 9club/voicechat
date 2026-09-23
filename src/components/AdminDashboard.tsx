import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Radio, Clock, Settings, Trash2, RotateCcw,
  Crown, UserCheck, AlertTriangle, Search, Check, Filter, Flame,
  Download, Server, Terminal, Copy, ExternalLink, Code, Plus,
  Edit2, Lock, Unlock, Key, LogOut, Eye, EyeOff, ShieldCheck,
  UserX, Sparkles, CheckCircle2, XCircle, Ban, VolumeX, DoorOpen, Sliders
} from 'lucide-react';
import { wsClient } from '../services/websocket';
import { UserRole } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
  onJoinRoom: (roomId: string) => void;
}

interface StaffAccount {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: UserRole;
  vipTier: 'none' | 'silver' | 'gold' | 'diamond';
  createdAt: number;
  coins: number;
  status?: 'active' | 'suspended';
  note?: string;
}

interface OnlineUser {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  vipTier?: 'none' | 'silver' | 'gold' | 'diamond';
  roomId: string | null;
  roomName: string | null;
  accountUsername?: string;
  isSinging?: boolean;
  inQueue?: boolean;
  isCamOn?: boolean;
}

interface BannedUser {
  id: string;
  name: string;
  username?: string;
  reason: string;
  bannedAt: number;
  bannedBy: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onJoinRoom }) => {
  // Authentication State for Admin Portal
  const [adminUser, setAdminUser] = useState<StaffAccount | null>(() => {
    try {
      const saved = localStorage.getItem('diepkhuc_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Main Tab State
  const [activeTab, setActiveTab] = useState<'staff' | 'rooms' | 'users' | 'vps'>('users');
  const [rooms, setRooms] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'host' | 'supermod' | 'mod'>('all');
  const [userLocationFilter, setUserLocationFilter] = useState<'all' | 'in_room' | 'lobby' | 'banned'>('all');
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Staff Modal State (Add or Edit)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [staffForm, setStaffForm] = useState({
    username: '',
    password: '',
    displayName: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'mod' as UserRole,
    vipTier: 'gold' as 'none' | 'silver' | 'gold' | 'diamond',
    coins: 10000,
    note: '',
    status: 'active' as 'active' | 'suspended'
  });

  // Kick Modal State
  const [kickModalUser, setKickModalUser] = useState<OnlineUser | null>(null);
  const [kickReason, setKickReason] = useState<string>('Vi phạm trật tự phòng hát');
  const [customKickReason, setCustomKickReason] = useState<string>('');

  // Ban Modal State
  const [banModalUser, setBanModalUser] = useState<OnlineUser | null>(null);
  const [banReason, setBanReason] = useState<string>('Vi phạm nghiêm trọng quy định phòng hát / cộng đồng');
  const [customBanReason, setCustomBanReason] = useState<string>('');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
    showToast('Đã sao chép lệnh vào clipboard!');
  };

  // Fetch staff list from REST API
  const fetchStaffList = async () => {
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        if (data.staff) {
          setAccounts(data.staff);
        }
      }
    } catch (e) {
      console.warn('Could not fetch staff list via REST, fallback to WS data', e);
    }
  };

  // Fetch banned users from REST API
  const fetchBannedList = async () => {
    try {
      const res = await fetch('/api/admin/users/banned');
      if (res.ok) {
        const data = await res.json();
        if (data.bannedUsers) {
          setBannedUsers(data.bannedUsers);
        }
      }
    } catch (e) {
      console.warn('Could not fetch banned users via REST', e);
    }
  };

  useEffect(() => {
    wsClient.adminGetAllData();
    fetchStaffList();
    fetchBannedList();

    const unsub = wsClient.on('admin_data_response', (data) => {
      if (data.rooms) setRooms(data.rooms);
      if (data.onlineUsers) setOnlineUsers(data.onlineUsers);
      if (data.bannedUsers) setBannedUsers(data.bannedUsers);
      if (data.accounts && (!accounts.length || accounts.length < data.accounts.length)) {
        setAccounts(data.accounts);
      }
    });

    const interval = setInterval(() => {
      wsClient.adminGetAllData();
    }, 4000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Handle Admin Login
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || 'Đăng nhập không thành công!');
        setLoginLoading(false);
        return;
      }

      setAdminUser(data.user);
      localStorage.setItem('diepkhuc_admin_session', JSON.stringify(data.user));
      wsClient.loginAccount(data.user.username, loginPassword.trim());

      showToast(`Chào mừng ${data.user.displayName} đã đăng nhập hệ thống Quản Trị!`);
      setLoginLoading(false);
      fetchStaffList();
      fetchBannedList();
    } catch (err) {
      console.error(err);
      const matched = accounts.find(
        (a) => a.username.toLowerCase() === loginUsername.trim().toLowerCase()
      );
      if (matched && (matched.role === 'host' || matched.role === 'supermod' || matched.role === 'mod')) {
        setAdminUser(matched);
        localStorage.setItem('diepkhuc_admin_session', JSON.stringify(matched));
        showToast(`Đăng nhập thành công với quyền ${matched.role.toUpperCase()}!`);
      } else {
        setLoginError('Không thể kết nối đến máy chủ xác thực.');
      }
      setLoginLoading(false);
    }
  };

  // Quick preset login
  const handleQuickLogin = (user: string, pass: string) => {
    setLoginUsername(user);
    setLoginPassword(pass);
    setTimeout(() => {
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setAdminUser(data.user);
            localStorage.setItem('diepkhuc_admin_session', JSON.stringify(data.user));
            wsClient.loginAccount(data.user.username, pass);
            showToast(`Đăng nhập thành công với tài khoản ${data.user.displayName}!`);
            fetchStaffList();
            fetchBannedList();
          } else {
            setLoginError(data.message);
          }
        })
        .catch(() => {
          setLoginError('Không thể đăng nhập máy chủ');
        });
    }, 100);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('diepkhuc_admin_session');
    showToast('Đã đăng xuất khỏi cổng Quản Trị an toàn!');
  };

  // Staff creation / edit modals
  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    setStaffForm({
      username: '',
      password: 'Mod' + Math.floor(1000 + Math.random() * 9000),
      displayName: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'mod',
      vipTier: 'gold',
      coins: 10000,
      note: 'Điều hành viên trực phòng hát',
      status: 'active'
    });
    setIsStaffModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffAccount) => {
    setEditingStaff(staff);
    setStaffForm({
      username: staff.username,
      password: '',
      displayName: staff.displayName,
      avatar: staff.avatar,
      role: staff.role,
      vipTier: staff.vipTier || 'gold',
      coins: staff.coins || 0,
      note: staff.note || '',
      status: staff.status || 'active'
    });
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffForm.username.trim() && !editingStaff) {
      alert('Vui lòng nhập tên đăng nhập!');
      return;
    }

    if (!editingStaff && !staffForm.password.trim()) {
      alert('Vui lòng đặt mật khẩu cho quản trị viên mới!');
      return;
    }

    try {
      if (editingStaff) {
        const payload: any = {
          displayName: staffForm.displayName,
          avatar: staffForm.avatar,
          role: staffForm.role,
          vipTier: staffForm.vipTier,
          coins: Number(staffForm.coins),
          note: staffForm.note,
          status: staffForm.status
        };
        if (staffForm.password.trim()) {
          payload.password = staffForm.password.trim();
        }

        const res = await fetch(`/api/admin/staff/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast(`Đã cập nhật thông tin quản trị viên "${staffForm.displayName || editingStaff.username}"!`);
          setIsStaffModalOpen(false);
          fetchStaffList();
          wsClient.adminGetAllData();
        } else {
          const err = await res.json();
          alert(err.message || 'Lỗi khi cập nhật!');
        }
      } else {
        const res = await fetch('/api/admin/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: staffForm.username.trim(),
            password: staffForm.password.trim(),
            displayName: staffForm.displayName.trim() || staffForm.username.trim(),
            avatar: staffForm.avatar,
            role: staffForm.role,
            vipTier: staffForm.vipTier,
            coins: Number(staffForm.coins),
            note: staffForm.note,
            status: staffForm.status
          })
        });

        if (res.ok) {
          showToast(`Đã tạo thành công quản trị viên mới "${staffForm.username}"!`);
          setIsStaffModalOpen(false);
          fetchStaffList();
          wsClient.adminGetAllData();
        } else {
          const err = await res.json();
          alert(err.message || 'Lỗi khi thêm quản trị viên!');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Không thể lưu thông tin quản trị viên.');
    }
  };

  const handleToggleStaffStatus = async (staff: StaffAccount) => {
    if (staff.username === 'admin') {
      alert('Không thể khóa tài khoản Master Admin mặc định!');
      return;
    }

    const newStatus = staff.status === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(
          newStatus === 'suspended'
            ? `Đã tạm khóa tài khoản "${staff.displayName}"!`
            : `Đã mở khóa tài khoản "${staff.displayName}"!`
        );
        fetchStaffList();
        wsClient.adminGetAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStaff = async (staff: StaffAccount) => {
    if (staff.username === 'admin') {
      alert('Không thể xóa tài khoản Quản Trị Viên Tối Cao mặc định!');
      return;
    }

    if (window.confirm(`Bạn có chắc muốn xóa hoặc gỡ quyền quản trị của "${staff.displayName} (${staff.username})"?`)) {
      try {
        const res = await fetch(`/api/admin/staff/${staff.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          showToast(`Đã xóa tài khoản "${staff.username}" khỏi ban quản trị!`);
          fetchStaffList();
          wsClient.adminGetAllData();
        } else {
          const err = await res.json();
          alert(err.message || 'Lỗi khi xóa!');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // -------------------------------------------------------------
  // KICK AND BAN ACTIONS (USER MODERATION)
  // -------------------------------------------------------------
  const handleOpenKickModal = (user: OnlineUser) => {
    setKickModalUser(user);
    setKickReason('Vi phạm trật tự phòng hát');
    setCustomKickReason('');
  };

  const handleConfirmKick = () => {
    if (!kickModalUser) return;
    const finalReason = customKickReason.trim() || kickReason;
    wsClient.adminManageUser(kickModalUser.id, 'kick', undefined, undefined, finalReason);
    showToast(`Đã mời "${kickModalUser.name}" ra khỏi phòng. Lý do: ${finalReason}`);
    setKickModalUser(null);
    wsClient.adminGetAllData();
  };

  const handleOpenBanModal = (user: OnlineUser) => {
    if (user.role === 'host' && user.accountUsername === 'admin') {
      alert('Không thể cấm tài khoản Master Admin!');
      return;
    }
    setBanModalUser(user);
    setBanReason('Troll phá phòng / Bật âm thanh tục tĩu');
    setCustomBanReason('');
  };

  const handleConfirmBan = () => {
    if (!banModalUser) return;
    const finalReason = customBanReason.trim() || banReason;
    wsClient.adminManageUser(banModalUser.id, 'ban', undefined, undefined, finalReason);
    showToast(`🚫 Đã cấm (Ban) tài khoản "${banModalUser.name}". Lý do: ${finalReason}`);
    setBanModalUser(null);
    wsClient.adminGetAllData();
    fetchBannedList();
  };

  const handleUnbanUser = async (bannedId: string, name: string) => {
    if (window.confirm(`Gỡ lệnh cấm (Unban) cho tài khoản "${name}"?`)) {
      wsClient.adminManageUser(bannedId, 'unban');
      try {
        await fetch('/api/admin/users/unban', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bannedId })
        });
      } catch (e) {
        console.warn('REST unban error', e);
      }
      showToast(`Đã gỡ lệnh cấm cho "${name}" thành công!`);
      wsClient.adminGetAllData();
      fetchBannedList();
    }
  };

  // Room management actions
  const handleUpdateMicMinutes = (roomId: string, minutes: number) => {
    wsClient.adminManageRoom(roomId, 'update', { maxMicMinutes: minutes });
    showToast(`Đã cập nhật thời gian mic phòng thành ${minutes} phút!`);
    wsClient.adminGetAllData();
  };

  const handleResetMic = (roomId: string) => {
    wsClient.adminManageRoom(roomId, 'reset_mic');
    showToast('Đã thu hồi mic và giải phóng sân khấu!');
    wsClient.adminGetAllData();
  };

  const handleClearQueue = (roomId: string) => {
    wsClient.adminManageRoom(roomId, 'clear_queue');
    showToast('Đã xóa danh sách xếp hàng mic!');
    wsClient.adminGetAllData();
  };

  const handleDeleteRoom = (roomId: string, name: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa phòng "${name}" không?`)) {
      wsClient.adminManageRoom(roomId, 'delete');
      showToast(`Đã xóa phòng "${name}"!`);
      wsClient.adminGetAllData();
    }
  };

  const handleChangeUserRole = (userId: string, role: string, vipTier?: string) => {
    wsClient.adminManageUser(userId, 'set_role', role, vipTier);
    showToast(`Đã cập nhật chức vụ thành viên!`);
    wsClient.adminGetAllData();
  };

  // Staff Counts
  const hostCount = accounts.filter((a) => a.role === 'host').length;
  const superModCount = accounts.filter((a) => a.role === 'supermod').length;
  const modCount = accounts.filter((a) => a.role === 'mod').length;

  const filteredStaff = accounts.filter((s) => {
    const matchesSearch =
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (s.note && s.note.toLowerCase().includes(search.toLowerCase()));

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'host' && s.role === 'host') ||
      (roleFilter === 'supermod' && s.role === 'supermod') ||
      (roleFilter === 'mod' && s.role === 'mod');

    return matchesSearch && matchesRole;
  });

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.hostName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = onlineUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.accountUsername && u.accountUsername.toLowerCase().includes(search.toLowerCase())) ||
      (u.roomName && u.roomName.toLowerCase().includes(search.toLowerCase())) ||
      u.role.toLowerCase().includes(search.toLowerCase());

    const matchesLocation =
      userLocationFilter === 'all' ||
      (userLocationFilter === 'in_room' && !!u.roomId) ||
      (userLocationFilter === 'lobby' && !u.roomId);

    return matchesSearch && matchesLocation;
  });

  const filteredBanned = bannedUsers.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.username && b.username.toLowerCase().includes(search.toLowerCase())) ||
    b.reason.toLowerCase().includes(search.toLowerCase())
  );

  // -------------------------------------------------------------
  // VIEW: DEDICATED ADMIN LOGIN SCREEN (If not authenticated)
  // -------------------------------------------------------------
  if (!adminUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 w-full animate-in fade-in duration-300">
        {notification && (
          <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs shadow-2xl animate-in slide-in-from-top-4">
            ✨ {notification}
          </div>
        )}

        <div className="bg-[#0e1322] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-3 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 mx-auto flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
              <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Khu Vực Hạn Chế • Restricted Area
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Cổng Đăng Nhập Quản Trị Hệ Thống
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Dành riêng cho Ban Quản Trị, Super Mod và Mod điều hành các phòng hát Điệp Khúc
              </p>
            </div>
          </div>

          {loginError && (
            <div className="mt-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Tài Khoản Quản Trị (Username)</span>
                <span className="text-[10px] text-slate-500 font-normal">admin / supermod / mod</span>
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập quản trị..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Mật Khẩu Bảo Mật</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Ẩn' : 'Hiện mật khẩu'}</span>
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 tracking-wider"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:opacity-95 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>{loginLoading ? 'Đang xác thực hệ thống...' : 'Đăng Nhập Quản Trị Viên'}</span>
            </button>
          </form>

          {/* Quick Demo Access Box */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3 relative z-10">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Chọn nhanh tài khoản mẫu để trải nghiệm:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-left transition-all hover:scale-[1.02] group"
              >
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs group-hover:text-amber-200">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Master</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">admin / admin123</div>
                <span className="text-[9px] text-rose-300 font-semibold mt-1 inline-block">👑 Toàn quyền</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('supermod1', 'super123')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-left transition-all hover:scale-[1.02] group"
              >
                <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs group-hover:text-purple-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Mod</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">supermod1 / super123</div>
                <span className="text-[9px] text-purple-300 font-semibold mt-1 inline-block">🛡️ Tổng quản lý</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('mod1', 'mod123')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/30 text-left transition-all hover:scale-[1.02] group"
              >
                <div className="flex items-center gap-1.5 text-teal-300 font-bold text-xs group-hover:text-teal-200">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Mod Phòng</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">mod1 / mod123</div>
                <span className="text-[9px] text-teal-300 font-semibold mt-1 inline-block">⚖️ Điều hành</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white transition-colors underline"
            >
              ← Trở về Sảnh Chờ Hát Ca
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 w-full space-y-6 animate-in fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs shadow-2xl animate-in slide-in-from-top-4">
          ✨ {notification}
        </div>
      )}

      {/* Header & Logged-in Staff Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e1322] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">
                Trung Tâm Quản Trị Hệ Thống Điệp Khúc
              </h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  adminUser.role === 'host'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : adminUser.role === 'supermod'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                }`}
              >
                {adminUser.role === 'host' ? '👑 TỔNG QUẢN TRỊ' : adminUser.role === 'supermod' ? '🛡️ SUPER MOD' : '⚖️ ĐIỀU HÀNH VIÊN'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Quản lý thành viên trực tuyến (Kick/Ban), giám sát hành vi phòng hát, phân quyền Super Mod / Mod
            </p>
          </div>
        </div>

        {/* Current Admin User Info & Logout */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <img
              src={adminUser.avatar}
              alt={adminUser.displayName}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover border border-amber-400/40"
            />
            <div className="text-left">
              <div className="text-xs font-bold text-white truncate max-w-[120px]">
                {adminUser.displayName}
              </div>
              <div className="text-[10px] text-amber-400 font-mono">
                @{adminUser.username}
              </div>
            </div>
          </div>

          <a
            href="/api/download-source"
            download="diepkhuc-source.zip"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 text-xs font-black shadow-md shadow-amber-400/20 transition-all flex items-center gap-1.5"
            title="Tải gói mã nguồn .ZIP để cài đặt lên VPS AlmaLinux 8"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Tải Code VPS</span>
          </a>

          <button
            onClick={handleAdminLogout}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition-colors flex items-center gap-1.5"
            title="Đăng xuất quyền quản trị"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng Xuất</span>
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Về Sảnh Chờ
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0f1424] border border-amber-500/20 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-amber-300 font-bold uppercase flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Thành Viên Online
          </span>
          <div className="text-2xl font-black text-amber-400">{onlineUsers.length}</div>
          <span className="text-[10px] text-slate-400">
            {onlineUsers.filter((u) => u.roomId).length} đang trong phòng hát
          </span>
        </div>

        <div className="bg-[#0f1424] border border-rose-500/20 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-rose-400 font-bold uppercase flex items-center gap-1">
            <Ban className="w-3.5 h-3.5" /> Đang Bị Cấm (Banned)
          </span>
          <div className="text-2xl font-black text-rose-400">{bannedUsers.length}</div>
          <span className="text-[10px] text-slate-400">Tài khoản bị chặn vào phòng</span>
        </div>

        <div className="bg-[#0f1424] border border-purple-500/20 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-purple-300 font-bold uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Ban Điều Hành
          </span>
          <div className="text-2xl font-black text-purple-300">{hostCount + superModCount + modCount}</div>
          <span className="text-[10px] text-slate-400">
            {hostCount} Admin • {superModCount} Super Mod • {modCount} Mod
          </span>
        </div>

        <div className="bg-[#0f1424] border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Tổng Số Phòng</span>
          <div className="text-2xl font-black text-white">{rooms.length}</div>
          <span className="text-[10px] text-emerald-400 font-medium">● Đang mở kết nối</span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Thành Viên & Quản Lý Hành Vi ({onlineUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'rooms'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Quản Lý Phòng Hát ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'staff'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            <span>Ban Điều Hành (Super Mod / Mod) ({accounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vps')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'vps'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 shadow-md shadow-emerald-400/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Triển Khai VPS AlmaLinux 8</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'users'
                ? 'Tìm thành viên hoặc phòng...'
                : activeTab === 'rooms'
                ? 'Tìm phòng...'
                : 'Tìm Super Mod / Mod...'
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ONLINE USERS & ROOM BEHAVIOR (KICK / BAN EXTENSION) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Sub-Filters: Online vs Banned */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f1424] border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Bộ lọc:
              </span>
              <button
                onClick={() => setUserLocationFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  userLocationFilter === 'all'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Tất Cả Online ({onlineUsers.length})
              </button>
              <button
                onClick={() => setUserLocationFilter('in_room')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  userLocationFilter === 'in_room'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                🎤 Trong Phòng Hát ({onlineUsers.filter((u) => u.roomId).length})
              </button>
              <button
                onClick={() => setUserLocationFilter('lobby')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  userLocationFilter === 'lobby'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                🛋️ Ở Sảnh Chờ ({onlineUsers.filter((u) => !u.roomId).length})
              </button>
              <button
                onClick={() => setUserLocationFilter('banned')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  userLocationFilter === 'banned'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-900 text-rose-300 hover:text-white border border-rose-500/20'
                }`}
              >
                🚫 Danh Sách Bị Cấm ({bannedUsers.length})
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              💡 Bấm <strong>Kick</strong> để mời ra khỏi phòng, hoặc <strong>Ban</strong> để khóa cấm tài khoản ngay lập tức.
            </div>
          </div>

          {/* VIEW: BANNED USERS LIST */}
          {userLocationFilter === 'banned' ? (
            <div className="bg-[#0f1424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 bg-[#0b0f1a] flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <Ban className="w-4 h-4" />
                  <span>Danh Sách Người Dùng Đang Bị Cấm Truy Cập ({filteredBanned.length})</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Người dùng bị cấm sẽ không thể vào bất kỳ phòng hát nào
                </span>
              </div>

              {filteredBanned.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Hiện tại không có thành viên nào bị cấm.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#0b0f1a] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Tài Khoản Bị Cấm</th>
                        <th className="px-4 py-3">Lý Do Cấm</th>
                        <th className="px-4 py-3">Người Thi Hành</th>
                        <th className="px-4 py-3">Thời Điểm</th>
                        <th className="px-4 py-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredBanned.map((banned) => (
                        <tr key={banned.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-rose-300 text-xs">{banned.name}</div>
                            {banned.username && (
                              <div className="text-[10px] text-slate-400 font-mono">@{banned.username}</div>
                            )}
                            <div className="text-[10px] text-slate-500 font-mono">ID: {banned.id}</div>
                          </td>
                          <td className="px-4 py-3 text-rose-200">
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-[11px]">
                              {banned.reason}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{banned.bannedBy || 'Quản Trị Viên'}</td>
                          <td className="px-4 py-3 text-slate-400 text-[11px]">
                            {new Date(banned.bannedAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleUnbanUser(banned.id, banned.name)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Gỡ Cấm (Unban)</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* VIEW: ONLINE USERS TABLE WITH KICK & BAN BUTTONS */
            <div className="bg-[#0f1424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0b0f1a] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Thành Viên Trực Tuyến</th>
                      <th className="px-4 py-3">Chức Vụ</th>
                      <th className="px-4 py-3">Vị Trí & Hoạt Động</th>
                      <th className="px-4 py-3">Phân Quyền Nhanh</th>
                      <th className="px-4 py-3 text-right">Quản Lý Hành Vi (Kick / Ban)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                          Không tìm thấy người dùng phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelf = adminUser && (adminUser.id === u.id || adminUser.username === u.accountUsername);

                        return (
                          <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                            {/* User column */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                                  {u.avatar ? (
                                    <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-amber-400">
                                      {u.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {isSelf && (
                                      <span className="text-[10px] text-amber-400 font-normal">(Bạn)</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {u.accountUsername ? `@${u.accountUsername}` : `ID: ${u.id.substring(0, 10)}...`}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role badge */}
                            <td className="px-4 py-3">
                              {u.role === 'host' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  👑 Admin
                                </span>
                              ) : u.role === 'supermod' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  🛡️ Super Mod
                                </span>
                              ) : u.role === 'mod' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                  ⚖️ Mod
                                </span>
                              ) : u.role === 'vip' || u.vipTier ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Crown className="w-2.5 h-2.5" /> VIP
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">Thành Viên</span>
                              )}
                            </td>

                            {/* Location & Stage status */}
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {u.roomId ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      onClick={() => onJoinRoom(u.roomId!)}
                                      className="text-amber-300 hover:underline font-semibold flex items-center gap-1 text-xs"
                                      title="Vào phòng này để trực ban"
                                    >
                                      <span>🎤 {u.roomName || u.roomId}</span>
                                    </button>

                                    {u.isSinging && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                                        Đang Hát
                                      </span>
                                    )}

                                    {u.inQueue && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                        Chờ Mic
                                      </span>
                                    )}

                                    {u.isCamOn && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                        📷 Bật Cam
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-xs flex items-center gap-1">
                                    <DoorOpen className="w-3 h-3" /> Đang ở sảnh chờ
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Quick Role Buttons */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleChangeUserRole(u.id, 'supermod', 'diamond')}
                                  className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold transition-colors"
                                >
                                  Super Mod
                                </button>
                                <button
                                  onClick={() => handleChangeUserRole(u.id, 'mod', 'gold')}
                                  className="px-2 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold transition-colors"
                                >
                                  Làm Mod
                                </button>
                                <button
                                  onClick={() => handleChangeUserRole(u.id, 'vip', 'diamond')}
                                  className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition-colors"
                                >
                                  Cấp VIP
                                </button>
                                <button
                                  onClick={() => handleChangeUserRole(u.id, 'member', 'none')}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                                >
                                  Gỡ quyền
                                </button>
                              </div>
                            </td>

                            {/* KICK & BAN BUTTONS */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Kick Button (Active if in room) */}
                                <button
                                  onClick={() => handleOpenKickModal(u)}
                                  disabled={!u.roomId || !!isSelf}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
                                  title={u.roomId ? `Mời ${u.name} ra khỏi phòng hát` : 'Người này chưa vào phòng'}
                                >
                                  <DoorOpen className="w-3.5 h-3.5" />
                                  <span>Kick</span>
                                </button>

                                {/* Ban Button */}
                                <button
                                  onClick={() => handleOpenBanModal(u)}
                                  disabled={!!isSelf}
                                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/50 text-xs font-black transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 shadow-sm"
                                  title={`Khóa cấm (Ban) vĩnh viễn tài khoản ${u.name}`}
                                >
                                  <Ban className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Ban</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ROOM MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-[#0f1424] border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white">{room.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {room.category}
                  </span>
                  {room.isLocked && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      Có Mật Khẩu
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{room.topic}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Chủ phòng: <strong className="text-slate-200">{room.hostName}</strong></span>
                  <span>Đang xem: <strong className="text-amber-400">{room.userCount} người</strong></span>
                  <span>
                    Ca sĩ: {room.activeSinger ? <strong className="text-rose-400">{room.activeSinger}</strong> : 'Sân khấu trống'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] text-slate-300 font-bold">Thời gian mic:</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    defaultValue={room.maxMicMinutes || 5}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0 && val !== room.maxMicMinutes) {
                        handleUpdateMicMinutes(room.id, val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt((e.target as HTMLInputElement).value);
                        if (val > 0) {
                          handleUpdateMicMinutes(room.id, val);
                        }
                      }
                    }}
                    className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-0.5 text-center text-xs font-black text-amber-300 focus:outline-none focus:border-amber-400"
                    title="Nhập số phút tùy ý rồi bấm Enter hoặc click ra ngoài"
                  />
                  <span className="text-[10px] text-slate-400">phút</span>
                </div>

                <button
                  onClick={() => {
                    const newName = prompt('Nhập tên phòng mới:', room.name);
                    if (newName === null) return;
                    const newTopic = prompt('Nhập chủ đề mới:', room.topic) || '';
                    const newTimeStr = prompt('Nhập thời gian cầm mic tùy ý (số phút):', (room.maxMicMinutes || 5).toString());
                    const newTime = newTimeStr ? parseInt(newTimeStr) : room.maxMicMinutes;
                    
                    wsClient.adminManageRoom(room.id, 'update', {
                      name: newName.trim() || room.name,
                      topic: newTopic.trim(),
                      maxMicMinutes: newTime > 0 ? newTime : 5
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold text-xs border border-indigo-500/40 transition-colors flex items-center gap-1"
                  title="Chỉnh sửa thông tin phòng & thời gian cầm mic tùy ý"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Sửa Phòng & Mic</span>
                </button>

                <button
                  onClick={() => handleResetMic(room.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 font-semibold border border-slate-700 transition-colors flex items-center gap-1"
                  title="Thu hồi mic để giải phóng sân khấu"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Giải phóng Mic</span>
                </button>

                <button
                  onClick={() => handleClearQueue(room.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold border border-slate-700 transition-colors"
                  title="Xóa danh sách người xếp hàng mic"
                >
                  Xóa Hàng Đợi ({room.queueCount})
                </button>

                <button
                  onClick={() => onJoinRoom(room.id)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all hover:opacity-90"
                >
                  Vào Phòng
                </button>

                <button
                  onClick={() => handleDeleteRoom(room.id, room.name)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                  title="Xóa phòng hát vĩnh viễn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: BAN ĐIỀU HÀNH & SUPER MOD / MOD MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f1424] border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Lọc chức vụ:
              </span>
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === 'all'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Tất Cả ({accounts.length})
              </button>
              <button
                onClick={() => setRoleFilter('host')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === 'host'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-rose-300'
                }`}
              >
                👑 Master Admin ({hostCount})
              </button>
              <button
                onClick={() => setRoleFilter('supermod')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === 'supermod'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-purple-300'
                }`}
              >
                🛡️ Super Mod ({superModCount})
              </button>
              <button
                onClick={() => setRoleFilter('mod')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === 'mod'
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-teal-300'
                }`}
              >
                ⚖️ Mod Phòng ({modCount})
              </button>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-500 hover:opacity-95 text-white font-black text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm Mới Super Mod / Mod</span>
            </button>
          </div>

          <div className="bg-[#0f1424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0b0f1a] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Quản Trị Viên</th>
                    <th className="px-4 py-3">Chức Vụ & Cấp Quyền</th>
                    <th className="px-4 py-3">Cấp VIP / Xu</th>
                    <th className="px-4 py-3">Trạng Thái</th>
                    <th className="px-4 py-3">Ghi Chú Phân Công</th>
                    <th className="px-4 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredStaff.map((staff) => {
                    const isMasterAdmin = staff.username === 'admin';
                    const isSuspended = staff.status === 'suspended';

                    return (
                      <tr
                        key={staff.id}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          isSuspended ? 'opacity-60 bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                              <img
                                src={staff.avatar}
                                alt={staff.displayName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                <span>{staff.displayName}</span>
                                {isMasterAdmin && (
                                  <span className="text-[10px] text-rose-400 font-extrabold">(Master)</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                @{staff.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {staff.role === 'host' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <Shield className="w-3 h-3 text-rose-400" />
                              <span>👑 TỔNG QUẢN TRỊ (ADMIN)</span>
                            </span>
                          ) : staff.role === 'supermod' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/25 text-purple-200 border border-purple-500/40">
                              <ShieldCheck className="w-3 h-3 text-purple-400" />
                              <span>🛡️ SUPER MOD (TỔNG QUẢN LÝ)</span>
                            </span>
                          ) : staff.role === 'mod' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-500/25 text-teal-200 border border-teal-500/40">
                              <UserCheck className="w-3 h-3 text-teal-400" />
                              <span>⚖️ MOD (ĐIỀU HÀNH VIÊN)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                              Thành Viên Thường
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <div className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              <span>
                                {staff.vipTier === 'diamond'
                                  ? 'VIP Kim Cương'
                                  : staff.vipTier === 'gold'
                                  ? 'VIP Vàng'
                                  : staff.vipTier === 'silver'
                                  ? 'VIP Bạc'
                                  : 'Không'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {staff.coins?.toLocaleString() || 0} xu
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3 h-3" /> Tạm Khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Hoạt Động
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">
                          {staff.note || '—'}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(staff)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors flex items-center gap-1"
                              title="Chỉnh sửa chức vụ, tên hoặc mật khẩu"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Sửa</span>
                            </button>

                            {!isMasterAdmin && (
                              <button
                                onClick={() => handleToggleStaffStatus(staff)}
                                className={`px-2 py-1.5 rounded-lg border transition-colors ${
                                  isSuspended
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}
                                title={isSuspended ? 'Mở khóa tài khoản' : 'Tạm khóa quyền'}
                              >
                                {isSuspended ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              </button>
                            )}

                            {!isMasterAdmin && (
                              <button
                                onClick={() => handleDeleteStaff(staff)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                                title="Xóa tài khoản khỏi ban quản trị"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: DEPLOYMENT GUIDE (ALMALINUX 8 & UBUNTU) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'vps' && (
        <div className="bg-[#0e1322] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <span>Hướng Dẫn Cài Đặt Lên VPS AlmaLinux 8 / CentOS / Ubuntu</span>
            </h3>
            <p className="text-xs text-slate-400">
              Các bước cấu hình Apache / Nginx và dịch vụ Node.js chạy ngầm bằng PM2 cho website <strong>chat.vietcalifornia.com</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0f1424] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase">Bước 1: Tải & Giải Nén Code</div>
              <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
{`cd /var/www/diepkhuc
npm install --legacy-peer-deps
npm run build`}
              </pre>
            </div>

            <div className="bg-[#0f1424] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase">Bước 2: Chạy Ngầm PM2</div>
              <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
{`npm install -g pm2
pm2 start server.ts --name "diepkhuc" --interpreter npx -- tsx
pm2 save && pm2 startup`}
              </pre>
            </div>
          </div>

          <div className="bg-[#0f1424] border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-emerald-400 uppercase">Cấu hình Apache VirtualHost (/etc/httpd/conf.d/chat.vietcalifornia.com-le-ssl.conf)</div>
            <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
{`ProxyPreserveHost On
ProxyPass /ws ws://127.0.0.1:3000/ws
ProxyPassReverse /ws ws://127.0.0.1:3000/ws

ProxyPass /api/ http://127.0.0.1:3000/api/
ProxyPassReverse /api/ http://127.0.0.1:3000/api/

RewriteEngine On
RewriteRule ^/api/ - [L]
RewriteRule ^/ws - [L]
RewriteRule ^/assets/ - [L]
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^ /index.html [L]`}
            </pre>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: KICK USER DIALOG */}
      {/* ------------------------------------------------------------- */}
      {kickModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1322] border border-amber-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <DoorOpen className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Mời Ra Khỏi Phòng (Kick)</h3>
                <p className="text-xs text-slate-400">
                  Thành viên: <strong className="text-amber-300">{kickModalUser.name}</strong>
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1">
              <div>Phòng hiện tại: <strong className="text-white">{kickModalUser.roomName || kickModalUser.roomId}</strong></div>
              <div className="text-[11px] text-slate-400">
                Người này sẽ bị đưa về Sảnh Chờ ngay lập tức và phòng chat sẽ nhận được thông báo.
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Chọn Lý Do Kick:</label>
              <select
                value={kickReason}
                onChange={(e) => setKickReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Vi phạm trật tự phòng hát">Vi phạm trật tự phòng hát</option>
                <option value="Gây rối âm thanh / Mic rú rít">Gây rối âm thanh / Mic rú rít</option>
                <option value="Chiếm mic quá giờ / Không nhường bài">Chiếm mic quá giờ / Không nhường bài</option>
                <option value="Ngôn từ thiếu tôn trọng trong chat">Ngôn từ thiếu tôn trọng trong chat</option>
                <option value="custom">-- Nhập lý do khác --</option>
              </select>

              {kickReason === 'custom' && (
                <input
                  type="text"
                  value={customKickReason}
                  onChange={(e) => setCustomKickReason(e.target.value)}
                  placeholder="Ghi rõ lý do mời ra..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 mt-2"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setKickModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmKick}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20"
              >
                Xác Nhận Kick
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: BAN USER DIALOG */}
      {/* ------------------------------------------------------------- */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1322] border border-rose-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Ban className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-300">Cấm Truy Cập Hệ Thống (Ban)</h3>
                <p className="text-xs text-slate-400">
                  Đối tượng: <strong className="text-white">{banModalUser.name}</strong>
                </p>
              </div>
            </div>

            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Cảnh báo biện pháp nghiêm khắc:</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Tài khoản/thiết bị này sẽ bị ngắt kết nối khỏi phòng và bị chặn hoàn toàn không được tham gia lại các phòng hát cho tới khi Quản Trị Viên gỡ cấm (Unban).
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Lý Do Thi Hành Lệnh Cấm:</label>
              <select
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
              >
                <option value="Troll phá phòng / Bật âm thanh tục tĩu">Troll phá phòng / Bật âm thanh tục tĩu</option>
                <option value="Xúc phạm, lăng mạ thành viên hoặc ban quản trị">Xúc phạm, lăng mạ thành viên hoặc ban quản trị</option>
                <option value="Spam link độc hại / Quảng cáo / Lừa đảo">Spam link độc hại / Quảng cáo / Lừa đảo</option>
                <option value="Vi phạm nghiêm trọng quy định cộng đồng">Vi phạm nghiêm trọng quy định cộng đồng</option>
                <option value="custom">-- Nhập lý do khác --</option>
              </select>

              {banReason === 'custom' && (
                <input
                  type="text"
                  value={customBanReason}
                  onChange={(e) => setCustomBanReason(e.target.value)}
                  placeholder="Ghi rõ hành vi vi phạm..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400 mt-2"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBanModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:opacity-95 text-white text-xs font-black shadow-lg shadow-rose-600/30"
              >
                Cấm Tài Khoản Này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT STAFF */}
      {/* ------------------------------------------------------------- */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1322] border border-purple-500/40 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  {editingStaff ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingStaff ? `Chỉnh Sửa Quản Trị Viên` : `Thêm Mới Super Mod / Mod`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingStaff ? `Tài khoản: @${editingStaff.username}` : `Cấp quyền quản lý cho thành viên mới`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Tên Đăng Nhập (Username)</label>
                <input
                  type="text"
                  disabled={!!editingStaff}
                  value={staffForm.username}
                  onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value.toLowerCase().trim() })}
                  placeholder="vd: supermod_nam, mod_hang..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 disabled:opacity-60 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center justify-between">
                  <span>Mật Khẩu {editingStaff && '(Để trống nếu không đổi)'}</span>
                  <button
                    type="button"
                    onClick={() => setStaffForm({ ...staffForm, password: 'Pass' + Math.floor(100000 + Math.random() * 900000) })}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </label>
                <input
                  type="text"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder={editingStaff ? 'Nhập mật khẩu mới nếu muốn đổi...' : 'Nhập mật khẩu cho quản trị viên...'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 font-mono tracking-wider"
                  required={!editingStaff}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Tên Hiển Thị (Nickname)</label>
                <input
                  type="text"
                  value={staffForm.displayName}
                  onChange={(e) => setStaffForm({ ...staffForm, displayName: e.target.value })}
                  placeholder="vd: Super Mod Hoàng Nam, Mod Thu Hằng..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Cấp Bậc & Chức Vụ Phân Quyền</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffForm({ ...staffForm, role: 'mod' })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      staffForm.role === 'mod'
                        ? 'bg-teal-500/20 border-teal-400 text-teal-200 font-bold shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs">⚖️ MOD</div>
                    <div className="text-[10px] text-slate-400 font-normal">Điều hành viên</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStaffForm({ ...staffForm, role: 'supermod' })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      staffForm.role === 'supermod'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200 font-bold shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs">🛡️ SUPER MOD</div>
                    <div className="text-[10px] text-slate-400 font-normal">Tổng quản lý</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStaffForm({ ...staffForm, role: 'host' })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      staffForm.role === 'host'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs">👑 ADMIN</div>
                    <div className="text-[10px] text-slate-400 font-normal">Tổng quản trị</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Cấp VIP</label>
                  <select
                    value={staffForm.vipTier}
                    onChange={(e) => setStaffForm({ ...staffForm, vipTier: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="diamond">👑 VIP Kim Cương</option>
                    <option value="gold">🌟 VIP Vàng</option>
                    <option value="silver">🥈 VIP Bạc</option>
                    <option value="none">Thường</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Số Dư Xu Cấp Sẵn</label>
                  <input
                    type="number"
                    value={staffForm.coins}
                    onChange={(e) => setStaffForm({ ...staffForm, coins: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Trạng Thái Tài Khoản</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={staffForm.status === 'active'}
                      onChange={() => setStaffForm({ ...staffForm, status: 'active' })}
                      className="accent-purple-500"
                    />
                    <span className="text-emerald-300 font-bold">Đang hoạt động</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="suspended"
                      checked={staffForm.status === 'suspended'}
                      onChange={() => setStaffForm({ ...staffForm, status: 'suspended' })}
                      className="accent-rose-500"
                    />
                    <span className="text-rose-400 font-bold">Tạm khóa quyền</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Ghi Chú Phân Công Nhiệm Vụ</label>
                <textarea
                  rows={2}
                  value={staffForm.note}
                  onChange={(e) => setStaffForm({ ...staffForm, note: e.target.value })}
                  placeholder="vd: Trực phòng Bolero ca tối 20h - 23h, hỗ trợ giải quyết tranh chấp mic..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-95 text-white font-black shadow-lg shadow-purple-500/20"
                >
                  {editingStaff ? 'Lưu Thay Đổi' : 'Tạo Quản Trị Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
