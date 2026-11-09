import React, { useState } from 'react';
import {
  Landmark,
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowRightLeft,
  Plus,
  Percent,
  Coins,
  Edit2,
  Trash2,
  PiggyBank,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { Account, InvestmentHolding, UserProfile } from '../types';
import { VIETNAMESE_BANKS } from '../constants';
import { formatVND, parseDecimal } from '../utils';
import { AddCreditCardModal } from './AddCreditCardModal';
import { AddInvestmentModal } from './AddInvestmentModal';

interface AccountsTabProps {
  accounts: Account[];
  investments?: InvestmentHolding[];
  profile: UserProfile;
  onOpenTransferModal: () => void;
  onOpenCreditPaymentModal: () => void;
  onSaveAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onSaveInvestment: (inv: InvestmentHolding) => void;
  onDeleteInvestment: (invId: string) => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts,
  investments = [],
  profile,
  onOpenTransferModal,
  onOpenCreditPaymentModal,
  onSaveAccount,
  onDeleteAccount,
  onSaveInvestment,
  onDeleteInvestment,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bank' | 'savings' | 'invest' | 'credit'>('bank');

  // Modals state
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState(false);
  const [editingCreditCard, setEditingCreditCard] = useState<Account | null>(null);

  const [isAddInvestModalOpen, setIsAddInvestModalOpen] = useState(false);
  const [editingInvest, setEditingInvest] = useState<InvestmentHolding | null>(null);

  // Group accounts
  const bankAndCashAccounts = accounts.filter(
    (a) => a.type === 'bank' || a.type === 'cash'
  );
  const savingsAccounts = accounts.filter((a) => a.type === 'savings');
  const creditCards = accounts.filter((a) => a.type === 'credit');

  // Balances
  const bankAndCashBalance = bankAndCashAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const savingsTotal = savingsAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const creditDebtTotal = creditCards.reduce((sum, a) => sum + (a.creditBalance || 0), 0);
  const totalCreditLimit = creditCards.reduce((sum, a) => sum + (a.creditLimit || 0), 0);
  const availableCreditLimit = Math.max(0, totalCreditLimit - creditDebtTotal);

  // Investment Market Value
  const investmentMarketValue = investments.reduce(
    (sum, inv) => sum + inv.shares * inv.currentPrice,
    0
  );
  const investmentCostValue = investments.reduce(
    (sum, inv) => sum + inv.shares * inv.buyPrice,
    0
  );
  const totalInvestmentProfit = investmentMarketValue - investmentCostValue;

  const totalAssets = bankAndCashBalance + savingsTotal + investmentMarketValue;
  const netWorth = totalAssets - creditDebtTotal;

  return (
    <div className="space-y-4 pb-20">
      {/* 1. TOP NET WORTH CARD (Matching Image 2) */}
      <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            TÀI SẢN RÒNG = TÀI SẢN + CHO VAY - NỢ
          </span>
        </div>

        <div className="mt-2">
          <h2
            className={`font-heading text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight ${
              netWorth >= 0 ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'
            } ${profile.hideBalances ? 'balance-hidden' : ''}`}
          >
            {netWorth >= 0 ? formatVND(netWorth) : `-${formatVND(Math.abs(netWorth))}`}
          </h2>
        </div>

        {/* 3 Boxes: Tổng tài sản | Cho vay chưa thu | Đang nợ */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-2xl bg-slate-50/80 p-3 dark:bg-purple-950/30">
            <span className="text-[10px] text-slate-400 block font-medium">Tổng tài sản</span>
            <span
              className={`font-heading text-sm font-extrabold tabular-nums block mt-0.5 text-slate-800 dark:text-white ${
                profile.hideBalances ? 'balance-hidden' : ''
              }`}
            >
              {totalAssets >= 1000000
                ? `${(totalAssets / 1000000).toFixed(1).replace('.', ',')} tr`
                : formatVND(totalAssets)}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50/80 p-3 dark:bg-purple-950/30">
            <span className="text-[10px] text-slate-400 block font-medium">Cho vay chưa thu</span>
            <span className="font-heading text-sm font-extrabold tabular-nums block mt-0.5 text-emerald-600">
              0
            </span>
          </div>

          <div className="rounded-2xl bg-rose-50/80 p-3 dark:bg-rose-950/30">
            <span className="text-[10px] text-rose-500 block font-medium">Đang nợ</span>
            <span
              className={`font-heading text-sm font-extrabold tabular-nums block mt-0.5 text-rose-600 ${
                profile.hideBalances ? 'balance-hidden' : ''
              }`}
            >
              {creditDebtTotal > 0 ? `-${formatVND(creditDebtTotal)}` : '0'}
            </span>
          </div>
        </div>

        <p className="mt-3.5 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3 dark:border-purple-900/30">
          Khi có cả tài sản và vài tháng chi tiêu, ứng dụng sẽ tính quỹ dự phòng của bạn đủ dùng bao
          lâu.
        </p>
      </div>

      {/* 2. SUB-TABS PILLS (Matching Image 2: Tài khoản | Tiết kiệm | Đầu tư | Thẻ tín dụng) */}
      <div className="flex rounded-2xl bg-pink-100/50 p-1 dark:bg-purple-950/60">
        <button
          type="button"
          onClick={() => setActiveSubTab('bank')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
            activeSubTab === 'bank'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-purple-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-purple-300'
          }`}
        >
          Tài khoản
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('savings')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
            activeSubTab === 'savings'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-purple-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-purple-300'
          }`}
        >
          Tiết kiệm
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('invest')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
            activeSubTab === 'invest'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-purple-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-purple-300'
          }`}
        >
          Đầu tư
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('credit')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
            activeSubTab === 'credit'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-purple-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-purple-300'
          }`}
        >
          Thẻ tín dụng
        </button>
      </div>

      {/* 3. SUBTAB CONTENT */}

      {/* SUBTAB 1: TÀI KHOẢN VÀ VÍ (Matching Image 2) */}
      {activeSubTab === 'bank' && (
        <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white">
                Tài khoản và ví
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tổng{' '}
                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {formatVND(bankAndCashBalance)}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons matching screenshot */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingAccount(null);
                setIsAddAccountModalOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-pink-100/80 text-[#DE3B68] py-2.5 text-xs font-bold hover:bg-pink-100 active:scale-95 transition-all dark:bg-purple-900/50 dark:text-pink-300 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Thêm tài khoản</span>
            </button>

            <button
              type="button"
              onClick={onOpenTransferModal}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-200 cursor-pointer"
            >
              <ArrowRightLeft size={15} />
              <span>Chuyển tiền</span>
            </button>
          </div>

          {/* Section: NGÂN HÀNG & TIỀN MẶT */}
          <div className="pt-2 space-y-2.5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              <span>NGÂN HÀNG & VÍ</span>
              <span>
                {bankAndCashBalance >= 1000000
                  ? `${(bankAndCashBalance / 1000000).toFixed(1).replace('.', ',')} TR`
                  : formatVND(bankAndCashBalance)}
              </span>
            </div>

            {bankAndCashAccounts.map((account) => {
              const isCash = account.type === 'cash';
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-pink-200 transition-all dark:border-purple-900/30 dark:bg-[#1a1428]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white font-heading font-black text-xs shadow-xs"
                      style={{ backgroundColor: account.color || '#008542' }}
                    >
                      {isCash ? (
                        <Wallet size={18} />
                      ) : (
                        account.bankName?.slice(0, 3).toUpperCase() || 'NH'
                      )}
                    </div>
                    <div>
                      <h4 className="font-heading text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                        {account.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {account.bankName || 'Tiền mặt'}
                        {account.accountNumber ? ` • ${account.accountNumber}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-heading text-xs sm:text-sm font-extrabold tabular-nums ${
                        account.balance >= 0
                          ? 'text-slate-800 dark:text-white'
                          : 'text-rose-600 dark:text-rose-400'
                      } ${profile.hideBalances ? 'balance-hidden' : ''}`}
                    >
                      {formatVND(account.balance)}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingAccount(account);
                        setIsAddAccountModalOpen(true);
                      }}
                      className="p-1 text-slate-300 hover:text-slate-600 rounded-lg"
                      title="Sửa"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xoá tài khoản ${account.name}?`)) {
                          onDeleteAccount(account.id);
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded-lg"
                      title="Xoá"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: TIẾT KIỆM (Savings accounts) */}
      {activeSubTab === 'savings' && (
        <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white">
                Sổ tiết kiệm ngân hàng
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tổng gửi:{' '}
                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {formatVND(savingsTotal)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingInvest(null);
                setIsAddInvestModalOpen(true);
              }}
              className="flex items-center gap-1 rounded-2xl bg-pink-100 text-[#DE3B68] px-3 py-2 text-xs font-bold hover:bg-pink-200 active:scale-95 transition-all"
            >
              <Plus size={14} />
              <span>+ Gửi sổ mới</span>
            </button>
          </div>

          {savingsAccounts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <PiggyBank size={36} className="mx-auto text-slate-300 mb-2" />
              <p>Chưa có sổ tiết kiệm nào</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bấm "+ Gửi sổ mới" để theo dõi kỳ hạn và lãi suất tiền gửi
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savingsAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-white dark:border-purple-900/30 dark:bg-[#1a1428]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading text-sm font-bold text-slate-800 dark:text-white">
                        {account.name}
                      </h4>
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                        Lãi suất: {account.savingsInterestRate || 5.5}% / năm • Kỳ hạn:{' '}
                        {account.savingsTermMonths || 6} tháng
                      </p>
                    </div>

                    <span
                      className={`font-heading text-sm font-extrabold text-slate-800 dark:text-white tabular-nums ${
                        profile.hideBalances ? 'balance-hidden' : ''
                      }`}
                    >
                      {formatVND(account.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: ĐẦU TƯ (Cổ phiếu, CCQ, Vàng bạc) */}
      {activeSubTab === 'invest' && (
        <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white">
                Cổ phiếu, Quỹ mở & Vàng bạc
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Giá trị thị trường:{' '}
                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {formatVND(investmentMarketValue)}
                </span>
                {investmentCostValue > 0 && (
                  <span
                    className={`ml-1 font-bold ${
                      totalInvestmentProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    ({totalInvestmentProfit >= 0 ? '+' : ''}
                    {formatVND(totalInvestmentProfit)})
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingInvest(null);
                setIsAddInvestModalOpen(true);
              }}
              className="flex items-center gap-1 rounded-2xl bg-pink-100 text-[#DE3B68] px-3 py-2 text-xs font-bold hover:bg-pink-200 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Thêm tài sản</span>
            </button>
          </div>

          {investments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <TrendingUp size={36} className="mx-auto text-slate-300 mb-2" />
              <p>Chưa có khoản đầu tư nào</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bấm "+ Thêm tài sản" để theo dõi cổ phiếu, chứng chỉ quỹ mở, vàng nhẫn/SJC (hỗ trợ
                số lẻ dấu phẩy ,)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {investments.map((inv) => {
                const holdingValue = Math.round(inv.shares * inv.currentPrice);
                const holdingCost = Math.round(inv.shares * inv.buyPrice);
                const holdingProfit = holdingValue - holdingCost;
                const profitRate =
                  holdingCost > 0 ? ((holdingProfit / holdingCost) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-pink-200 transition-all dark:border-purple-900/30 dark:bg-[#1a1428]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-xs font-black px-2 py-0.5 rounded-lg bg-pink-50 text-pink-600 dark:bg-purple-950 dark:text-pink-300">
                            {inv.symbol}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-white">
                            {inv.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Nắm giữ: <b>{inv.shares.toString().replace('.', ',')}</b> {inv.unit || 'CP'}{' '}
                          • Giá vốn: {formatVND(inv.buyPrice)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-heading text-xs sm:text-sm font-extrabold tabular-nums block ${
                            profile.hideBalances ? 'balance-hidden' : ''
                          }`}
                        >
                          {formatVND(holdingValue)}
                        </span>
                        <span
                          className={`text-[10px] font-bold tabular-nums ${
                            holdingProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {holdingProfit >= 0 ? `+${formatVND(holdingProfit)}` : formatVND(holdingProfit)}{' '}
                          ({holdingProfit >= 0 ? `+${profitRate}%` : `${profitRate}%`})
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex justify-end gap-2 border-t border-slate-50 pt-2 dark:border-purple-900/20">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInvest(inv);
                          setIsAddInvestModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Xoá tài sản ${inv.symbol}?`)) {
                            onDeleteInvestment(inv.id);
                          }
                        }}
                        className="text-[11px] font-semibold text-rose-500 hover:text-rose-700"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: THẺ TÍN DỤNG (HSBC, VPBank...) */}
      {activeSubTab === 'credit' && (
        <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white">
                Thẻ tín dụng cá nhân
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dư nợ: <span className="font-bold text-rose-600">{formatVND(creditDebtTotal)}</span>{' '}
                • Khả dụng: {formatVND(availableCreditLimit)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenCreditPaymentModal}
                className="flex items-center gap-1 rounded-2xl bg-emerald-50 text-emerald-700 px-3 py-2 text-xs font-bold hover:bg-emerald-100 active:scale-95 transition-all"
              >
                <CheckCircle size={14} />
                <span>Trả nợ thẻ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingCreditCard(null);
                  setIsAddCreditModalOpen(true);
                }}
                className="flex items-center gap-1 rounded-2xl bg-pink-100 text-[#DE3B68] px-3 py-2 text-xs font-bold hover:bg-pink-200 active:scale-95 transition-all"
              >
                <Plus size={14} />
                <span>+ Thêm thẻ</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creditCards.map((card) => {
              const limit = card.creditLimit || 30000000;
              const used = card.creditBalance || 0;
              const available = Math.max(0, limit - used);
              const usedPercent = Math.min(100, Math.round((used / limit) * 100));

              return (
                <div
                  key={card.id}
                  className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lg transition-all"
                  style={{
                    background:
                      card.cardGradient ||
                      'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #450A0A 100%)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black tracking-wide text-sm">
                          {card.bankName || 'NGÂN HÀNG'}
                        </span>
                        {card.bankName?.toLowerCase().includes('hsbc') && (
                          <span className="rounded-full bg-white/20 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-yellow-200">
                            ⭐ ĐẶC QUYỀN HSBC
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/80 font-medium mt-0.5">{card.name}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {card.creditCardCashback ? (
                        <div className="flex items-center gap-1 rounded-full bg-yellow-400/20 backdrop-blur-md px-2 py-1 text-[10px] font-bold text-yellow-300 border border-yellow-300/30">
                          <Percent size={10} />
                          <span>Hoàn {card.creditCardCashback}%</span>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingCreditCard(card);
                          setIsAddCreditModalOpen(true);
                        }}
                        className="rounded-full bg-white/20 p-1.5 text-white/90 hover:bg-white/30 transition-all"
                        title="Chỉnh sửa thông số thẻ"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="my-4 flex items-center justify-between text-xs tracking-widest font-mono text-white/90">
                    <span>{card.accountNumber || '•••• •••• •••• 8888'}</span>
                    <span className="font-sans font-bold text-[10px] uppercase opacity-75">
                      {card.cardNetwork || 'VISA'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/80">
                      <span>Dư nợ đã chi: {usedPercent}%</span>
                      <span>Hạn mức: {formatVND(limit)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-black/25 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          usedPercent > 80
                            ? 'bg-rose-300'
                            : usedPercent > 50
                            ? 'bg-amber-300'
                            : 'bg-emerald-300'
                        }`}
                        style={{ width: `${usedPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-white/70">Dư nợ hiện tại</p>
                      <p
                        className={`font-heading text-base font-extrabold tabular-nums ${
                          profile.hideBalances ? 'balance-hidden' : ''
                        }`}
                      >
                        {formatVND(used)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/70">Khả dụng còn lại</p>
                      <p
                        className={`font-heading text-base font-bold tabular-nums text-emerald-200 ${
                          profile.hideBalances ? 'balance-hidden' : ''
                        }`}
                      >
                        {formatVND(available)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 backdrop-blur-md px-3 py-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-white/90">
                      <Calendar size={12} className="text-yellow-300" />
                      <span>
                        Sao kê: <b>{card.creditStatementDay || 25}</b> • Hạn trả: <b>{card.creditDueDay || 15}</b>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenCreditPaymentModal}
                      className="rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-[10px] font-bold text-white transition-all active:scale-95"
                    >
                      Thanh toán
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Internal Modals */}
      {isAddAccountModalOpen && (
        <AddAccountModal
          isOpen={isAddAccountModalOpen}
          initialAccount={editingAccount}
          onClose={() => {
            setIsAddAccountModalOpen(false);
            setEditingAccount(null);
          }}
          onSave={(acc) => {
            onSaveAccount(acc);
            setIsAddAccountModalOpen(false);
            setEditingAccount(null);
          }}
        />
      )}

      {isAddCreditModalOpen && (
        <AddCreditCardModal
          isOpen={isAddCreditModalOpen}
          editingCard={editingCreditCard}
          onClose={() => {
            setIsAddCreditModalOpen(false);
            setEditingCreditCard(null);
          }}
          onSave={(card) => {
            onSaveAccount(card);
            setIsAddCreditModalOpen(false);
            setEditingCreditCard(null);
          }}
        />
      )}

      {isAddInvestModalOpen && (
        <AddInvestmentModal
          isOpen={isAddInvestModalOpen}
          editingInv={editingInvest}
          onClose={() => {
            setIsAddInvestModalOpen(false);
            setEditingInvest(null);
          }}
          onSaveInvestment={(inv) => {
            onSaveInvestment(inv);
            setIsAddInvestModalOpen(false);
            setEditingInvest(null);
          }}
          onSaveSavingsAccount={(sav) => {
            onSaveAccount(sav);
            setIsAddInvestModalOpen(false);
            setEditingInvest(null);
          }}
        />
      )}
    </div>
  );
};

// Internal Add/Edit Bank Account Modal
interface AddAccountModalProps {
  isOpen: boolean;
  initialAccount: Account | null;
  onClose: () => void;
  onSave: (acc: Account) => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  initialAccount,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialAccount?.name || '');
  const [bankName, setBankName] = useState(initialAccount?.bankName || 'Techcombank');
  const [type, setType] = useState<'bank' | 'cash'>(
    initialAccount?.type === 'cash' ? 'cash' : 'bank'
  );
  const [balanceInput, setBalanceInput] = useState(
    initialAccount?.balance !== undefined ? initialAccount.balance.toString() : '0'
  );
  const [accountNumber, setAccountNumber] = useState(initialAccount?.accountNumber || '');
  const [color, setColor] = useState(initialAccount?.color || '#008542');

  if (!isOpen) return null;

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/^[0-9.,-]*$/.test(raw)) {
      setBalanceInput(raw);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedBalance = parseDecimal(balanceInput);

    const accountToSave: Account = {
      id: initialAccount?.id || `acc_${Date.now()}`,
      name: name.trim(),
      bankName: type === 'cash' ? 'Tiền mặt' : bankName,
      type,
      balance: parsedBalance,
      accountNumber: accountNumber.trim() || undefined,
      color,
      icon: type === 'cash' ? 'Wallet' : 'Landmark',
    };

    onSave(accountToSave);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">
          {initialAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản / Ví tiền'}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Nhập số dư chính xác (hỗ trợ cả dấu chấm . và phẩy ,)
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Loại tài khoản
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('bank')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  type === 'bank'
                    ? 'border-pink-500 bg-pink-50 text-pink-600 dark:bg-purple-900/40'
                    : 'border-gray-200 text-gray-600 dark:border-slate-700'
                }`}
              >
                Tài khoản ngân hàng
              </button>
              <button
                type="button"
                onClick={() => setType('cash')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  type === 'cash'
                    ? 'border-pink-500 bg-pink-50 text-pink-600 dark:bg-purple-900/40'
                    : 'border-gray-200 text-gray-600 dark:border-slate-700'
                }`}
              >
                Tiền mặt / Ví giấy
              </button>
            </div>
          </div>

          {type === 'bank' && (
            <div>
              <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Ngân hàng phát hành
              </label>
              <select
                value={bankName}
                onChange={(e) => {
                  const bName = e.target.value;
                  setBankName(bName);
                  const matched = VIETNAMESE_BANKS.find((b) => b.name === bName);
                  if (matched) setColor(matched.color);
                }}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-gray-800 dark:text-white"
              >
                {VIETNAMESE_BANKS.map((b) => (
                  <option key={b.code} value={b.name}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Tên gợi nhớ
            </label>
            <input
              type="text"
              placeholder="VD: Techcombank Tiêu Dùng, Vietcombank Lương..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-gray-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Số dư hiện có (₫) (Hỗ trợ dấu , và .)
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={balanceInput}
              onChange={handleBalanceChange}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-gray-800 dark:text-white"
              required
            />
            {balanceInput && (
              <span className="text-[10px] text-pink-600 font-semibold mt-0.5 block">
                = {formatVND(parseDecimal(balanceInput))}
              </span>
            )}
          </div>

          {type === 'bank' && (
            <div>
              <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                4 số cuối tài khoản (tuỳ chọn)
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="VD: 6789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-gray-800 dark:text-white"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-800"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="rounded-xl bg-pink-500 hover:bg-pink-600 px-5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              {initialAccount ? 'Lưu thay đổi' : 'Thêm tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
