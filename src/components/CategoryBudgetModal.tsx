import React, { useState } from 'react';
import { 
  X, 
  Target, 
  Check, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  Sliders,
  DollarSign,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../constants';
import { Transaction, UserProfile } from '../types';
import { formatMoney, parseVND } from '../utils';
import { CategoryIcon } from './CategoryIcon';

interface CategoryBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  transactions: Transaction[];
  currentMonth: string; // YYYY-MM
  onSaveCategoryBudgets: (categoryBudgets: Record<string, number>) => void;
}

export const CategoryBudgetModal: React.FC<CategoryBudgetModalProps> = ({
  isOpen,
  onClose,
  profile,
  transactions,
  currentMonth,
  onSaveCategoryBudgets,
}) => {
  const [budgets, setBudgets] = useState<Record<string, number>>(() => ({
    ...(profile.categoryBudgets || {
      an_uong: 4000000,
      mua_sam: 2000000,
      cafe: 800000,
      di_lai: 1200000,
      cho_sieu_thi: 3000000,
    }),
  }));

  if (!isOpen) return null;

  // Calculate actual spending per category in currentMonth
  const monthlyExpenses = transactions.filter(
    t => t.type === 'out' && t.date.startsWith(currentMonth)
  );

  const spentByCat: Record<string, number> = {};
  monthlyExpenses.forEach(t => {
    spentByCat[t.cat] = (spentByCat[t.cat] || 0) + t.amount;
  });

  const totalAssignedBudget = Object.values(budgets).reduce((sum, b) => sum + (b || 0), 0);
  const overallMonthlyBudget = profile.monthlyBudget || 15000000;
  const unassignedBudget = overallMonthlyBudget - totalAssignedBudget;

  const handleBudgetChange = (catKey: string, value: number) => {
    setBudgets(prev => ({
      ...prev,
      [catKey]: Math.max(0, value),
    }));
  };

  const handleQuickAdd = (catKey: string, delta: number) => {
    setBudgets(prev => ({
      ...prev,
      [catKey]: Math.max(0, (prev[catKey] || 0) + delta),
    }));
  };

  const handleClear = (catKey: string) => {
    setBudgets(prev => {
      const next = { ...prev };
      delete next[catKey];
      return next;
    });
  };

  const handleSave = () => {
    onSaveCategoryBudgets(budgets);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-pink-100 dark:border-slate-800 cursor-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                Hạn Mức Chi Tiêu Từng Mục
                <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
              </h3>
              <p className="text-xs text-white/80">Đặt trần chi cho Ăn uống, Mua sắm, Cafe... tránh vung tay quá trán</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Budget Bar */}
        <div className="px-5 py-3.5 bg-pink-50/60 dark:bg-slate-800/80 border-b border-pink-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400">Tổng ngân sách tháng:</span>
            <div className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">
              {formatMoney(overallMonthlyBudget)}
            </div>
          </div>
          <div className="space-y-0.5 text-center">
            <span className="text-slate-500 dark:text-slate-400">Đã phân bổ các mục:</span>
            <div className="font-bold text-pink-600 dark:text-pink-400 tabular-nums">
              {formatMoney(totalAssignedBudget)}
            </div>
          </div>
          <div className="space-y-0.5 text-right">
            <span className="text-slate-500 dark:text-slate-400">Chưa phân bổ:</span>
            <div className={`font-bold tabular-nums ${unassignedBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatMoney(unassignedBudget)}
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
            <Info className="w-4 h-4 text-pink-500 shrink-0" />
            <span>
              Thanh đo sẽ chuyển màu cam khi vượt 80% hạn mức và đỏ cảnh báo khi vượt 100%.
            </span>
          </div>

          <div className="space-y-3.5">
            {EXPENSE_CATEGORIES.map(cat => {
              const spent = spentByCat[cat.key] || 0;
              const budget = budgets[cat.key] || 0;
              const hasBudget = budget > 0;
              const percentage = hasBudget ? Math.round((spent / budget) * 100) : 0;
              const isOver = hasBudget && spent > budget;
              const isWarning = hasBudget && percentage >= 80 && !isOver;

              return (
                <div 
                  key={cat.key}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2.5 transition-all"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CategoryIcon catKey={cat.key} size={18} />
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          {cat.name}
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 uppercase">
                            {cat.group}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Đã chi tháng này: <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{formatMoney(spent)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    {hasBudget ? (
                      isOver ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Vượt {formatMoney(spent - budget)}
                        </span>
                      ) : isWarning ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          {percentage}% (Cảnh giác)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Còn {formatMoney(budget - spent)}
                        </span>
                      )
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Chưa đặt hạn mức</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {hasBudget && (
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver 
                              ? 'bg-rose-500' 
                              : isWarning 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 tabular-nums">
                        <span>{percentage}% hạn mức</span>
                        <span>Mục tiêu: {formatMoney(budget)}</span>
                      </div>
                    </div>
                  )}

                  {/* Budget input & quick pills */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        value={budget > 0 ? budget.toLocaleString('vi-VN') : ''}
                        onChange={(e) => handleBudgetChange(cat.key, parseVND(e.target.value))}
                        placeholder="Đặt số tiền (₫)..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-400">₫</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleQuickAdd(cat.key, 500000)}
                        className="px-2 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300 text-[10px] font-semibold hover:bg-pink-100"
                      >
                        +500k
                      </button>
                      <button
                        onClick={() => handleQuickAdd(cat.key, 1000000)}
                        className="px-2 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300 text-[10px] font-semibold hover:bg-pink-100"
                      >
                        +1tr
                      </button>
                      {budget > 0 && (
                        <button
                          onClick={() => handleClear(cat.key)}
                          title="Xoá hạn mức"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-300 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-500/25 hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Lưu Hạn Mức Danh Mục
          </button>
        </div>
      </div>
    </div>
  );
};
