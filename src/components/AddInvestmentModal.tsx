import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Sparkles,
  Coins,
  PiggyBank,
  Check,
  Percent,
  Plus,
  Landmark,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InvestmentHolding, InvestmentType, Account } from '../types';
import { POPULAR_STOCKS, POPULAR_FUNDS, POPULAR_GOLD, VIETNAMESE_BANKS } from '../constants';
import { formatVND, parseDecimal, parseFraction } from '../utils';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInvestment: (inv: InvestmentHolding) => void;
  onSaveSavingsAccount?: (acc: Account) => void;
  editingInv?: InvestmentHolding | null;
}

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  isOpen,
  onClose,
  onSaveInvestment,
  onSaveSavingsAccount,
  editingInv,
}) => {
  if (!isOpen) return null;

  const [invCategory, setInvCategory] = useState<'stock' | 'fund' | 'gold' | 'savings'>(
    editingInv?.type === 'fund'
      ? 'fund'
      : editingInv?.type === 'gold'
      ? 'gold'
      : 'stock'
  );

  // Stock / Fund / Gold Form States
  const [symbol, setSymbol] = useState(editingInv?.symbol || 'FPT');
  const [name, setName] = useState(editingInv?.name || 'Tập đoàn FPT');
  const [sharesStr, setSharesStr] = useState(
    editingInv?.shares !== undefined ? editingInv.shares.toString().replace('.', ',') : '100'
  );
  const [buyPriceStr, setBuyPriceStr] = useState(
    editingInv?.buyPrice ? editingInv.buyPrice.toLocaleString('vi-VN') : '110.000'
  );
  const [currentPriceStr, setCurrentPriceStr] = useState(
    editingInv?.currentPrice ? editingInv.currentPrice.toLocaleString('vi-VN') : '138.000'
  );
  const [dividendsStr, setDividendsStr] = useState(
    editingInv?.dividendsReceived ? editingInv.dividendsReceived.toLocaleString('vi-VN') : '0'
  );
  const [note, setNote] = useState(editingInv?.note || '');

  // Bank Savings Specific Form States
  const [savingsBank, setSavingsBank] = useState('BIDV');
  const [savingsAmountStr, setSavingsAmountStr] = useState('50.000.000');
  const [savingsRateStr, setSavingsRateStr] = useState('5,5');
  const [savingsMonths, setSavingsMonths] = useState<number>(6);

  // Quick preset click handler
  const handleSelectStock = (stk: (typeof POPULAR_STOCKS)[0]) => {
    setSymbol(stk.symbol);
    setName(stk.name);
    setCurrentPriceStr(stk.price.toLocaleString('vi-VN'));
    setBuyPriceStr(stk.price.toLocaleString('vi-VN'));
  };

  const handleSelectFund = (f: (typeof POPULAR_FUNDS)[0]) => {
    setSymbol(f.symbol);
    setName(f.name);
    setCurrentPriceStr(f.price.toLocaleString('vi-VN'));
    setBuyPriceStr(f.price.toLocaleString('vi-VN'));
  };

  const handleSelectGold = (g: (typeof POPULAR_GOLD)[0]) => {
    setSymbol(g.symbol);
    setName(g.name);
    setCurrentPriceStr(g.price.toLocaleString('vi-VN'));
    setBuyPriceStr(g.price.toLocaleString('vi-VN'));
    setSharesStr('2,5'); // Ví dụ 2,5 chỉ vàng
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (invCategory === 'savings') {
      if (onSaveSavingsAccount) {
        const amount = parseDecimal(savingsAmountStr);
        const rate = parseFraction(savingsRateStr);
        const bankObj = VIETNAMESE_BANKS.find((b) => b.name === savingsBank);
        const newSavings: Account = {
          id: `sav_${Date.now()}`,
          name: `Sổ Tiết Kiệm ${savingsBank} (${savingsMonths}T)`,
          type: 'savings',
          bankName: savingsBank,
          balance: amount,
          savingsInterestRate: rate,
          savingsTermMonths: savingsMonths,
          savingsStartDate: new Date().toISOString().slice(0, 10),
          color: bankObj?.color || '#006B68',
          icon: 'PiggyBank',
        };
        onSaveSavingsAccount(newSavings);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
        onClose();
        return;
      }
    }

    const shares = parseFraction(sharesStr);
    const buyPrice = parseDecimal(buyPriceStr);
    const currentPrice = parseDecimal(currentPriceStr) || buyPrice;
    const dividends = parseDecimal(dividendsStr);

    let unit = 'CP';
    if (invCategory === 'fund') unit = 'CCQ';
    if (invCategory === 'gold') unit = symbol.includes('SJC') ? 'lượng' : 'chỉ';

    const holding: InvestmentHolding = {
      id: editingInv?.id || `inv_${Date.now()}`,
      symbol: symbol.toUpperCase(),
      name,
      type: invCategory === 'savings' ? 'bond' : (invCategory as InvestmentType),
      shares,
      buyPrice,
      currentPrice,
      dividendsReceived: dividends,
      unit,
      note,
    };

    onSaveInvestment(holding);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-[#231c35] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100/80 pb-3 dark:border-purple-900/40">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-xs">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100">
                {editingInv ? 'Sửa Tài Sản Đầu Tư' : 'Thêm Tài Sản Cố Định & Đầu Tư'}
              </h3>
              <p className="text-[11px] text-gray-400">
                Chứng khoán, Chứng chỉ quỹ, Vàng bạc hoặc Tiết kiệm
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 overflow-y-auto no-scrollbar flex-1 pr-0.5"
        >
          {/* Subcategory Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
              Loại tài sản đầu tư
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-pink-50/80 dark:bg-purple-950/60">
              <button
                type="button"
                onClick={() => setInvCategory('stock')}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  invCategory === 'stock'
                    ? 'bg-white text-pink-600 shadow-xs dark:bg-purple-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-purple-300'
                }`}
              >
                Cổ phiếu
              </button>
              <button
                type="button"
                onClick={() => setInvCategory('fund')}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  invCategory === 'fund'
                    ? 'bg-white text-pink-600 shadow-xs dark:bg-purple-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-purple-300'
                }`}
              >
                Quỹ mở
              </button>
              <button
                type="button"
                onClick={() => setInvCategory('gold')}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  invCategory === 'gold'
                    ? 'bg-white text-pink-600 shadow-xs dark:bg-purple-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-purple-300'
                }`}
              >
                Vàng bạc
              </button>
              <button
                type="button"
                onClick={() => setInvCategory('savings')}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  invCategory === 'savings'
                    ? 'bg-white text-pink-600 shadow-xs dark:bg-purple-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-purple-300'
                }`}
              >
                Tiết kiệm
              </button>
            </div>
          </div>

          {/* Quick Preset Chips */}
          {invCategory === 'stock' && (
            <div>
              <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                Mã phổ biến:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {POPULAR_STOCKS.map((stk) => (
                  <button
                    key={stk.symbol}
                    type="button"
                    onClick={() => handleSelectStock(stk)}
                    className="shrink-0 rounded-xl border border-pink-100 bg-white px-2.5 py-1 text-xs font-bold text-gray-700 hover:border-pink-300 hover:text-pink-600 dark:bg-[#1a1428] dark:border-purple-900/40 dark:text-purple-200"
                  >
                    {stk.symbol} ({formatVND(stk.price)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {invCategory === 'fund' && (
            <div>
              <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                Chứng chỉ quỹ gợi ý:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {POPULAR_FUNDS.map((f) => (
                  <button
                    key={f.symbol}
                    type="button"
                    onClick={() => handleSelectFund(f)}
                    className="shrink-0 rounded-xl border border-pink-100 bg-white px-2.5 py-1 text-xs font-bold text-gray-700 hover:border-pink-300 hover:text-pink-600 dark:bg-[#1a1428] dark:border-purple-900/40 dark:text-purple-200"
                  >
                    {f.symbol} ({formatVND(f.price)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {invCategory === 'gold' && (
            <div>
              <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                Loại vàng giao dịch:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {POPULAR_GOLD.map((g) => (
                  <button
                    key={g.symbol}
                    type="button"
                    onClick={() => handleSelectGold(g)}
                    className="shrink-0 rounded-xl border border-amber-200 bg-amber-50/60 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BANK SAVINGS FORM */}
          {invCategory === 'savings' ? (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                  Ngân hàng gửi tiết kiệm
                </label>
                <select
                  value={savingsBank}
                  onChange={(e) => setSavingsBank(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                >
                  {VIETNAMESE_BANKS.filter((b) => b.code !== 'CASH').map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                  Số tiền gửi tiết kiệm (VND)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={savingsAmountStr}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (/^[0-9.,]*$/.test(raw)) setSavingsAmountStr(raw);
                  }}
                  className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-sm font-bold tabular-nums text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  required
                />
                {savingsAmountStr && (
                  <span className="text-[10px] text-pink-600 font-semibold mt-0.5 block">
                    = {formatVND(parseDecimal(savingsAmountStr))}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                    Lãi suất (% / năm) (Hỗ trợ dấu ,)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="VD: 5,5 hoặc 6.2"
                    value={savingsRateStr}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (/^[0-9.,]*$/.test(raw)) setSavingsRateStr(raw);
                    }}
                    className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm font-bold text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                    Kỳ hạn (tháng)
                  </label>
                  <select
                    value={savingsMonths}
                    onChange={(e) => setSavingsMonths(parseInt(e.target.value, 10))}
                    className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  >
                    {[1, 3, 6, 9, 12, 18, 24].map((m) => (
                      <option key={m} value={m}>
                        {m} tháng
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Estimated Interest Calculation Box */}
              {(() => {
                const principal = parseDecimal(savingsAmountStr);
                const rate = parseFraction(savingsRateStr);
                const interest = Math.round((principal * (rate / 100) * savingsMonths) / 12);
                return (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200">
                    <div className="flex justify-between items-baseline">
                      <span>Tiền lãi dự kiến khi đáo hạn:</span>
                      <span className="font-heading font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                        +{formatVND(interest)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500 dark:text-emerald-300 mt-1">
                      <span>Tổng nhận lại:</span>
                      <span className="font-bold">{formatVND(principal + interest)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* STOCK / FUND / GOLD FORM */
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                    Mã tài sản (Symbol)
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="FPT, HPG, VESAF, VÀNG 9999..."
                    required
                    className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 font-heading text-sm font-extrabold uppercase text-pink-600 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-pink-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                    Số lượng nắm giữ (Cho phép dấu ,)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={sharesStr}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (/^[0-9.,]*$/.test(raw)) setSharesStr(raw);
                    }}
                    placeholder="VD: 100 hoặc 12,5"
                    required
                    className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 font-heading text-sm font-bold tabular-nums text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  />
                  {sharesStr && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      = {parseFraction(sharesStr)}{' '}
                      {invCategory === 'fund' ? 'CCQ' : invCategory === 'gold' ? 'chỉ' : 'CP'}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                  Tên tài sản / Doanh nghiệp
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên công ty hoặc quỹ hoặc loại vàng..."
                  className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                    Giá vốn mua vào (VND)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={buyPriceStr}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (/^[0-9.,]*$/.test(raw)) setBuyPriceStr(raw);
                    }}
                    placeholder="VD: 110.000 hoặc 110000"
                    required
                    className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm font-bold tabular-nums text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  />
                  {buyPriceStr && (
                    <span className="text-[10px] text-pink-600 font-semibold mt-0.5 block">
                      = {formatVND(parseDecimal(buyPriceStr))}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                    Giá thị trường hiện tại (VND)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={currentPriceStr}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (/^[0-9.,]*$/.test(raw)) setCurrentPriceStr(raw);
                    }}
                    placeholder="VD: 138.000"
                    className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm font-bold tabular-nums text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  />
                  {currentPriceStr && (
                    <span className="text-[10px] text-pink-600 font-semibold mt-0.5 block">
                      = {formatVND(parseDecimal(currentPriceStr))}
                    </span>
                  )}
                </div>
              </div>

              {/* Total Investment Live Preview */}
              {(() => {
                const numShares = parseFraction(sharesStr);
                const price = parseDecimal(currentPriceStr) || parseDecimal(buyPriceStr);
                const cost = parseDecimal(buyPriceStr);
                const totalVal = Math.round(numShares * price);
                const totalCost = Math.round(numShares * cost);
                const profit = totalVal - totalCost;
                const profitPercent = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : '0';

                return (
                  <div className="rounded-2xl bg-pink-50/50 p-3 border border-pink-100 dark:bg-purple-950/30 dark:border-purple-900/40 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-purple-300">Tổng giá trị thị trường:</span>
                      <span className="font-heading font-extrabold text-sm text-pink-600 dark:text-pink-400">
                        {formatVND(totalVal)}
                      </span>
                    </div>
                    {totalCost > 0 && (
                      <div className="flex justify-between items-center mt-1 text-[11px]">
                        <span className="text-gray-500">Lãi / Lỗ dự kiến:</span>
                        <span
                          className={`font-bold tabular-nums ${
                            profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {profit >= 0 ? `+${formatVND(profit)}` : `-${formatVND(Math.abs(profit))}`}{' '}
                          ({profit >= 0 ? `+${profitPercent}%` : `${profitPercent}%`})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-purple-900/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 px-5 py-2 text-xs font-bold text-white shadow-md shadow-pink-500/25 active:scale-95 transition-all cursor-pointer"
            >
              {editingInv ? 'Lưu thay đổi' : 'Thêm tài sản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
