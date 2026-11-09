import React, { useState } from 'react';
import {
  X,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  ArrowRight,
  Trash2,
  Check,
  Tag,
  CreditCard,
  Building2,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { Account, CategoryInfo, PlannedExpense, Transaction } from '../types';
import { EXPENSE_CATEGORIES, CATEGORY_MAP } from '../constants';
import { formatVND, parseDecimal } from '../utils';

interface PlannedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannedExpenses: PlannedExpense[];
  accounts: Account[];
  onSaveExpense: (expense: PlannedExpense) => void;
  onDeleteExpense: (id: string) => void;
  onQuickPayExpense?: (expense: PlannedExpense) => void;
}

export const PlannedExpenseModal: React.FC<PlannedExpenseModalProps> = ({
  isOpen,
  onClose,
  plannedExpenses,
  accounts,
  onSaveExpense,
  onDeleteExpense,
  onQuickPayExpense,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [cat, setCat] = useState('khac');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  // Calculate Liquid funds vs Unpaid Planned
  const liquidCash = accounts
    .filter((a) => a.type === 'bank' || a.type === 'cash')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const unpaidExpenses = plannedExpenses.filter((e) => !e.isPaid);
  const totalUnpaid = unpaidExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = plannedExpenses
    .filter((e) => e.isPaid)
    .reduce((sum, e) => sum + e.amount, 0);
  const netAfterPlanned = liquidCash - totalUnpaid;

  const filteredList = plannedExpenses.filter((e) => {
    if (filter === 'unpaid') return !e.isPaid;
    if (filter === 'paid') return e.isPaid;
    return true;
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits, dots, commas
    if (/^[0-9.,]*$/.test(raw)) {
      setAmountInput(raw);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseDecimal(amountInput);
    if (!title.trim() || parsedAmount <= 0) return;

    const newExpense: PlannedExpense = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      amount: parsedAmount,
      dueDate,
      cat,
      accountId: accountId || undefined,
      priority,
      note: note.trim() || undefined,
      isPaid: false,
      createdAt: Date.now(),
    };

    onSaveExpense(newExpense);
    setTitle('');
    setAmountInput('');
    setNote('');
    setIsAdding(false);
  };

  const handleTogglePaid = (item: PlannedExpense) => {
    onSaveExpense({
      ...item,
      isPaid: !item.isPaid,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-800/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-pink-500 text-white text-xs shadow-md shadow-pink-500/30">
                📋
              </span>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Kế Hoạch Dự Chi & Tiền Trả Hạn
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dự trù tiền cần chi trước để không bị thâm hụt số dư khả dụng
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700 active:scale-95 transition-all"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Financial Flow Summary Bar */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
              <span className="text-[10px] font-medium text-slate-500 block">Tiền thực có</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white block mt-0.5 tabular-nums">
                {formatVND(liquidCash)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 shadow-xs">
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 block">Cần chi sắp tới</span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-300 block mt-0.5 tabular-nums">
                -{formatVND(totalUnpaid)}
              </span>
            </div>
            <div className={`p-2.5 rounded-2xl border shadow-xs ${
              netAfterPlanned >= 0
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/60 text-rose-700 dark:text-rose-400'
            }`}>
              <span className="text-[10px] font-semibold block">Dư sau dự chi</span>
              <span className="text-xs sm:text-sm font-extrabold block mt-0.5 tabular-nums">
                {formatVND(netAfterPlanned)}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Action buttons + Filter Tabs */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tất cả ({plannedExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unpaid')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filter === 'unpaid'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Cần chi ({unpaidExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('paid')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filter === 'paid'
                    ? 'bg-emerald-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Đã trả
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-sm shadow-pink-500/25 active:scale-95 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              {isAdding ? 'Đóng tạo' : 'Thêm dự chi'}
            </button>
          </div>

          {/* Quick Add Form */}
          {isAdding && (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-2xl bg-pink-50/60 dark:bg-slate-800/80 border border-pink-200/60 dark:border-pink-900/40 space-y-3 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="font-semibold text-xs text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Lập khoản dự chi mới
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Nội dung khoản chi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiền thuê nhà tháng này, Trả thẻ HSBC, Học phí con..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    Số tiền dự kiến (₫) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="3.500.000 hoặc 3500000"
                    value={amountInput}
                    onChange={handleAmountChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                  {amountInput && (
                    <span className="text-[10px] text-pink-600 font-medium mt-0.5 block">
                      = {formatVND(parseDecimal(amountInput))}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    Hạn cần chi
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    Danh mục
                  </label>
                  <select
                    value={cat}
                    onChange={(e) => setCat(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    {EXPENSE_CATEGORIES.map((c: CategoryInfo) => (
                      <option key={c.key} value={c.key}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    Tài khoản dự kiến chi
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatVND(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Ưu tiên:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`px-2 py-0.5 text-[10px] rounded-lg font-semibold transition-all ${
                      priority === 'high'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Bắt buộc / Cố định
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('medium')}
                    className={`px-2 py-0.5 text-[10px] rounded-lg font-semibold transition-all ${
                      priority === 'medium'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Quan trọng
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('low')}
                    className={`px-2 py-0.5 text-[10px] rounded-lg font-semibold transition-all ${
                      priority === 'low'
                        ? 'bg-slate-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Linh hoạt
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-pink-500 text-white shadow-sm hover:bg-pink-600 active:scale-95"
                >
                  Lưu khoản dự chi
                </button>
              </div>
            </form>
          )}

          {/* Planned List */}
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Clock className="h-10 w-10 mx-auto stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-medium">Chưa có khoản dự chi nào</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bấm "+ Thêm dự chi" để lập ngân sách cho tiền nhà, học phí, dư nợ thẻ...
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredList.map((item) => {
                const categoryObj = CATEGORY_MAP[item.cat];
                const accObj = accounts.find((a) => a.id === item.accountId);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      item.isPaid
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 shadow-xs'
                    }`}
                  >
                    {/* Toggle button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePaid(item)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors"
                      title={item.isPaid ? 'Đánh dấu chưa chi' : 'Đánh dấu đã chi'}
                    >
                      {item.isPaid ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 hover:text-emerald-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs font-bold truncate ${
                            item.isPaid
                              ? 'line-through text-slate-400'
                              : 'text-slate-800 dark:text-white'
                          }`}
                        >
                          {categoryObj ? `[${categoryObj.name}] ` : ''}{item.title}
                        </h4>
                        <span
                          className={`text-xs font-extrabold tabular-nums shrink-0 ${
                            item.isPaid
                              ? 'text-slate-400 line-through'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatVND(item.amount)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded-md">
                          <Calendar className="h-2.5 w-2.5" />
                          Hạn: {item.dueDate}
                        </span>

                        {accObj && (
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                            {accObj.name}
                          </span>
                        )}

                        {item.priority === 'high' && (
                          <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-md font-semibold">
                            Bắt buộc
                          </span>
                        )}
                        {item.priority === 'medium' && (
                          <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-semibold">
                            Cần chi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!item.isPaid && onQuickPayExpense && (
                        <button
                          type="button"
                          onClick={() => onQuickPayExpense(item)}
                          className="px-2 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-600 text-[10px] font-bold border border-pink-200/60 transition-all active:scale-95"
                          title="Tạo chi tiêu ngay vào sổ"
                        >
                          Ghi chi
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(item.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                        title="Xoá"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-500/25 active:scale-95 transition-all"
          >
            Đóng bảng dự chi
          </button>
        </div>
      </div>
    </div>
  );
};
