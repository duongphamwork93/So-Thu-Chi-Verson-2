import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ArrowUpRight, 
  Gift, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { formatMoney } from '../utils';

interface CreditCardHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  currentMonth: string; // YYYY-MM
  onPayCardDebt: (cardAccount: Account) => void;
  onOpenAddCard: () => void;
}

export const CreditCardHubModal: React.FC<CreditCardHubModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  currentMonth,
  onPayCardDebt,
  onOpenAddCard,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  if (!isOpen) return null;

  const creditCards = accounts.filter(a => a.type === 'credit');
  const activeCard = creditCards.find(c => c.id === selectedCardId) || creditCards[0];

  // Helper to calculate days until due date
  const getDueDaysInfo = (dueDay?: number) => {
    if (!dueDay) return { daysLeft: null, status: 'unknown', text: 'Chưa cài đặt ngày hạn' };
    const today = new Date();
    const currentDay = today.getDate();
    let targetDate = new Date(today.getFullYear(), today.getMonth(), dueDay);

    if (currentDay > dueDay) {
      // Due date is next month
      targetDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    }

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { daysLeft: 0, status: 'danger', text: 'Hôm nay là hạn thanh toán!' };
    } else if (diffDays <= 3) {
      return { daysLeft: diffDays, status: 'danger', text: `Gấp! Còn ${diffDays} ngày đến hạn` };
    } else if (diffDays <= 7) {
      return { daysLeft: diffDays, status: 'warning', text: `Còn ${diffDays} ngày nữa` };
    } else {
      return { daysLeft: diffDays, status: 'good', text: `Còn thảnh thơi ${diffDays} ngày` };
    }
  };

  // Transactions on active card for the selected month
  const cardTransactions = activeCard 
    ? transactions.filter(t => t.accountId === activeCard.id && t.date.startsWith(currentMonth))
    : [];

  const totalSpentThisMonth = cardTransactions
    .filter(t => t.type === 'out')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashbackRate = activeCard?.creditCardCashback || 1.0;
  const estimatedCashback = Math.round((totalSpentThisMonth * cashbackRate) / 100);

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
        <div className="px-6 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                Trợ Lý Thẻ & Hoàn Tiền
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              </h3>
              <p className="text-xs text-white/80">Quản lý hạn mức, lịch thanh toán & tích lũy Cashback</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {creditCards.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-pink-50 dark:bg-pink-950/40 text-pink-500 flex items-center justify-center shadow-inner">
                <CreditCard className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Bạn chưa thêm thẻ tín dụng nào</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Thêm thẻ Visa/Mastercard để app tự động nhắc lịch trả nợ không lo phạt lãi và tự động tính hoàn tiền!
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenAddCard();
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm shadow-md shadow-pink-500/25 inline-flex items-center gap-2 hover:opacity-95 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Thêm thẻ tín dụng mới
              </button>
            </div>
          ) : (
            <>
              {/* Card Switcher tabs if multiple cards */}
              {creditCards.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {creditCards.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCardId(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        (activeCard?.id === c.id)
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {c.name}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddCard();
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300 flex items-center gap-1 hover:bg-pink-100 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm thẻ
                  </button>
                </div>
              )}

              {activeCard && (
                <>
                  {/* Virtual Card Graphic */}
                  <div className={`p-5 rounded-3xl text-white shadow-xl relative overflow-hidden bg-gradient-to-br ${activeCard.cardGradient || 'from-indigo-600 via-purple-600 to-pink-600'}`}>
                    {/* Background decorative circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">{activeCard.bankName}</div>
                        <h4 className="font-bold text-lg tracking-wide">{activeCard.name}</h4>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase">
                        {activeCard.cardNetwork || 'VISA'}
                      </div>
                    </div>

                    {/* Balance & Limit info */}
                    <div className="space-y-3 relative z-10">
                      <div>
                        <div className="text-xs text-white/70">Dư nợ hiện tại cần trả</div>
                        <div className="text-2xl font-black tabular-nums tracking-tight">
                          {formatMoney(activeCard.creditBalance || activeCard.balance || 0)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/15 text-xs">
                        <div>
                          <span className="text-white/70 block">Hạn mức thẻ:</span>
                          <span className="font-semibold tabular-nums">
                            {activeCard.creditLimit ? formatMoney(activeCard.creditLimit) : 'Chưa đặt'}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/70 block">Khả dụng còn lại:</span>
                          <span className="font-semibold tabular-nums text-emerald-200">
                            {activeCard.creditLimit 
                              ? formatMoney(Math.max(0, activeCard.creditLimit - (activeCard.creditBalance || activeCard.balance || 0)))
                              : 'Không giới hạn'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Due Date & Statement Notice Card */}
                  {(() => {
                    const dueInfo = getDueDaysInfo(activeCard.creditDueDay);
                    return (
                      <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-pink-500" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              Lịch thanh toán hàng tháng
                            </span>
                          </div>
                          {dueInfo.status === 'danger' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Cần thanh toán ngay
                            </span>
                          )}
                          {dueInfo.status === 'warning' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Sắp đến hạn
                            </span>
                          )}
                          {dueInfo.status === 'good' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> An toàn
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] text-slate-400 block mb-0.5">Ngày đến hạn</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {activeCard.creditDueDay ? `Mùng ${activeCard.creditDueDay} hàng tháng` : 'Chưa đặt'}
                            </span>
                            <p className="text-[10px] text-pink-500 font-medium mt-1">
                              {dueInfo.text}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] text-slate-400 block mb-0.5">Ngày chốt sao kê</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {activeCard.creditStatementDay ? `Mùng ${activeCard.creditStatementDay} hàng tháng` : 'Chưa đặt'}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Chu kỳ miễn lãi ~45 ngày
                            </p>
                          </div>
                        </div>

                        {/* Payoff Action Button */}
                        <button
                          onClick={() => {
                            onClose();
                            onPayCardDebt(activeCard);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          Thanh toán nợ thẻ ngay (Chuyển khoản trả nợ)
                        </button>
                      </div>
                    );
                  })()}

                  {/* Cashback Tracker Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200 dark:border-amber-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs">
                        <Gift className="w-4 h-4" />
                        Tích Lũy Hoàn Tiền (Cashback) Tháng Này
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-200/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                        {cashbackRate}% hoàn
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <div className="text-[11px] text-amber-700/70 dark:text-amber-400">Đã quẹt tháng này:</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                          {formatMoney(totalSpentThisMonth)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-amber-700/70 dark:text-amber-400">Tiền hoàn ước tính:</div>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums">
                          +{formatMoney(estimatedCashback)}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-200/50 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                      <span>
                        Mẹo: Dùng thẻ này thanh toán Shopee & Grab (đã cấu hình mặc định) để tối đa hoá điểm thưởng và hoàn tiền lên đến 6%!
                      </span>
                    </div>
                  </div>

                  {/* Recent Transactions on this card */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Chi tiêu qua thẻ tháng này ({cardTransactions.length})</span>
                      <span className="text-[11px] text-slate-400 font-normal">Tự động gán tài khoản</span>
                    </h5>

                    {cardTransactions.length === 0 ? (
                      <p className="text-center py-4 text-xs text-slate-400">
                        Chưa có giao dịch quẹt thẻ nào trong tháng này.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {cardTransactions.slice(0, 8).map(tx => (
                          <div 
                            key={tx.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {tx.note || tx.cat}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                <span>{tx.date}</span>
                                {tx.merchant && (
                                  <span className="px-1.5 py-0.2 rounded bg-pink-50 text-pink-600 dark:bg-pink-950/40 text-[9px] font-medium">
                                    {tx.merchant}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="font-bold text-rose-500 tabular-nums">
                              -{formatMoney(tx.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            An toàn thẻ tín dụng & tránh phí phạt
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-300 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
