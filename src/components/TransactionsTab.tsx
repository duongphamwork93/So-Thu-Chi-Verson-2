import React, { useState, useMemo } from 'react';
import {
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Transaction, UserProfile } from '../types';
import { CATEGORY_MAP } from '../constants';
import { formatVND, formatVietnameseDate } from '../utils';

interface TransactionsTabProps {
  currentYear: number;
  currentMonth: number;
  transactions: Transaction[];
  profile: UserProfile;
  onOpenAddModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  currentYear,
  currentMonth,
  transactions,
  profile,
  onOpenAddModal,
  onSelectTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'out' | 'in' | 'other'>('all');

  // Filter transactions for this month
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(monthPrefix));
  }, [transactions, monthPrefix]);

  // Compute month totals
  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'in')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const totalExpense = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'out')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  // 6-Month Trend Data calculation
  const sixMonthData = useMemo(() => {
    const list: Array<{ label: string; year: number; month: number; income: number; expense: number }> = [];
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      const pfx = `${y}-${String(m).padStart(2, '0')}`;
      const mTx = transactions.filter((t) => t.date.startsWith(pfx));
      const inc = mTx.filter((t) => t.type === 'in').reduce((s, t) => s + t.amount, 0);
      const exp = mTx.filter((t) => t.type === 'out').reduce((s, t) => s + t.amount, 0);

      list.push({
        label: `T${m}`,
        year: y,
        month: m,
        income: inc,
        expense: exp,
      });
    }
    return list;
  }, [transactions, currentYear, currentMonth]);

  const maxTrendVal = useMemo(() => {
    let max = 1;
    sixMonthData.forEach((d) => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    });
    return max;
  }, [sixMonthData]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter((t) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = (t.note || '').toLowerCase().includes(q);
        const catNameMatch = (CATEGORY_MAP[t.cat]?.name || '').toLowerCase().includes(q);
        const merchantMatch = (t.merchant || '').toLowerCase().includes(q);
        if (!noteMatch && !catNameMatch && !merchantMatch) return false;
      }

      // Filter pills
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'out') return t.type === 'out';
      if (selectedFilter === 'in') return t.type === 'in';
      if (selectedFilter === 'other') return t.type === 'transfer' || t.cat === 'khac';
      return true;
    });
  }, [monthTransactions, searchQuery, selectedFilter]);

  // Group by date (descending)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, { date: string; items: Transaction[]; netTotal: number }> = {};

    filteredTransactions.forEach((t) => {
      if (!groups[t.date]) {
        groups[t.date] = { date: t.date, items: [], netTotal: 0 };
      }
      groups[t.date].items.push(t);
      if (t.type === 'in') groups[t.date].netTotal += t.amount;
      else if (t.type === 'out') groups[t.date].netTotal -= t.amount;
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions]);

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Two Summary Boxes (Matching Image 3) */}
      <div className="grid grid-cols-2 gap-3">
        {/* TỔNG THU */}
        <div className="rounded-3xl border border-pink-100/90 bg-white p-4 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            TỔNG THU
          </span>
          <p
            className={`font-heading text-lg sm:text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 ${
              profile.hideBalances ? 'balance-hidden' : ''
            }`}
          >
            {formatVND(totalIncome)}
          </p>
        </div>

        {/* TỔNG CHI */}
        <div className="rounded-3xl border border-pink-100/90 bg-white p-4 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            TỔNG CHI
          </span>
          <p
            className={`font-heading text-lg sm:text-xl font-bold tabular-nums text-slate-900 dark:text-white mt-1 ${
              profile.hideBalances ? 'balance-hidden' : ''
            }`}
          >
            {formatVND(totalExpense)}
          </p>
        </div>
      </div>

      {/* 2. CARD: Xu hướng 6 tháng (Matching Image 3) */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-sm font-bold text-slate-800 dark:text-white">
            Xu hướng 6 tháng
          </h3>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Thu</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-[#DE3B68] inline-block" />
              <span>Chi</span>
            </span>
          </div>
        </div>

        {/* Bar chart container */}
        <div className="flex items-end justify-between gap-2 h-32 pt-2 px-2 border-b border-slate-100 dark:border-purple-900/30">
          {sixMonthData.map((d) => {
            const expHeight = Math.max(4, Math.round((d.expense / maxTrendVal) * 90));
            const incHeight = Math.max(4, Math.round((d.income / maxTrendVal) * 90));
            const isCurrent = d.month === currentMonth && d.year === currentYear;

            return (
              <div key={d.label} className="flex-1 flex flex-col items-center h-full justify-end">
                <div className="flex items-end gap-1 h-24 w-full justify-center">
                  {/* Income bar */}
                  <div
                    className="w-2.5 rounded-t-full bg-emerald-400/80 transition-all duration-300"
                    style={{ height: `${d.income > 0 ? incHeight : 4}px` }}
                    title={`Thu: ${formatVND(d.income)}`}
                  />
                  {/* Expense bar */}
                  <div
                    className={`w-3.5 rounded-t-full transition-all duration-300 ${
                      isCurrent ? 'bg-[#DE3B68]' : 'bg-[#DE3B68]/60'
                    }`}
                    style={{ height: `${d.expense > 0 ? expHeight : 4}px` }}
                    title={`Chi: ${formatVND(d.expense)}`}
                  />
                </div>
                <span
                  className={`text-[11px] mt-2 block font-medium ${
                    isCurrent
                      ? 'font-extrabold text-[#DE3B68] dark:text-pink-400'
                      : 'text-slate-400'
                  }`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Search Bar (Matching Image 3) */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-purple-300/60"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo ghi chú, cửa hàng..."
          className="w-full rounded-2xl border border-pink-100/90 bg-white py-3 pl-11 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-2xs focus:border-pink-400 focus:outline-none dark:border-purple-900/40 dark:bg-[#231c35] dark:text-white dark:placeholder-purple-400/50"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-pink-500 hover:text-pink-600"
          >
            Xoá
          </button>
        )}
      </div>

      {/* 4. Filter Pills (Matching Image 3: Tất cả | Khoản chi | Khoản thu | Khác) */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedFilter('all')}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            selectedFilter === 'all'
              ? 'bg-[#DE3B68] text-white shadow-xs'
              : 'border border-pink-100/80 bg-white text-slate-600 hover:bg-pink-50 dark:border-purple-900/50 dark:bg-[#231c35] dark:text-purple-200'
          }`}
        >
          Tất cả
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('out')}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            selectedFilter === 'out'
              ? 'bg-[#DE3B68] text-white shadow-xs'
              : 'border border-pink-100/80 bg-white text-slate-600 hover:bg-rose-50 dark:border-purple-900/50 dark:bg-[#231c35] dark:text-purple-200'
          }`}
        >
          Khoản chi
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('in')}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            selectedFilter === 'in'
              ? 'bg-[#DE3B68] text-white shadow-xs'
              : 'border border-pink-100/80 bg-white text-slate-600 hover:bg-emerald-50 dark:border-purple-900/50 dark:bg-[#231c35] dark:text-purple-200'
          }`}
        >
          Khoản thu
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('other')}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            selectedFilter === 'other'
              ? 'bg-[#DE3B68] text-white shadow-xs'
              : 'border border-pink-100/80 bg-white text-slate-600 hover:bg-purple-50 dark:border-purple-900/50 dark:bg-[#231c35] dark:text-purple-200'
          }`}
        >
          Khác
        </button>
      </div>

      {/* 5. Grouped Transactions List (Matching Image 3) */}
      {groupedByDate.length === 0 ? (
        <div className="rounded-3xl border border-pink-100/90 bg-white p-10 text-center dark:border-purple-900/40 dark:bg-[#231c35]">
          <p className="text-xs font-medium text-slate-400">
            {searchQuery
              ? 'Không tìm thấy giao dịch phù hợp'
              : 'Chưa có giao dịch nào trong tháng này'}
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-pink-50 text-[#DE3B68] px-4 py-2 text-xs font-bold hover:bg-pink-100 active:scale-95 transition-all"
          >
            + Ghi khoản đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => {
            const formattedDate = formatVietnameseDate(group.date);
            return (
              <div
                key={group.date}
                className="rounded-3xl border border-pink-100/90 bg-white p-4 sm:p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35] space-y-3"
              >
                {/* Date header and day total */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-purple-900/30">
                  <span className="font-heading text-xs font-bold text-slate-800 dark:text-white">
                    {formattedDate}
                  </span>
                  <span
                    className={`font-heading text-xs font-extrabold tabular-nums ${
                      group.netTotal >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-800 dark:text-white'
                    } ${profile.hideBalances ? 'balance-hidden' : ''}`}
                  >
                    {group.netTotal >= 0
                      ? `+${formatVND(group.netTotal)}`
                      : `-${formatVND(Math.abs(group.netTotal))}`}
                  </span>
                </div>

                {/* Transactions for this day */}
                <div className="space-y-2.5">
                  {group.items.map((tx) => {
                    const catObj = CATEGORY_MAP[tx.cat];
                    return (
                      <div
                        key={tx.id}
                        onClick={() => onSelectTransaction(tx)}
                        className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* 3-dots icon container matching screenshot */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-purple-900/40 dark:text-purple-300 font-bold text-xs">
                            •••
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                              {tx.note || catObj?.name || 'Chi tiêu'}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-purple-900/30">
                                {catObj?.name || 'Khác'}
                              </span>
                              {tx.accountId && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-purple-900/30">
                                  {tx.accountId.replace('acc_', '').toUpperCase()}
                                </span>
                              )}
                              <span className="rounded-md bg-pink-50 text-pink-600 px-1.5 py-0.5 dark:bg-pink-950/40">
                                {tx.source}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`font-heading text-xs sm:text-sm font-extrabold tabular-nums shrink-0 ml-2 ${
                            tx.type === 'in'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-800 dark:text-white'
                          } ${profile.hideBalances ? 'balance-hidden' : ''}`}
                        >
                          {tx.type === 'in' ? '+' : '-'}
                          {formatVND(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
