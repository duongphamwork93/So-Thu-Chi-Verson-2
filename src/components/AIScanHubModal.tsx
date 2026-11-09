import React, { useRef } from 'react';
import {
  X,
  Sparkles,
  Camera,
  Image as ImageIcon,
  FileText,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface AIScanHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScanMode: (mode: 'single' | 'batch') => void;
  onLoadDemoReceipt: () => void;
  onLoadDemoStatement: () => void;
  onLoadDemoType?: (type: 'receipt' | 'statement' | 'shopee' | 'grab' | 'techcombank') => void;
}

export const AIScanHubModal: React.FC<AIScanHubModalProps> = ({
  isOpen,
  onClose,
  onSelectScanMode,
  onLoadDemoReceipt,
  onLoadDemoStatement,
  onLoadDemoType,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-[#231c35] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100/80 pb-3 dark:border-purple-900/40">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100">
                Cài Đặt & Trung Tâm Quét AI
              </h3>
              <p className="text-[11px] text-gray-400">
                Công nghệ Gemini Vision đọc hoá đơn, sao kê và biến động số dư
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-pink-50 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* Main Action 1: Quét Hoá Đơn Đơn Lẻ */}
          <div
            onClick={() => {
              onSelectScanMode('single');
              onClose();
            }}
            className="group cursor-pointer rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50/70 to-white p-4 transition-all hover:border-pink-300 hover:shadow-xs dark:border-purple-900/40 dark:from-purple-950/30 dark:to-[#1a1428]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                <Camera size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-sm font-bold text-gray-800 dark:text-purple-100">
                    1. Quét Hoá Đơn / Biên Lai Giấy
                  </h4>
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-600 dark:bg-purple-900 dark:text-purple-300">
                    Đơn lẻ
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-purple-300/80 mt-0.5">
                  Chụp hoặc tải ảnh hoá đơn quán ăn, cafe, Co.opmart, WinMart, Shopee, Grab... AI tự bóc tách món ăn và tổng tiền.
                </p>
              </div>
            </div>
          </div>

          {/* Main Action 2: Quét Sao Kê & Biến Động Số Dư */}
          <div
            onClick={() => {
              onSelectScanMode('batch');
              onClose();
            }}
            className="group cursor-pointer rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50/70 to-pink-50/40 p-4 transition-all hover:border-purple-300 hover:shadow-xs dark:border-purple-900/50 dark:from-purple-950/40 dark:to-[#1a1428]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-sm font-bold text-purple-900 dark:text-purple-100">
                    2. Quét Sao Kê & Biến Động Số Dư Ngân Hàng
                  </h4>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                    Nhiều giao dịch
                  </span>
                </div>
                <p className="text-xs text-purple-800/80 dark:text-purple-300/80 mt-0.5">
                  Chụp màn hình lịch sử ngân hàng (VCB, Techcombank, MB, VPBank...). AI nhận diện 10 - 20 giao dịch cùng lúc kèm checklist duyệt trước khi lưu!
                </p>
              </div>
            </div>
          </div>

          {/* Thử Nghiệm Ngay Với Dữ Liệu Mẫu */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200 mb-1.5">
              <Zap size={15} className="text-amber-600" />
              <span>Chưa có sẵn ảnh trên máy? Thử quét ngay các mẫu thực tế:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (onLoadDemoType) onLoadDemoType('shopee');
                  else onLoadDemoStatement();
                  onClose();
                }}
                className="rounded-xl border border-pink-300/80 bg-white px-2.5 py-2 text-left text-xs font-semibold text-pink-900 hover:bg-pink-100/60 dark:bg-[#1a1428] dark:text-pink-200"
              >
                🛍️ Đơn Shopee (3 đơn chờ giao)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onLoadDemoType) onLoadDemoType('grab');
                  else onLoadDemoStatement();
                  onClose();
                }}
                className="rounded-xl border border-emerald-300/80 bg-white px-2.5 py-2 text-left text-xs font-semibold text-emerald-900 hover:bg-emerald-100/60 dark:bg-[#1a1428] dark:text-emerald-200"
              >
                🛵 Hoạt động Grab (3 món)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onLoadDemoType) onLoadDemoType('techcombank');
                  else onLoadDemoStatement();
                  onClose();
                }}
                className="rounded-xl border border-blue-300/80 bg-white px-2.5 py-2 text-left text-xs font-semibold text-blue-900 hover:bg-blue-100/60 dark:bg-[#1a1428] dark:text-blue-200"
              >
                🏦 Techcombank (Sinh lời + MoMo)
              </button>
              <button
                type="button"
                onClick={() => {
                  onLoadDemoReceipt();
                  onClose();
                }}
                className="rounded-xl border border-amber-300/80 bg-white px-2.5 py-2 text-left text-xs font-semibold text-amber-900 hover:bg-amber-100/60 dark:bg-[#1a1428] dark:text-amber-200"
              >
                🧾 Hoá đơn Phúc Long (65k)
              </button>
            </div>
          </div>

          {/* Mẹo Chụp Ảnh Rõ Nét */}
          <div className="rounded-2xl border border-pink-100 bg-pink-50/30 p-3.5 text-xs text-gray-600 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-300">
            <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-purple-100 mb-1.5">
              <Lightbulb size={15} className="text-pink-500" />
              <span>Mẹo để AI đọc chính xác 100%</span>
            </div>
            <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-500 dark:text-purple-300/80">
              <li>Đặt hoá đơn trên mặt phẳng đủ ánh sáng, tránh bóng đổ tay.</li>
              <li>Ảnh chụp thẳng góc, rõ ràng phần <b>TỔNG TIỀN</b> và <b>NGÀY THÁNG</b>.</li>
              <li>Bạn cũng có thể dán ảnh trực tiếp từ bộ nhớ tạm (Ctrl+V) ở bất cứ đâu trên màn hình.</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-pink-50 dark:border-purple-900/40 text-center">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-xs font-semibold text-white shadow-xs"
          >
            Đóng bảng
          </button>
        </div>
      </div>
    </div>
  );
};
