import React, { useState } from 'react';
import {
  X, Music, Play, Pause, Square, Search, Youtube, Sparkles, Check, ExternalLink, Disc, Info
} from 'lucide-react';
import { KARAOKE_SONGS, YOUTUBE_KARAOKE_PRESETS, extractYouTubeId } from '../data/songs';
import { SongItem, CurrentSongState } from '../types';

interface KaraokePlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: CurrentSongState | null;
  onSelectSong: (song: any, autoGrabMic?: boolean) => void;
  onTogglePlay: (isPlaying: boolean) => void;
  onStopSong: () => void;
  mode?: 'normal' | 'select_for_mic';
}

export const KaraokePlayer: React.FC<KaraokePlayerProps> = ({
  isOpen,
  onClose,
  currentSong,
  onSelectSong,
  onTogglePlay,
  onStopSong,
  mode = 'normal'
}) => {
  const [activeTab, setActiveTab] = useState<'diepkhuc' | 'youtube'>('diepkhuc');
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  // YouTube tab state
  const [youtubeInput, setYoutubeInput] = useState('');
  const [customYtTitle, setCustomYtTitle] = useState('');
  const [customYtArtist, setCustomYtArtist] = useState('');
  const [previewYtId, setPreviewYtId] = useState<string | null>(null);

  if (!isOpen) return null;

  const genres = ['all', 'Bolero', 'Trữ Tình', 'Nhạc Trẻ', 'Dân Ca', 'Remix'];

  // Filter DK songs
  const filteredDkSongs = KARAOKE_SONGS.filter((s) => {
    const matchGenre = selectedGenre === 'all' || s.genre === selectedGenre;
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase());
    return matchGenre && matchSearch;
  });

  // Filter YouTube presets
  const filteredYtPresets = YOUTUBE_KARAOKE_PRESETS.filter((s) => {
    const matchGenre = selectedGenre === 'all' || s.genre === selectedGenre;
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase());
    return matchGenre && matchSearch;
  });

  const handleSelectDkSong = (song: SongItem) => {
    onSelectSong(
      {
        ...song,
        source: 'diepkhuc'
      },
      mode === 'select_for_mic'
    );
    onClose();
  };

  const handleSelectYtPreset = (preset: typeof YOUTUBE_KARAOKE_PRESETS[0]) => {
    onSelectSong(
      {
        id: preset.id,
        title: preset.title,
        artist: preset.artist,
        source: 'youtube',
        youtubeId: preset.youtubeId,
        youtubeUrl: `https://www.youtube.com/watch?v=${preset.youtubeId}`,
        genre: preset.genre,
        duration: preset.duration
      },
      mode === 'select_for_mic'
    );
    onClose();
  };

  const handleSelectCustomYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYouTubeId(youtubeInput);
    if (!ytId) {
      alert('Vui lòng nhập đúng đường dẫn YouTube (URL) hoặc mã Video ID hợp lệ!');
      return;
    }

    const title = customYtTitle.trim() || `YouTube Karaoke (${ytId})`;
    const artist = customYtArtist.trim() || 'YouTube Beat';

    onSelectSong(
      {
        id: 'yt_custom_' + ytId,
        title,
        artist,
        source: 'youtube',
        youtubeId: ytId,
        youtubeUrl: `https://www.youtube.com/watch?v=${ytId}`,
        genre: 'Bolero',
        duration: 300
      },
      mode === 'select_for_mic'
    );
    onClose();
  };

  const handlePreviewInput = () => {
    const id = extractYouTubeId(youtubeInput);
    if (id) {
      setPreviewYtId(id);
    } else {
      alert('Link YouTube không hợp lệ! Vui lòng dán link dạng: https://www.youtube.com/watch?v=... hoặc https://youtu.be/...');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e1322] border border-amber-500/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-[#0a0e19] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Music className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  {mode === 'select_for_mic' ? 'Chọn Bài Hát Trước Khi Cầm Mic' : 'Kho Nhạc Karaoke Điệp Khúc & YouTube'}
                </h2>
                {mode === 'select_for_mic' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase animate-pulse">
                    Bắt Buộc Chọn Bài
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {mode === 'select_for_mic'
                  ? 'Quy định phòng hát: Vui lòng chọn bài hát biểu diễn trước khi nhận micro lên sân khấu!'
                  : 'Chọn bài hát yêu thích từ Kho nhạc ngoài ĐK hoặc YouTube Karaoke trực tuyến'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner for Mic Grab */}
        {mode === 'select_for_mic' && (
          <div className="bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 px-5 py-2.5 border-b border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Bấm <strong>[Chọn Bài Này & Lên Mic]</strong> để hệ thống tự động phát bài hát và đưa bạn lên sân khấu biểu diễn!
            </span>
          </div>
        )}

        {/* 2 Main Source Tabs: Nhạc Ngoài ĐK vs Nhạc YouTube */}
        <div className="px-5 pt-3 pb-2 bg-[#0c101c] border-b border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('diepkhuc')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'diepkhuc'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 scale-[1.01]'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>1. Kho Nhạc Ngoài ĐK (Beat Chuẩn + Lời Chữ)</span>
          </button>

          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'youtube'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.01]'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Youtube className="w-4 h-4 text-rose-400" />
            <span>2. Nhạc Trên YouTube (Tìm Kiếm / Dán Link)</span>
          </button>
        </div>

        {/* Active Song Playing Banner (if any) */}
        {currentSong && (
          <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div className="truncate">
                <span className="text-slate-400">Đang phát: </span>
                <strong className="text-white">{currentSong.title}</strong>
                <span className="text-slate-400"> - {currentSong.artist}</span>
                {currentSong.source === 'youtube' && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                    YouTube
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onTogglePlay(!currentSong.isPlaying)}
                className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors flex items-center gap-1 text-[11px]"
              >
                {currentSong.isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{currentSong.isPlaying ? 'Tạm Dừng' : 'Tiếp Tục'}</span>
              </button>
              <button
                onClick={onStopSong}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 transition-colors"
                title="Dừng phát"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: KHO NHẠC NGOÀI ĐK */}
        {activeTab === 'diepkhuc' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search & Genre filters */}
            <div className="p-4 border-b border-slate-800 space-y-2.5 bg-[#0b0f1a]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm bài hát Điệp Khúc, ca sĩ Bolero, Trữ Tình..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedGenre === g
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {g === 'all' ? 'Tất Cả' : g}
                  </button>
                ))}
              </div>
            </div>

            {/* Song List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/50">
              {filteredDkSongs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Không tìm thấy bài hát nào trong kho nhạc Điệp Khúc. Bạn hãy thử chuyển sang tab <strong>"Nhạc Trên YouTube"</strong>!
                </div>
              ) : (
                filteredDkSongs.map((song) => {
                  const isCurrent = currentSong?.id === song.id;
                  return (
                    <div
                      key={song.id}
                      className={`pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border border-amber-500/40'
                          : 'bg-[#101626]/70 hover:bg-[#141b2e] border border-slate-800/80'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                          <span>{song.title}</span>
                          <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                            {song.genre}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/20">
                              ● Đang phát
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300">{song.artist}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>Tempo: {song.tempo} BPM</span>
                          <span>Tone: {song.key}</span>
                          <span>Thời lượng: {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => handleSelectDkSong(song)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
                            mode === 'select_for_mic'
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-amber-500/20'
                              : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{mode === 'select_for_mic' ? 'Chọn Bài Này & Lên Mic' : 'Phát Bài Này'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: NHẠC TRÊN YOUTUBE */}
        {activeTab === 'youtube' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
            {/* Box 1: Paste Link YouTube or Search */}
            <div className="bg-[#12182b] border border-rose-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-rose-500" />
                <h3 className="text-xs font-black text-white uppercase tracking-wide">
                  Dán Link / Tìm Kiếm Video YouTube Karaoke Bất Kỳ
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Nhập link YouTube bài hát (ví dụ: <code className="text-amber-300">https://www.youtube.com/watch?v=...</code> hoặc mã video 11 ký tự):
              </p>

              <form onSubmit={handleSelectCustomYoutube} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={youtubeInput}
                      onChange={(e) => {
                        setYoutubeInput(e.target.value);
                        const id = extractYouTubeId(e.target.value);
                        if (id) setPreviewYtId(id);
                      }}
                      placeholder="Dán link YouTube tại đây (VD: https://www.youtube.com/watch?v=...)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePreviewInput}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 transition-colors"
                  >
                    Xem Thử
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customYtTitle}
                    onChange={(e) => setCustomYtTitle(e.target.value)}
                    placeholder="Tên bài hát (tùy chọn)"
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={customYtArtist}
                    onChange={(e) => setCustomYtArtist(e.target.value)}
                    placeholder="Tên ca sĩ / Beat (tùy chọn)"
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    {previewYtId ? `Đã nhận diện Video ID: ${previewYtId}` : 'Hỗ trợ tất cả video Karaoke trên YouTube'}
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{mode === 'select_for_mic' ? 'Chọn Video Này & Lên Mic' : 'Phát Video Này'}</span>
                  </button>
                </div>
              </form>

              {/* YouTube Video Preview Box */}
              {previewYtId && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Xem trước Video YouTube:</span>
                  </div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-700 max-h-48 mx-auto">
                    <iframe
                      src={`https://www.youtube.com/embed/${previewYtId}?autoplay=0&enablejsapi=1`}
                      title="YouTube Preview"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Box 2: Suggested Curated YouTube Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">
                    Danh Sách YouTube Karaoke Bolero & Trữ Tình Đề Xuất Sẵn
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500">Click chọn hát ngay</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredYtPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-[#101524] border border-slate-800 hover:border-rose-500/50 rounded-2xl p-3 flex flex-col justify-between gap-2.5 transition-all group hover:bg-[#141b2e]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {preset.genre}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {Math.floor(preset.duration / 60)}:{(preset.duration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {preset.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{preset.artist}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setPreviewYtId(preset.youtubeId)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                        title="Xem thử video"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectYtPreset(preset)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all flex items-center justify-center gap-1 shadow-md shadow-rose-600/20"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{mode === 'select_for_mic' ? 'Chọn Bài & Lên Mic' : 'Phát Ngay'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#0a0e19] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Tự động đồng bộ âm thanh & video cho mọi khán giả trong phòng</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
