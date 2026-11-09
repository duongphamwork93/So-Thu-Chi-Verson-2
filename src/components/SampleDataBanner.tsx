import React from 'react';
import { Info, Sparkles, Plus, Trash2 } from 'lucide-react';

interface SampleDataBannerProps {
  onAddFirstTransaction: () => void;
  onClearSampleData: () => void;
}

export const SampleDataBanner: React.FC<SampleDataBannerProps> = ({ 
  onAddFirstTransaction,
  onClearSampleData,
}) => {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-orange-50 to-pink-50 p-3.5 shadow-xs dark:border-amber-900/60 dark:from-amber-950/40 dark:to-purple-950/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 mt-0.5 sm:mt-0">
            <Info size={18} />
          </div>
          <div className="text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
              <span>Đang hiển thị dữ liệu ví dụ</span>
              <span className="rounded-md bg-amber-200/70 px-1.5 py-0.5 text-[10px] text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                Mẫu
              </span>
            </div>
            <p className="mt-0.5 text-amber-800/80 dark:text-amber-300/80 text-[11px] sm:text-xs">
              Sổ đang hiện dữ liệu minh hoạ. Bạn có thể bấm xoá để bắt đầu sổ trống sạch sẽ 0 ₫!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={onClearSampleData}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white/90 px-3 py-1.5 text-xs font-bold text-rose-600 shadow-2xs hover:bg-rose-50 transition-all active:scale-95 dark:bg-slate-900 dark:border-rose-800 dark:text-rose-300 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Xoá dữ liệu test (Về 0 ₫)</span>
          </button>

          <button
            type="button"
            onClick={onAddFirstTransaction}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-transform hover:scale-102 active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>Ghi khoản đầu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
