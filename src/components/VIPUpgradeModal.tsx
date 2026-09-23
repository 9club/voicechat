import React, { useState } from 'react';
import {
  X, Crown, Sparkles, Check, Shield, Flame, Gift, Video, QrCode, CreditCard
} from 'lucide-react';
import { wsClient } from '../services/websocket';
import { audioEngine } from '../services/audioEngine';

interface VIPUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVipTier: string;
}

export const VIPUpgradeModal: React.FC<VIPUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentVipTier
}) => {
  const [selectedTier, setSelectedTier] = useState<'silver' | 'gold' | 'diamond'>('gold');
  const [paymentStep, setPaymentStep] = useState<'plans' | 'qr'>('plans');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectUpgrade = (tier: 'silver' | 'gold' | 'diamond') => {
    setSelectedTier(tier);
    setPaymentStep('qr');
  };

  const handleConfirmPayment = () => {
    wsClient.upgradeVIP(selectedTier);
    audioEngine.playFanfare();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setPaymentStep('plans');
      onClose();
    }, 2500);
  };

  const TIERS = [
    {
      id: 'silver',
      name: 'VIP BẠC (Silver)',
      price: '50.000 đ',
      color: 'from-slate-400 to-slate-200 text-slate-950',
      badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      features: [
        'Huy hiệu Bạc 🥈 lấp lánh cạnh biệt danh',
        'Ưu tiên hàng chờ mic bậc 2',
        'Tặng ngay 300 Xu Quà Tặng',
        'Đổi màu chữ chat nổi bật'
      ]
    },
    {
      id: 'gold',
      name: 'VIP VÀNG (Gold)',
      price: '150.000 đ',
      popular: true,
      color: 'from-amber-400 to-amber-200 text-slate-950',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      features: [
        'Huy hiệu Ngôi Sao Vàng 🌟 danh giá',
        'Ưu tiên giữ mic bậc 1 (nhảy vọt trước thành viên thường)',
        'Quyền mở Webcam HD trực tiếp cho cả phòng xem',
        'Tặng ngay 800 Xu + 100 Hoa Hồng Đỏ 🌹',
        'Âm thanh hiệu ứng vỗ tay độc quyền'
      ]
    },
    {
      id: 'diamond',
      name: 'VIP KIM CƯƠNG (Diamond)',
      price: '300.000 đ',
      color: 'from-sky-400 via-indigo-300 to-sky-200 text-slate-950',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      features: [
        'Huy hiệu Vương Miện Kim Cương 👑 tối thượng',
        'Quyền tự tạo Phòng VIP riêng có mật khẩu',
        'Tùy chỉnh không giới hạn thời gian mic',
        'Quyền xem mọi Webcam thành viên không cần xin phép',
        'Tặng ngay Siêu Xe 🏎️ & Du Thuyền 🛥️',
        'Phòng thu chất lượng cao âm thanh Stereo'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1424] border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Nâng Cấp Hội Viên VIP Điệp Khúc
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
                  ĐẶC QUYỀN CA SĨ
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ưu tiên cầm mic biểu diễn, mở webcam và nhận huy hiệu danh giá
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

        {/* Content */}
        {paymentStep === 'plans' ? (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TIERS.map((tier) => {
                const isCurrent = currentVipTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                      tier.popular
                        ? 'bg-gradient-to-b from-amber-500/15 via-[#13192f] to-[#0f1424] border-amber-400/50 shadow-xl shadow-amber-500/10'
                        : 'bg-[#12182c] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                        ĐƯỢC CHỌN NHIỀU NHẤT
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.badgeBg}`}>
                          {tier.name}
                        </span>
                        <div className="mt-2 text-2xl font-black text-white">{tier.price}</div>
                        <span className="text-[11px] text-slate-400">Thời hạn: 30 ngày</span>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                        {tier.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-300">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-[11px]">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5 mt-auto">
                      {isCurrent ? (
                        <div className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 text-center font-bold text-xs">
                          Gói Hiện Tại
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectUpgrade(tier.id as any)}
                          className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 bg-gradient-to-r ${tier.color} hover:opacity-90`}
                        >
                          Nâng Cấp {tier.name.split(' ')[1]}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Payment / VietQR Confirmation Screen */
          <div className="p-6 overflow-y-auto flex flex-col items-center justify-center space-y-5 text-center">
            {isSuccess ? (
              <div className="py-8 space-y-3 animate-in zoom-in-90 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-xl font-black text-white">Nâng Cấp VIP Thành Công!</h3>
                <p className="text-xs text-amber-300">
                  Huy hiệu và đặc quyền ưu tiên của bạn đã được kích hoạt trên toàn hệ thống!
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">
                    Quét Mã VietQR Hoặc Xác Nhận Nhanh
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gói nâng cấp: <strong className="text-amber-400 uppercase">{selectedTier}</strong> · Hạn dùng 30 ngày
                  </p>
                </div>

                {/* Mock VietQR Image */}
                <div className="p-4 bg-white rounded-2xl shadow-xl w-48 h-48 flex flex-col items-center justify-center space-y-2 text-slate-900 border-4 border-amber-400">
                  <QrCode className="w-32 h-32 text-slate-900" />
                  <span className="text-[10px] font-bold text-slate-600">VIETQR DIEPKHUC PAY</span>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 max-w-sm">
                  <div>Ngân hàng: <strong>MBBank / Vietcombank</strong></div>
                  <div>Số tài khoản: <strong>9999.8888.6666</strong></div>
                  <div>Nội dung CK: <strong className="text-amber-400">DKVIP {wsClient.userName}</strong></div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPaymentStep('plans')}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                  >
                    Quay Lại
                  </button>

                  <button
                    onClick={handleConfirmPayment}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Xác Nhận Đã Thanh Toán (Kích Hoạt Ngay)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
