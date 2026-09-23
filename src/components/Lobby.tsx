import React, { useState } from 'react';
import {
  Mic, Users, Radio, Music, Flame, Search, Lock, Headphones,
  Sparkles, Coffee, Award, Play, ChevronRight, Trophy
} from 'lucide-react';
import { RoomSummary } from '../types';
import { KARAOKE_SONGS } from '../data/songs';

interface LobbyProps {
  rooms: RoomSummary[];
  onJoinRoom: (roomId: string) => void;
  onOpenCreateRoom: () => void;
  activeNav: 'lobby' | 'karaoke' | 'ranking' | 'help';
  setActiveNav: (nav: 'lobby' | 'karaoke' | 'ranking' | 'help') => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Tất Cả', icon: Radio },
  { id: 'Âm Nhạc', label: 'Âm Nhạc', icon: Music },
  { id: 'Bolero', label: 'Bolero & Trữ Tình', icon: Flame },
  { id: 'DJ & Remix', label: 'DJ & Nonstop', icon: Headphones },
  { id: 'Tâm Sự', label: 'Tâm Sự - Kết Bạn', icon: Coffee },
  { id: 'Tranh Tài', label: 'Cuộc Thi - Idol', icon: Award }
];

export const Lobby: React.FC<LobbyProps> = ({
  rooms,
  onJoinRoom,
  onOpenCreateRoom,
  activeNav,
  setActiveNav
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = rooms.filter(room => {
    const matchesCat = selectedCategory === 'all' || room.category === selectedCategory;
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.hostName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalUsers = rooms.reduce((acc, r) => acc + r.userCount, 0);
  const totalInQueue = rooms.reduce((acc, r) => acc + r.queueCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-8">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Điệp Khúc Live - Diễn đàn Ca Nhạc & Voice Chat Đỉnh Cao
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Sân Khấu Hát Cho Nhau Nghe & Kết Bạn Bốn Phương
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Trải nghiệm phòng hát video voice chat phong cách Điệp Khúc kinh điển: Xếp hàng cầm mic, song ca bolero, live webcam sân khấu và giao lưu cùng hàng ngàn bạn bè khắp nơi!
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-200 font-medium">{rooms.length}</span> Phòng đang mở
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-200 font-medium">{totalUsers}</span> Bạn bè trực tuyến
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-200 font-medium">{totalInQueue}</span> Đang đợi xếp hàng mic
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => onJoinRoom(rooms[0]?.id || 'phong-1')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-500/25 hover:from-rose-400 hover:to-amber-400 transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              <Mic className="w-4 h-4 text-amber-200" />
              <span>Vào Sân Khấu Chính Ngay</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={onOpenCreateRoom}
              className="px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-semibold text-sm border border-slate-700/70 transition-colors flex items-center justify-center gap-2"
            >
              <span>Mở Phòng Của Bạn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs navigation content switch */}
      {activeNav === 'karaoke' && (
        <div className="bg-[#0f1424] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-amber-400" />
                Kho Bài Hát Karaoke Chuẩn Âm Thanh Sân Khấu
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Các bản phối Bolero, Trữ Tình, Remix tích hợp beat chuẩn và lời bài hát chạy chữ thời gian thực.
              </p>
            </div>
            <button
              onClick={() => setActiveNav('lobby')}
              className="text-xs text-amber-400 hover:underline font-medium"
            >
              Quay lại danh sách phòng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {KARAOKE_SONGS.map(song => (
              <div
                key={song.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-all flex items-center justify-between group"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                    {song.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {song.artist} · <span className="text-amber-400/90 font-medium">{song.genre}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    BPM: {song.tempo} · Tone: {song.key} · {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <button
                  onClick={() => onJoinRoom('phong-1')}
                  className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-colors"
                  title="Vào phòng hát bài này"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeNav === 'ranking' && (
        <div className="bg-[#0f1424] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Bảng Vàng Danh Dự - Ngôi Sao Tiếng Hát Điệp Khúc
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tôn vinh những giọng ca vàng nhận được nhiều Hoa Hồng và Quà Tặng nhất trong tuần!
              </p>
            </div>
            <button
              onClick={() => setActiveNav('lobby')}
              className="text-xs text-amber-400 hover:underline font-medium"
            >
              Quay lại danh sách phòng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 rounded-xl p-5 text-center relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 p-1 mb-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                  alt="Top 1"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider">Top 1 Quán Quân</div>
              <div className="text-base font-bold text-white mt-1">Hương Lan (Cần Thơ)</div>
              <div className="text-xs text-slate-400 mt-0.5">Dòng nhạc Bolero</div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                👑 2,450 Hoa Hồng & Quà
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-400/10 to-transparent border border-slate-500/30 rounded-xl p-5 text-center relative">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-500/20 border-2 border-slate-300 p-1 mb-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                  alt="Top 2"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="text-slate-300 text-xs font-bold uppercase tracking-wider">Top 2 Á Quân</div>
              <div className="text-base font-bold text-white mt-1">Quang Dũng Sài Gòn</div>
              <div className="text-xs text-slate-400 mt-0.5">Trữ Tình & Tiền Chiến</div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/20 text-slate-200 text-xs font-semibold">
                🥈 1,890 Hoa Hồng & Quà
              </div>
            </div>

            <div className="bg-gradient-to-b from-rose-700/10 to-transparent border border-rose-500/30 rounded-xl p-5 text-center relative">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border-2 border-amber-600 p-1 mb-3">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                  alt="Top 3"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="text-amber-500 text-xs font-bold uppercase tracking-wider">Top 3 Quý Quân</div>
              <div className="text-base font-bold text-white mt-1">Thùy Chi Hà Nội</div>
              <div className="text-xs text-slate-400 mt-0.5">Nhạc Nhẹ & Ballad</div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold">
                🥉 1,420 Hoa Hồng & Quà
              </div>
            </div>
          </div>
        </div>
      )}

      {activeNav === 'help' && (
        <div className="bg-[#0f1424] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Nội Quy Phòng Chat & Hướng Dẫn Cầm Mic Điệp Khúc
            </h2>
            <button
              onClick={() => setActiveNav('lobby')}
              className="text-xs text-amber-400 hover:underline font-medium"
            >
              Quay lại danh sách phòng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <h3 className="font-bold text-amber-400 text-sm">1. Quy Trình Cầm Mic (Xếp Hàng)</h3>
              <p>
                - Mỗi thành viên bấm nút <strong>[Xếp Hàng Mic]</strong> để ghi danh thứ tự.
              </p>
              <p>
                - Khi đến lượt, hệ thống tự động bật mic cho bạn biểu diễn trên sân khấu.
              </p>
              <p>
                - Mỗi lượt hát có thời lượng tối đa từ 3 - 6 phút tùy phòng quy định. Hát xong vui lòng bấm <strong>[Trả Mic]</strong> để nhường lượt cho bạn kế tiếp.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <h3 className="font-bold text-amber-400 text-sm">2. Văn Hóa Ứng Xử & Cổ Vũ</h3>
              <p>
                - Không sử dụng ngôn từ thô tục, xúc phạm hay kích động tôn giáo, chính trị.
              </p>
              <p>
                - Tích cực sử dụng các nút tiếng vỗ tay 👏, hò reo 🎉 và tặng hoa hồng 🌹 để khích lệ người đang biểu diễn trên sân khấu.
              </p>
              <p>
                - Bật hiệu ứng Vang Reverb để giọng hát mượt mà, sâu lắng như phòng thu chuyên nghiệp.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Rooms Directory Section */}
      <div className="space-y-4">
        {/* Controls: Search & Category Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên phòng hoặc chủ phòng..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map(room => {
            const hasSinger = !!room.activeSinger;
            return (
              <div
                key={room.id}
                className="group relative bg-[#0e1322] hover:bg-[#12192d] border border-slate-800/90 hover:border-amber-500/40 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-xl hover:shadow-black/50"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {room.category}
                      </span>
                      {room.isLocked && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                          <Lock className="w-2.5 h-2.5" /> Có khóa
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1" title="Số người trong phòng">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{room.userCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400/90" title="Số người đang xếp hàng mic">
                        <Mic className="w-3.5 h-3.5" />
                        <span>{room.queueCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {room.name}
                  </h3>

                  {/* Room Topic */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[36px]">
                    {room.topic}
                  </p>

                  {/* Singer Spotlight Bar */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                          <Mic className={`w-3.5 h-3.5 ${hasSinger ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                        </div>
                        {hasSinger && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                          Đang Cầm Mic
                        </div>
                        <div className="text-xs font-semibold text-slate-200 truncate">
                          {room.activeSinger || 'Sân khấu đang trống'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-500">Chủ Phòng</div>
                      <div className="text-xs text-slate-300 font-medium max-w-[90px] truncate">
                        {room.hostName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Âm thanh Stereo HD
                  </span>
                  <button
                    onClick={() => onJoinRoom(room.id)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/15 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Vào Phòng</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-16 bg-[#0e1322] rounded-2xl border border-slate-800 p-8 space-y-3">
            <Mic className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">Không tìm thấy phòng phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không có phòng nào khớp với từ khóa tìm kiếm. Bạn có thể tự tạo phòng mới để bạn bè cùng tham gia!
            </p>
            <button
              onClick={onOpenCreateRoom}
              className="mt-2 px-4 py-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors"
            >
              Mở Phòng Ngay Bây Giờ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
