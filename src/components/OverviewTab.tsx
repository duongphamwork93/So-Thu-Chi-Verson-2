import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Baby,
  Calendar,
  Wallet,
  Clock,
} from 'lucide-react';
import { Account, InvestmentHolding, PlannedExpense, Transaction, UserProfile } from '../types';
import { CATEGORY_MAP } from '../constants';
import { formatVND } from '../utils';

interface OverviewTabProps {
  currentYear: number;
  currentMonth: number;
  transactions: Transaction[];
  accounts: Account[];
  investments?: InvestmentHolding[];
  plannedExpenses?: PlannedExpense[];
  profile: UserProfile;
  onOpenAddModal: () => void;
  onNavigateToTab: (tab: 'transactions' | 'accounts' | 'ai' | 'settings') => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenPlannedExpense?: () => void;
  onOpenCategoryBudget?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  currentYear,
  currentMonth,
  transactions,
  accounts,
  investments = [],
  plannedExpenses = [],
  profile,
  onOpenAddModal,
  onNavigateToTab,
  onSelectTransaction,
  onOpenPlannedExpense,
  onOpenCategoryBudget,
}) => {
  // Filter transactions for this month
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const monthTransactions = transactions.filter((t) => t.date.startsWith(monthPrefix));

  // Compute Total Income and Total Expense
  const totalIncome = monthTransactions
    .filter((t) => t.type === 'in')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === 'out')
    .reduce((sum, t) => sum + t.amount, 0);

  const remaining = totalIncome - totalExpense;
  const savedRate = totalIncome > 0 ? Math.max(0, Math.round((remaining / totalIncome) * 100)) : 0;

  // Days in month calculation for budget pacing
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === currentYear && now.getMonth() + 1 === currentMonth;
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;
  const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

  // Budget calculations
  const monthlyBudget = profile.monthlyBudget || 0;
  const budgetUsedPercent = monthlyBudget > 0 ? Math.round((totalExpense / monthlyBudget) * 100) : 0;
  const remainingBudget = monthlyBudget - totalExpense;
  const dailySpendable = Math.max(0, Math.round(remainingBudget / daysRemaining));

  // 50/30/20 Rule Calculations
  let needExpense = 0;
  let wantExpense = 0;
  let explicitSaveExpense = 0;

  monthTransactions.forEach((t) => {
    if (t.type === 'out') {
      const group = CATEGORY_MAP[t.cat]?.group || 'want';
      if (group === 'need') needExpense += t.amount;
      else if (group === 'want') wantExpense += t.amount;
      else if (group === 'save') explicitSaveExpense += t.amount;
    }
  });

  const needPercent = totalIncome > 0 ? Math.round((needExpense / totalIncome) * 100) : 0;
  const wantPercent = totalIncome > 0 ? Math.round((wantExpense / totalIncome) * 100) : 0;
  const savePercent = totalIncome > 0 ? Math.round(((explicitSaveExpense + Math.max(0, remaining)) / totalIncome) * 100) : 0;

  // Category breakdown for donut chart
  const categoryTotals: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.type === 'out')
    .forEach((t) => {
      categoryTotals[t.cat] = (categoryTotals[t.cat] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryTotals)
    .map(([catKey, amount]) => ({
      catKey,
      name: CATEGORY_MAP[catKey]?.name || catKey,
      color: CATEGORY_MAP[catKey]?.color || '#E44B78',
      amount,
      percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategories = sortedCategories.slice(0, 4);
  const otherTotalAmount = sortedCategories.slice(4).reduce((sum, c) => sum + c.amount, 0);

  // Generate conic gradient for donut chart
  let gradientStops: string[] = [];
  let cumulativePercent = 0;
  if (sortedCategories.length > 0 && totalExpense > 0) {
    topCategories.forEach((cat) => {
      const start = cumulativePercent;
      const end = cumulativePercent + (cat.amount / totalExpense) * 100;
      gradientStops.push(`${cat.color} ${start}% ${end}%`);
      cumulativePercent = end;
    });
    if (otherTotalAmount > 0) {
      gradientStops.push(`#CBD5E1 ${cumulativePercent}% 100%`);
    }
  }
  const donutBackground =
    gradientStops.length > 0
      ? `conic-gradient(${gradientStops.join(', ')})`
      : 'conic-gradient(#FCE7F3 0% 100%)';

  // Net Worth calculations
  const bankAndCashBalance = accounts
    .filter((a) => a.type === 'bank' || a.type === 'cash')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const savingsTotal = accounts
    .filter((a) => a.type === 'savings')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const creditDebtTotal = accounts
    .filter((a) => a.type === 'credit')
    .reduce((sum, a) => sum + (a.creditBalance || 0), 0);

  const investmentMarketValue = investments.reduce(
    (sum, inv) => sum + inv.shares * inv.currentPrice,
    0
  );

  const totalAssets = bankAndCashBalance + savingsTotal + investmentMarketValue;
  const netWorth = totalAssets - creditDebtTotal;

  // Planned Expenses calculations
  const unpaidPlanned = plannedExpenses.filter((p) => !p.isPaid).reduce((sum, p) => sum + p.amount, 0);
  const netAfterPlanned = bankAndCashBalance - unpaidPlanned;

  // Recent 5 transactions
  const recentTransactions = [...monthTransactions]
    .sort((a, b) => (b.date === a.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date)))
    .slice(0, 5);

  return (
    <div className="space-y-4 pb-20">
      {/* 1. HERO BALANCE CARD (Matching Image 1) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#DE3B68] via-[#E44B78] to-[#EA618D] p-5 sm:p-6 text-white shadow-lg shadow-pink-500/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
            Còn lại tháng này
          </span>

          {totalIncome === 0 ? (
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-xs">
              Chưa ghi thu
            </span>
          ) : (
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-xs flex items-center gap-1">
              <Sparkles size={11} />
              <span>Giữ lại {savedRate}%</span>
            </span>
          )}
        </div>

        {/* Big Balance Number */}
        <div className="mt-3">
          <h2
            className={`font-heading text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight ${
              profile.hideBalances ? 'balance-hidden' : ''
            }`}
          >
            {remaining >= 0 ? formatVND(remaining) : `-${formatVND(Math.abs(remaining))}`}
          </h2>
        </div>

        {/* Two Sub-Boxes: Thu & Chi */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {/* Thu */}
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/10">
            <p className="text-xs font-medium text-white/80 flex items-center gap-1">
              <ArrowDownLeft size={14} />
              <span>Thu</span>
            </p>
            <p
              className={`mt-1 font-heading text-sm sm:text-base font-bold tabular-nums text-white ${
                profile.hideBalances ? 'balance-hidden' : ''
              }`}
            >
              {formatVND(totalIncome)}
            </p>
          </div>

          {/* Chi */}
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/10">
            <p className="text-xs font-medium text-white/80 flex items-center gap-1">
              <ArrowUpRight size={14} />
              <span>Chi</span>
            </p>
            <p
              className={`mt-1 font-heading text-sm sm:text-base font-bold tabular-nums text-white ${
                profile.hideBalances ? 'balance-hidden' : ''
              }`}
            >
              {formatVND(totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. CARD: Ngân sách chi (Matching Image 1) */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white">
            Ngân sách chi
          </h3>
          <button
            type="button"
            onClick={onOpenCategoryBudget}
            className="text-xs font-bold text-[#DE3B68] hover:underline cursor-pointer"
          >
            {monthlyBudget > 0 ? 'Sửa ngân sách' : 'Đặt ngân sách'}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          {/* Circular ring indicator */}
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-pink-50 p-2 dark:bg-purple-950/50">
            <div
              className="h-full w-full rounded-full flex items-center justify-center border-4 border-pink-200 dark:border-purple-800"
              style={{
                borderColor: monthlyBudget > 0 && budgetUsedPercent > 100 ? '#F43F5E' : '#FCE7F3',
              }}
            >
              <div className="text-center">
                <span className="font-heading text-xs font-extrabold text-slate-800 dark:text-white block">
                  {monthlyBudget > 0 ? `${budgetUsedPercent}%` : '—'}
                </span>
                <span className="text-[9px] text-slate-400 block -mt-0.5">đã dùng</span>
              </div>
            </div>
          </div>

          <div className="flex-1 text-xs">
            {monthlyBudget > 0 ? (
              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-white">
                  Đã tiêu {formatVND(totalExpense)} / {formatVND(monthlyBudget)}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Còn lại{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatVND(Math.max(0, remainingBudget))}
                  </span>{' '}
                  • Trung bình mỗi ngày được tiêu <b>{formatVND(dailySpendable)}</b> trong{' '}
                  {daysRemaining} ngày tới.
                </p>
              </div>
            ) : (
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-0.5">
                  Chưa đặt ngân sách
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Đặt mức chi tối đa mỗi tháng để biết mỗi ngày còn được tiêu bao nhiêu.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. CARD: Quy tắc 50/30/20 (Matching Image 1) */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white">
            Quy tắc 50/30/20
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SO VỚI THU NHẬP
          </span>
        </div>

        {totalIncome === 0 ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Ghi khoản thu (lương, thưởng) để so sánh chi tiêu với quy tắc 50% thiết yếu, 30% mong
            muốn, 20% tiết kiệm.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30">
                <span className="text-[10px] text-slate-500 block">Thiết yếu (50%)</span>
                <span className="font-bold text-rose-600 block mt-0.5">{needPercent}%</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                <span className="text-[10px] text-slate-500 block">Mong muốn (30%)</span>
                <span className="font-bold text-purple-600 block mt-0.5">{wantPercent}%</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <span className="text-[10px] text-slate-500 block">Tiết kiệm (20%)</span>
                <span className="font-bold text-emerald-600 block mt-0.5">{savePercent}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. CARD: Chi theo danh mục (Matching Image 1) */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white mb-3">
          Chi theo danh mục
        </h3>

        {totalExpense === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Chưa có khoản chi nào trong tháng này</p>
        ) : (
          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              <div
                className="h-full w-full rounded-full transition-all duration-500 shadow-xs"
                style={{ background: donutBackground }}
              />
              <div className="absolute h-18 w-18 rounded-full bg-white dark:bg-[#231c35] flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-[9px] text-slate-400 font-medium">Tổng chi</span>
                <span className="font-heading text-xs font-black text-slate-800 dark:text-white tabular-nums">
                  {totalExpense >= 1000000
                    ? `${(totalExpense / 1000000).toFixed(1).replace('.', ',')} tr`
                    : formatVND(totalExpense)}
                </span>
              </div>
            </div>

            {/* Categories List */}
            <div className="flex-1 space-y-2 text-xs">
              {topCategories.map((cat) => (
                <div key={cat.catKey} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-slate-700 dark:text-slate-200 truncate font-medium">
                      {cat.name}
                    </span>
                  </div>
                  <span className="font-bold tabular-nums text-slate-800 dark:text-white shrink-0">
                    {cat.percent}%
                  </span>
                </div>
              ))}
              {otherTotalAmount > 0 && (
                <div className="flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300 shrink-0" />
                    <span>Mục khác</span>
                  </div>
                  <span className="font-bold tabular-nums">
                    {Math.round((otherTotalAmount / totalExpense) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. CARD: Gần đây (Matching Image 4) */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white">Gần đây</h3>
          <button
            type="button"
            onClick={() => onNavigateToTab('transactions')}
            className="text-xs font-bold text-[#DE3B68] hover:underline"
          >
            Xem tất cả
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">Chưa có giao dịch gần đây</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => {
              const catObj = CATEGORY_MAP[tx.cat];
              const accObj = accounts.find((a) => a.id === tx.accountId);
              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                        {accObj && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-purple-900/30 truncate max-w-[120px]">
                            {accObj.name}
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
        )}
      </div>

      {/* 6. CARD: Chi cho con & Kế hoạch dự chi (Matching Image 4) */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white">
              Chi cho con & Dự chi
            </h3>
            {unpaidPlanned > 0 && (
              <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5">
                Cần trả {formatVND(unpaidPlanned)}
              </span>
            )}
          </div>
          {onOpenPlannedExpense && (
            <button
              type="button"
              onClick={onOpenPlannedExpense}
              className="text-xs font-bold text-[#DE3B68] hover:underline"
            >
              Lập dự chi
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Ghi các khoản sữa, bỉm, học phí, tiền nhà, trả nợ thẻ... vào nhóm dự chi để biết mỗi tháng
          nuôi con và trang trải tốn bao nhiêu.
        </p>

        {/* Cash flow overview strip */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block">Tiền thực có</span>
            <span
              className={`font-extrabold text-slate-800 dark:text-white block mt-0.5 tabular-nums ${
                profile.hideBalances ? 'balance-hidden' : ''
              }`}
            >
              {formatVND(bankAndCashBalance)}
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 block">Cần chi tới</span>
            <span
              className={`font-extrabold text-amber-600 block mt-0.5 tabular-nums ${
                profile.hideBalances ? 'balance-hidden' : ''
              }`}
            >
              -{formatVND(unpaidPlanned)}
            </span>
          </div>
          <div
            className={`p-2.5 rounded-2xl ${
              netAfterPlanned >= 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
            }`}
          >
            <span className="text-[10px] block">Dư sau dự chi</span>
            <span
              className={`font-extrabold block mt-0.5 tabular-nums ${
                profile.hideBalances ? 'balance-hidden' : ''
              }`}
            >
              {formatVND(netAfterPlanned)}
            </span>
          </div>
        </div>
      </div>

      {/* 7. CARD: Tài sản ròng (Matching Image 4) */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white">
            Tài sản ròng
          </h3>
          <button
            type="button"
            onClick={() => onNavigateToTab('accounts')}
            className="text-xs font-bold text-[#DE3B68] hover:underline"
          >
            Chi tiết
          </button>
        </div>

        <h2
          className={`font-heading text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight ${
            netWorth >= 0 ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-white'
          } ${profile.hideBalances ? 'balance-hidden' : ''}`}
        >
          {netWorth >= 0 ? formatVND(netWorth) : `-${formatVND(Math.abs(netWorth))}`}
        </h2>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Tài sản{' '}
          {totalAssets >= 1000000
            ? `${(totalAssets / 1000000).toFixed(1).replace('.', ',')} tr`
            : formatVND(totalAssets)}{' '}
          • Phải thu 0 • Nợ {formatVND(creditDebtTotal)}
        </p>
      </div>

      {/* 8. CARD: Nhờ AI đọc sổ tháng này (Matching Image 4) */}
      <div
        onClick={() => onNavigateToTab('ai')}
        className="rounded-3xl border border-pink-200/80 bg-gradient-to-r from-pink-50/80 via-rose-50/60 to-purple-50/80 p-4 sm:p-5 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between dark:border-purple-900/50 dark:from-[#2a1d3d] dark:to-[#231c35]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#DE3B68] to-[#EA618D] text-white shadow-sm">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <h4 className="font-heading text-sm font-bold text-slate-800 dark:text-white">
              Nhờ AI đọc sổ tháng này
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
              Tìm khoản chi rò rỉ, gợi ý tiết kiệm và cách phân bổ tiền dư.
            </p>
          </div>
        </div>

        <ChevronRight size={20} className="text-slate-400 shrink-0 ml-2" />
      </div>
    </div>
  );
};
