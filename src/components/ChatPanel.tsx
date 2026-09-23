import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Gift, Smile, Sparkles, Heart, Crown, Shield, User,
  Flame, Award, Lock, MessageSquare
} from 'lucide-react';
import { ChatMessage, GiftItem, PrivateMessage, UserPresence } from '../types';
import { VIRTUAL_GIFTS } from '../data/songs';

interface ChatPanelProps {
  messages: ChatMessage[];
  privateMessages: PrivateMessage[];
  users: UserPresence[];
  localUserId: string;
  onSendMessage: (text: string) => void;
  onSendPrivateMessage: (targetUserId: string, targetUserName: string, text: string) => void;
  onSendGift: (gift: GiftItem) => void;
  activePerformerName?: string;
  selectedPmUser?: UserPresence | null;
  onSelectPmUser?: (user: UserPresence | null) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  privateMessages,
  users,
  localUserId,
  onSendMessage,
  onSendPrivateMessage,
  onSendGift,
  activePerformerName,
  selectedPmUser,
  onSelectPmUser
}) => {
  const [chatTab, setChatTab] = useState<'public' | 'pm'>('public');
  const [inputText, setInputText] = useState('');
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pmRecipient, setPmRecipient] = useState<UserPresence | null>(selectedPmUser || null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const EMOJIS = ['❤️', '👏', '🌹', '🎤', '🔥', '🎉', '🥰', '😍', '👍', '💐', '⭐', '✨'];

  useEffect(() => {
    if (selectedPmUser) {
      setPmRecipient(selectedPmUser);
      setChatTab('pm');
    }
  }, [selectedPmUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, privateMessages, chatTab]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (chatTab === 'pm') {
      if (!pmRecipient) {
        alert('Vui lòng chọn người bạn muốn nhắn tin riêng!');
        return;
      }
      onSendPrivateMessage(pmRecipient.id, pmRecipient.name, inputText.trim());
    } else {
      onSendMessage(inputText.trim());
    }
    setInputText('');
  };

  const handleGiftClick = (gift: GiftItem) => {
    onSendGift(gift);
    setShowGiftDrawer(false);
  };

  // Filter PMs between me and the selected recipient
  const filteredPms = pmRecipient
    ? privateMessages.filter(
        (pm) =>
          (pm.senderId === localUserId && pm.receiverId === pmRecipient.id) ||
          (pm.senderId === pmRecipient.id && pm.receiverId === localUserId)
      )
    : [];

  const otherUsers = users.filter((u) => u.id !== localUserId);

  return (
    <div className="bg-[#0e1322] border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-xl overflow-hidden">
      {/* Header with Public / PM Tabs */}
      <div className="p-2 border-b border-slate-800 bg-[#0b0f1a] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setChatTab('public')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              chatTab === 'public'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Kênh Chung</span>
          </button>

          <button
            onClick={() => setChatTab('pm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              chatTab === 'pm'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Tin Nhắn Riêng (PM)</span>
          </button>
        </div>

        <button
          onClick={() => setShowGiftDrawer(!showGiftDrawer)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
            showGiftDrawer
              ? 'bg-rose-500 text-white shadow-md shadow-rose-900/40'
              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Tặng Quà</span>
        </button>
      </div>

      {/* Gift Store Drawer Popover */}
      {showGiftDrawer && (
        <div className="p-3 bg-gradient-to-b from-[#161d33] to-[#0f1424] border-b border-rose-500/30 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Gửi quà tặng khích lệ {activePerformerName ? `ca sĩ ${activePerformerName}` : 'sân khấu'}
            </span>
            <span className="text-[10px] text-slate-400">Xu miễn phí</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {VIRTUAL_GIFTS.map((gift) => (
              <button
                key={gift.id}
                onClick={() => handleGiftClick(gift)}
                className="flex flex-col items-center p-2 rounded-xl bg-slate-900/90 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-400/50 transition-all group active:scale-95 text-center"
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">
                  {gift.icon}
                </span>
                <span className="text-[10px] font-semibold text-slate-200 mt-1 truncate max-w-full">
                  {gift.name}
                </span>
                <span className="text-[9px] text-amber-400 font-mono font-bold">
                  {gift.value} xu
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PM Recipient Selector Bar if in PM Tab */}
      {chatTab === 'pm' && (
        <div className="p-2.5 bg-[#0b0f1a] border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-400 text-xs shrink-0 font-medium">Gửi tới:</span>
            <select
              value={pmRecipient?.id || ''}
              onChange={(e) => {
                const target = users.find((u) => u.id === e.target.value) || null;
                setPmRecipient(target);
                if (onSelectPmUser) onSelectPmUser(target);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 truncate max-w-[200px]"
            >
              <option value="">-- Chọn thành viên để PM --</option>
              {otherUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.role === 'vip' ? '(VIP)' : ''}
                </option>
              ))}
            </select>
          </div>

          {pmRecipient && (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Đang trò chuyện mật
            </span>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 text-xs divide-y divide-slate-800/40"
      >
        {chatTab === 'public' ? (
          messages.map((msg) => {
            const isSystem = msg.type === 'system';
            const isAction = msg.type === 'action';
            const isGift = msg.type === 'gift';

            if (isSystem) {
              return (
                <div key={msg.id} className="pt-2 first:pt-0 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-900/90 text-slate-400 text-[11px] border border-slate-800">
                    {msg.text}
                  </span>
                </div>
              );
            }

            if (isAction) {
              return (
                <div key={msg.id} className="pt-2 first:pt-0 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            if (isGift) {
              return (
                <div
                  key={msg.id}
                  className="pt-2 first:pt-0 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl animate-bounce">{msg.gift?.icon || '🎁'}</span>
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span className="text-amber-300">{msg.userName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">vừa gửi</span>
                      </div>
                      <div className="text-[11px] text-rose-300 font-semibold">
                        {msg.gift?.name} {msg.gift?.icon}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-mono font-bold">
                    +{msg.gift?.value} điểm
                  </div>
                </div>
              );
            }

            const isHost = msg.role === 'host';
            const isSuperMod = msg.role === 'supermod';
            const isMod = msg.role === 'mod';
            const isVip = (msg.role === 'vip' || (msg.vipTier && msg.vipTier !== 'none')) && !isHost && !isSuperMod && !isMod;

            return (
              <div key={msg.id} className="pt-2 first:pt-0 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 mt-0.5">
                  {msg.avatar ? (
                    <img src={msg.avatar} alt={msg.userName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      {msg.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isHost && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/25 text-rose-300 border border-rose-500/40 flex items-center gap-0.5 shadow-sm">
                        <Shield className="w-2.5 h-2.5" /> 👑 ADMIN
                      </span>
                    )}
                    {isSuperMod && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/25 text-purple-300 border border-purple-500/40 flex items-center gap-0.5 shadow-sm">
                        <Shield className="w-2.5 h-2.5 text-purple-400" /> 🛡️ SUPER MOD
                      </span>
                    )}
                    {isMod && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-teal-500/25 text-teal-300 border border-teal-500/40 flex items-center gap-0.5 shadow-sm">
                        <Shield className="w-2.5 h-2.5 text-teal-400" /> ⚖️ MOD
                      </span>
                    )}
                    {isVip && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> {msg.vipTier === 'diamond' ? '💎 VIP' : 'VIP'}
                      </span>
                    )}
                    {!isHost && !isSuperMod && !isMod && !isVip && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-200 text-slate-950 border border-slate-300 flex items-center gap-0.5 shadow-sm">
                        👤 Khách (Nick Đen)
                      </span>
                    )}
                    <span
                      onClick={() => {
                        const target = users.find((u) => u.id === msg.userId);
                        if (target && target.id !== localUserId) {
                          setPmRecipient(target);
                          setChatTab('pm');
                        }
                      }}
                      className={`font-black text-[11px] truncate cursor-pointer hover:underline ${
                        isHost
                          ? 'text-rose-300'
                          : isSuperMod
                          ? 'text-purple-300'
                          : isMod
                          ? 'text-teal-300'
                          : isVip
                          ? 'text-amber-300'
                          : 'text-slate-950 bg-slate-200/90 px-1.5 py-0.5 rounded border border-slate-300 shadow-sm'
                      }`}
                      title="Bấm để nhắn tin riêng (PM)"
                    >
                      {msg.userName}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-auto shrink-0">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-slate-300 break-words leading-relaxed text-xs">
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* PM Chat View */
          !pmRecipient ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Lock className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">Chưa chọn người nhận tin nhắn riêng</p>
              <p className="text-[11px] text-slate-600">
                Hãy chọn một thành viên từ danh sách phía trên hoặc bấm vào tên bất kỳ ai để gửi tin nhắn mật!
              </p>
            </div>
          ) : filteredPms.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-indigo-400" />
              <p className="text-xs">Bắt đầu cuộc trò chuyện riêng với {pmRecipient.name}</p>
              <p className="text-[11px] text-slate-600">Nội dung chỉ có bạn và người ấy đọc được.</p>
            </div>
          ) : (
            filteredPms.map((pm) => {
              const isMine = pm.senderId === localUserId;
              return (
                <div
                  key={pm.id}
                  className={`pt-2 first:pt-0 flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-500 mb-0.5">
                    {isMine ? 'Bạn' : pm.senderName} · {new Date(pm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                    }`}
                  >
                    {pm.text}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none">
          {EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="p-1 hover:bg-slate-800 rounded text-base active:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-[#0b0f1a] border-t border-slate-800 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
          title="Thêm biểu tượng cảm xúc"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            chatTab === 'pm'
              ? pmRecipient
                ? `Nhắn tin riêng cho ${pmRecipient.name}...`
                : 'Chọn người nhận phía trên...'
              : 'Nhập nội dung trò chuyện...'
          }
          maxLength={150}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2.5 rounded-xl font-bold disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md active:scale-95 ${
            chatTab === 'pm'
              ? 'bg-indigo-500 text-white hover:bg-indigo-400'
              : 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 hover:from-amber-300'
          }`}
          title="Gửi tin nhắn"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};
