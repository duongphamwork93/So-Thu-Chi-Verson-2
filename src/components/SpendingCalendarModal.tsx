import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Sparkles, AlertCircle, ShoppingBag, Coffee, Car } from 'lucide-react';
import { Transaction } from '../types';
import { formatVND } from '../utils';
import { CATEGORY_MAP } from '../constants';
import { CategoryIcon } from './CategoryIcon';

interface SpendingCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currentYear: number;
  currentMonth: number;
  monthlyBudget?: number;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const SpendingCalendarModal: React.FC<SpendingCalendarModalProps> = ({
  isOpen,
  onClose,
  transactions,
  currentYear,
  currentMonth,
  monthlyBudget = 15000000,
  onSelectTransaction,
}) => {
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Days in month calculation
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentYear, currentMonth]);

  // First day of week for current month (0: CN, 1: T2, ...)
  const startDayOfWeek = useMemo(() => {
    const d = new Date(currentYear, currentMonth - 1, 1).getDay();
    return d === 0 ? 6 : d - 1; // convert to Monday=0, Sunday=6
  }, [currentYear, currentMonth]);

  // Map transactions by YYYY-MM-DD
  const dailySummary = useMemo(() => {
    const map: Record<string, { outTotal: number; inTotal: number; list: Transaction[] }> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      map[dateKey] = { outTotal: 0, inTotal: 0, list: [] };
    }

    transactions.forEach((tx) => {
      if (tx.date.startsWith(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)) {
        if (!map[tx.date]) {
          map[tx.date] = { outTotal: 0, inTotal: 0, list: [] };
        }
        map[tx.date].list.push(tx);
        if (tx.type === 'out') {
          map[tx.date].outTotal += tx.amount;
        } else if (tx.type === 'in') {
          map[tx.date].inTotal += tx.amount;
        }
      }
    });

    return map;
  }, [transactions, currentYear, currentMonth, daysInMonth]);

  // Forecast & Burn rate calculation
  const stats = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth;
    const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;

    let totalOut = 0;
    let totalIn = 0;

    Object.values(dailySummary).forEach((d) => {
      totalOut += d.outTotal;
      totalIn += d.inTotal;
    });

    const avgDaily = currentDay > 0 ? Math.round(totalOut / currentDay) : 0;
    const daysRemaining = isCurrentMonth ? Math.max(0, daysInMonth - currentDay) : 0;
    const projectedAdditionalSpend = avgDaily * daysRemaining;
    const projectedTotalSpend = totalOut + projectedAdditionalSpend;
    const projectedSurplus = monthlyBudget - projectedTotalSpend;

    return {
      totalOut,
      totalIn,
      avgDaily,
      daysRemaining,
      projectedTotalSpend,
      projectedSurplus,
      isCurrentMonth,
    };
  }, [dailySummary, daysInMonth, currentYear, currentMonth, monthlyBudget]);

  if (!isOpen) return null;

  const selectedDayData = dailySummary[selectedDateStr] || { outTotal: 0, inTotal: 0, list: [] };
  const formattedSelectedDate = (() => {
    const parts = selectedDateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return selectedDateStr;
  })();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl dark:bg-[#231c35] overflow-hidden cursor-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100/80 px-5 py-3.5 dark:border-purple-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-xs">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-gray-800 dark:text-purple-100">
                Lịch Chi Tiêu & Dự Báo Dòng Tiền
              </h3>
              <p className="text-[11px] text-gray-400">
                Tháng {currentMonth}/{currentYear} • Bấm từng ngày để xem chi tiết đơn hàng
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
          {/* Calendar Grid */}
          <div className="rounded-3xl border border-pink-100/80 bg-pink-50/20 p-3 sm:p-4 dark:border-purple-900/30 dark:bg-purple-950/20">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400 mb-1.5">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span className="text-pink-600">T7</span>
              <span className="text-rose-600">CN</span>
            </div>

            {/* Days cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {/* Padding before day 1 */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty_${i}`} className="h-12 sm:h-14 rounded-2xl opacity-0" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayInfo = dailySummary[dateKey] || { outTotal: 0, inTotal: 0, list: [] };
                const isSelected = selectedDateStr === dateKey;
                const isToday =
                  new Date().toISOString().slice(0, 10) === dateKey;

                // Color coding based on expenses
                let bgColor = 'bg-white hover:bg-pink-50/60 dark:bg-[#1a1428]';
                if (dayInfo.outTotal > 500000) {
                  bgColor = 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200';
                } else if (dayInfo.outTotal > 150000) {
                  bgColor = 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200';
                } else if (dayInfo.outTotal > 0) {
                  bgColor = 'bg-pink-50/70 text-pink-900 border-pink-200 dark:bg-purple-950/40 dark:text-pink-200';
                }

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`h-12 sm:h-14 rounded-2xl border p-1 flex flex-col justify-between items-center transition-all ${bgColor} ${
                      isSelected
                        ? 'ring-2 ring-pink-500 shadow-md scale-102 border-pink-400 z-10'
                        : 'border-pink-100/60 dark:border-purple-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-1">
                      <span className={`text-[10px] font-bold ${isToday ? 'rounded-full bg-pink-500 text-white px-1' : ''}`}>
                        {dayNum}
                      </span>
                      {dayInfo.inTotal > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Có khoản thu" />
                      )}
                    </div>

                    <div className="w-full text-center truncate">
                      {dayInfo.outTotal > 0 ? (
                        <span className="font-heading text-[9px] sm:text-[10px] font-bold tabular-nums block truncate">
                          {Math.round(dayInfo.outTotal / 1000)}k
                        </span>
                      ) : (
                        <span className="text-[9px] text-gray-300 dark:text-purple-900/60">-</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cashflow & Burn-rate Forecast Card */}
          <div className="rounded-3xl border border-purple-200 bg-gradient-to-r from-purple-50/70 via-pink-50/60 to-rose-50/40 p-4 text-xs dark:border-purple-900/50 dark:from-purple-950/40 dark:to-pink-950/30">
            <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-100 mb-2">
              <Sparkles size={16} className="text-purple-600" />
              <span>Dự Báo Dòng Tiền & Tốc Độ Chi Tiêu</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="rounded-2xl bg-white/80 p-2.5 dark:bg-[#1a1428]">
                <p className="text-[10px] text-gray-400">Tốc độ chi trung bình</p>
                <p className="font-heading text-sm font-bold text-gray-900 dark:text-purple-100 tabular-nums mt-0.5">
                  {formatVND(stats.avgDaily)}/ngày
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 p-2.5 dark:bg-[#1a1428]">
                <p className="text-[10px] text-gray-400">Dự kiến chi nốt tháng</p>
                <p className="font-heading text-sm font-bold text-rose-600 tabular-nums mt-0.5">
                  {formatVND(stats.projectedTotalSpend)}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-2xl bg-white/80 p-2.5 dark:bg-[#1a1428]">
                <p className="text-[10px] text-gray-400">Dự kiến số dư cuối tháng</p>
                <p className={`font-heading text-sm font-bold tabular-nums mt-0.5 ${stats.projectedSurplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stats.projectedSurplus >= 0 ? `+${formatVND(stats.projectedSurplus)}` : formatVND(stats.projectedSurplus)}
                </p>
              </div>
            </div>

            {stats.isCurrentMonth && stats.daysRemaining > 0 && (
              <p className="mt-2.5 text-[11px] text-purple-800/80 dark:text-purple-300">
                ⏳ Còn <b>{stats.daysRemaining} ngày</b> nữa kết thúc tháng. Hạn mức chi tiêu an toàn còn lại: <b>{formatVND(Math.max(0, monthlyBudget - stats.totalOut))}</b> (~{formatVND(Math.round(Math.max(0, monthlyBudget - stats.totalOut) / Math.max(1, stats.daysRemaining)))}/ngày).
              </p>
            )}
          </div>

          {/* Selected Date Breakdown */}
          <div className="rounded-3xl border border-pink-100 bg-white p-4 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
            <div className="flex items-center justify-between border-b border-pink-50 pb-2 mb-3">
              <div>
                <h4 className="font-heading text-xs sm:text-sm font-bold text-gray-800 dark:text-purple-100">
                  Giao dịch ngày {formattedSelectedDate}
                </h4>
                <p className="text-[10px] text-gray-400">
                  {selectedDayData.list.length} giao dịch phát sinh
                </p>
              </div>

              <div className="text-right">
                <span className="font-heading text-xs font-bold text-rose-600 tabular-nums">
                  -{formatVND(selectedDayData.outTotal)}
                </span>
                {selectedDayData.inTotal > 0 && (
                  <span className="font-heading text-[11px] font-bold text-emerald-600 tabular-nums block">
                    +{formatVND(selectedDayData.inTotal)}
                  </span>
                )}
              </div>
            </div>

            {selectedDayData.list.length > 0 ? (
              <div className="space-y-2">
                {selectedDayData.list.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-pink-50/20 hover:bg-pink-50/50 cursor-pointer transition-colors dark:bg-purple-950/20"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryIcon catKey={tx.cat} size={16} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-purple-100 truncate">
                          {tx.note || tx.merchant || CATEGORY_MAP[tx.cat]?.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {tx.merchant ? `${tx.merchant} • ` : ''}
                          {CATEGORY_MAP[tx.cat]?.name}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`font-heading text-xs font-bold tabular-nums shrink-0 ${
                        tx.type === 'in' ? 'text-emerald-600' : 'text-gray-900 dark:text-purple-100'
                      }`}
                    >
                      {tx.type === 'in' ? `+${formatVND(tx.amount)}` : `-${formatVND(tx.amount)}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-3 text-center italic">
                Không có giao dịch nào trong ngày này.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-pink-100/80 px-5 py-3 text-center bg-white dark:border-purple-900/40 dark:bg-[#231c35]">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-xs font-semibold text-white shadow-xs"
          >
            Đóng lịch chi tiêu
          </button>
        </div>
      </div>
    </div>
  );
};
