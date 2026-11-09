import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Smartphone, 
  Share, 
  PlusSquare, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink,
  Apple
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android'>('ios');
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const fallbackUrl = 'https://ais-dev-uc5n5kjd4j4ldwueni27bb-847226125763.asia-northeast1.run.app';
  const rawUrl = typeof window !== 'undefined' ? window.location.href : '';
  const currentUrl = (rawUrl && !rawUrl.startsWith('about:') && rawUrl.startsWith('http')) 
    ? rawUrl 
    : fallbackUrl;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(currentUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        setInstallSuccess(false);
        onClose();
      }, 2500);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-pink-100 dark:border-slate-800 flex flex-col max-h-[92vh] cursor-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                Cài Đặt Lên Màn Hình Chính
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              </h3>
              <p className="text-[11px] text-white/80">Trải nghiệm toàn màn hình như ứng dụng App Store</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Đóng cửa sổ"
            className="w-11 h-11 rounded-2xl bg-white/25 hover:bg-white/35 active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 mx-5 mt-4 rounded-2xl shrink-0">
          <button
            onClick={() => setActivePlatform('ios')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activePlatform === 'ios'
                ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Apple className="w-4 h-4" />
            iPhone / iPad (iOS)
          </button>
          <button
            onClick={() => setActivePlatform('android')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activePlatform === 'android'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Android / Máy tính
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* App preview mini badge */}
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/30 p-3 border border-pink-100 dark:border-purple-900/40">
            <img 
              src="/pwa-192x192.png" 
              alt="Sổ Thu Chi" 
              className="w-12 h-12 rounded-2xl shadow-sm object-cover" 
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                Sổ Thu Chi AI - Quản Lý & Quét Hoá Đơn
              </h4>
              <p className="text-[11px] text-pink-600 dark:text-pink-300 font-medium">
                ✨ Mở 1 chạm từ màn hình chính · Mượt mà & Không tốn dung lượng
              </p>
            </div>
          </div>

          {activePlatform === 'ios' ? (
            /* iOS Safari Step-by-Step Guide */
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <b>📌 Lưu ý cho iPhone:</b> Apple quy định ứng dụng web (PWA) cần được thêm thông qua trình duyệt <b>Safari</b> để cài đặt lên màn hình chính.
              </div>

              {/* 3 Steps Visual Guide */}
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-pink-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    1
                  </div>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-200">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Mở ứng dụng bằng trình duyệt Safari trên iPhone
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Nếu đang xem trên máy tính, bạn quét mã QR dưới đây hoặc sao chép link gửi qua Zalo để mở trên iPhone.
                    </p>

                    <div className="flex items-center gap-2 pt-1.5">
                      <button
                        onClick={handleCopyLink}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-xs transition-all flex items-center gap-1.5 ${
                          copiedLink 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300 hover:bg-pink-200'
                        }`}
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLink ? 'Đã sao chép link!' : 'Sao chép link app'}
                      </button>

                      <button
                        onClick={() => setShowQR(!showQR)}
                        className="px-3 py-1.5 rounded-xl font-bold text-[11px] bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300 flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        {showQR ? 'Ẩn mã QR' : 'Mở mã QR quét iPhone'}
                      </button>
                    </div>

                    {showQR && (
                      <div className="mt-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center gap-2">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code Link App" 
                          className="w-40 h-40 object-contain"
                        />
                        <span className="text-[10px] text-slate-400 text-center">
                          Mở <b>Camera</b> trên iPhone của bạn và hướng vào mã này để mở ngay
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-pink-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    2
                  </div>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-200">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Nhấn vào nút Chia sẻ (Share)
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 shadow-xs">
                        <Share className="w-3.5 h-3.5" />
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Nút hình vuông có mũi tên hất lên ở thanh công cụ chính giữa dưới đáy màn hình Safari.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-pink-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    3
                  </div>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-200">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Chọn "Thêm vào MH chính" (Add to Home Screen)
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 shadow-xs">
                        <PlusSquare className="w-3.5 h-3.5" />
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Cuộn danh sách tuỳ chọn xuống, bấm vào dòng <b>Thêm vào MH chính</b> rồi bấm <b>"Thêm" (Add)</b> ở góc trên bên phải.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  <b>Xong!</b> Biểu tượng <b>Sổ Thu Chi</b> sẽ xuất hiện trên màn hình iPhone, bấm mở trực tiếp không cần đăng nhập lại.
                </span>
              </div>
            </div>
          ) : (
            /* Android / PC Guide */
            <div className="space-y-3.5 text-xs">
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Trên điện thoại Android hoặc máy tính (Google Chrome / Cốc Cốc / Edge), bạn có thể cài đặt trực tiếp chỉ với 1 lần chạm.
              </p>

              {installSuccess ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 p-3.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Đã cài đặt thành công lên thiết bị!</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 py-3 text-xs font-bold text-white shadow-md shadow-pink-500/25 active:scale-95 transition-all hover:opacity-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Cài Đặt Ứng Dụng Ngay (1 Chạm)</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 text-[11px] text-slate-600 dark:text-slate-300">
                    💡 Mẹo: Bấm vào <b>menu 3 chấm (⋮)</b> ở góc trên cùng bên phải trình duyệt Chrome/Cốc Cốc và chọn <b>"Cài đặt ứng dụng"</b> hoặc <b>"Thêm vào màn hình chính"</b>.
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedLink ? 'Đã sao chép link!' : 'Sao chép link trang web'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-bold text-sm shadow-md shadow-pink-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã hiểu & Vào ứng dụng ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
