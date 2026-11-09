import React, { useState } from 'react';
import { X, CreditCard, Sparkles, Check, Calendar, ShieldCheck, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Account } from '../types';
import { VIETNAMESE_BANKS } from '../constants';
import { formatVND, parseVND, parseDecimal } from '../utils';

interface AddCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardAccount: Account) => void;
  editingCard?: Account | null;
}

const CARD_GRADIENTS = [
  { id: 'grad_hsbc_red', name: 'HSBC Đỏ Quyền Lực', css: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #450A0A 100%)' },
  { id: 'grad_pink_purple', name: 'Hồng Tím Mộng Mơ', css: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' },
  { id: 'grad_rose_gold', name: 'Rose Gold Sang Trọng', css: 'linear-gradient(135deg, #F43F5E 0%, #FB7185 50%, #FBBF24 100%)' },
  { id: 'grad_emerald', name: 'Ngọc Lục Bảo VPBank', css: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #06B6D4 100%)' },
  { id: 'grad_purple_night', name: 'Tím Đêm Hoàng Gia', css: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)' },
  { id: 'grad_black_gold', name: 'Black Elite Pastel', css: 'linear-gradient(135deg, #1E1B2E 0%, #3B2E58 100%)' },
];

export const AddCreditCardModal: React.FC<AddCreditCardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCard,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(editingCard?.name || 'Thẻ VPBank StepUp');
  const [bankName, setBankName] = useState(editingCard?.bankName || 'VPBank');
  const [creditLimitStr, setCreditLimitStr] = useState(
    editingCard?.creditLimit ? editingCard.creditLimit.toLocaleString('vi-VN') : '30.000.000'
  );
  const [creditBalanceStr, setCreditBalanceStr] = useState(
    editingCard?.creditBalance ? editingCard.creditBalance.toLocaleString('vi-VN') : '4.250.000'
  );
  const [creditStatementDay, setCreditStatementDay] = useState<number>(
    editingCard?.creditStatementDay || 20
  );
  const [creditDueDay, setCreditDueDay] = useState<number>(editingCard?.creditDueDay || 5);
  const [creditCardCashback, setCreditCardCashback] = useState<number>(
    editingCard?.creditCardCashback || 6
  );
  const [cardNetwork, setCardNetwork] = useState<'visa' | 'mastercard' | 'jcb' | 'napas'>(
    editingCard?.cardNetwork || 'visa'
  );
  const [cardGradient, setCardGradient] = useState<string>(
    editingCard?.cardGradient || CARD_GRADIENTS[0].css
  );
  const [last4Digits, setLast4Digits] = useState<string>(
    editingCard?.accountNumber?.slice(-4) || '7890'
  );

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/^[0-9.,]*$/.test(raw)) {
      setCreditLimitStr(raw);
    }
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/^[0-9.,]*$/.test(raw)) {
      setCreditBalanceStr(raw);
    }
  };

  const handleApplyHsbcPreset = () => {
    setName('Thẻ HSBC Visa Platinum');
    setBankName('HSBC');
    setCreditLimitStr('50.000.000');
    setCreditBalanceStr('0');
    setCreditStatementDay(25);
    setCreditDueDay(15);
    setCreditCardCashback(8);
    setCardNetwork('visa');
    setCardGradient('linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #450A0A 100%)');
    setLast4Digits('5678');
  };

  const handleApplyVpBankPreset = () => {
    setName('Thẻ VPBank StepUp');
    setBankName('VPBank');
    setCreditLimitStr('30.000.000');
    setCreditBalanceStr('0');
    setCreditStatementDay(20);
    setCreditDueDay(5);
    setCreditCardCashback(6);
    setCardNetwork('visa');
    setCardGradient('linear-gradient(135deg, #059669 0%, #10B981 50%, #06B6D4 100%)');
    setLast4Digits('7890');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseDecimal(creditLimitStr);
    const balance = parseDecimal(creditBalanceStr);

    const bankObj = VIETNAMESE_BANKS.find((b) => b.name === bankName);

    const card: Account = {
      id: editingCard?.id || `credit_${Date.now()}`,
      name,
      type: 'credit',
      bankName,
      balance: 0,
      creditLimit: limit,
      creditBalance: balance,
      creditStatementDay,
      creditDueDay,
      creditCardCashback,
      cardNetwork,
      cardGradient,
      color: bankObj?.color || '#DB0011',
      icon: 'CreditCard',
      accountNumber: `**** **** **** ${last4Digits || '0000'}`,
    };

    onSave(card);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-[#231c35] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100/80 pb-3 dark:border-purple-900/40">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-xs">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100">
                {editingCard ? 'Chỉnh Sửa Thẻ Tín Dụng' : 'Thêm Thẻ Tín Dụng Mới'}
              </h3>
              <p className="text-[11px] text-gray-400">
                Theo dõi hạn mức, ngày sao kê và tự động tính hoàn tiền
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

        {/* Quick Presets for Popular Cards */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] text-gray-400 font-semibold shrink-0">Chọn mẫu nhanh:</span>
          <button
            type="button"
            onClick={handleApplyHsbcPreset}
            className="shrink-0 rounded-full border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 text-[11px] font-bold active:scale-95 transition-all flex items-center gap-1"
          >
            <span>⭐ Thẻ HSBC Platinum (Hoàn 8%, Hạn 50tr)</span>
          </button>
          <button
            type="button"
            onClick={handleApplyVpBankPreset}
            className="shrink-0 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1 text-[11px] font-bold active:scale-95 transition-all flex items-center gap-1"
          >
            <span>⚡ VPBank StepUp (Hoàn 6%, Hạn 30tr)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-4 max-h-[72vh] overflow-y-auto no-scrollbar pr-0.5">
          {/* Card Realistic Pastel Preview */}
          <div
            className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lg transition-all"
            style={{ background: cardGradient }}
          >
            {/* Glossy overlay */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-xl"></div>

            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-bold tracking-wider uppercase">
                {bankName}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                {cardNetwork}
              </span>
            </div>

            {/* Chip EMV */}
            <div className="my-4 flex items-center gap-2">
              <div className="flex h-7 w-9 items-center justify-center rounded-md bg-gradient-to-tr from-amber-200 to-yellow-400 shadow-inner ring-1 ring-yellow-500/40">
                <div className="h-4 w-6 rounded-xs border border-amber-600/50"></div>
              </div>
              <span className="text-[10px] text-white/80 font-mono">Contactless )))</span>
            </div>

            {/* Card Number */}
            <div className="font-mono text-base tracking-widest text-white/90">
              •••• •••• •••• {last4Digits || '7890'}
            </div>

            {/* Card Footer: Name, Limit, Due */}
            <div className="mt-3 flex items-end justify-between border-t border-white/20 pt-2 text-[10px]">
              <div>
                <p className="text-white/70 uppercase">Tên thẻ</p>
                <p className="font-semibold text-xs text-white truncate max-w-[150px]">{name}</p>
              </div>
              <div className="text-center">
                <p className="text-white/70">Sao kê / Hạn trả</p>
                <p className="font-bold text-white">
                  Ngày {creditStatementDay} / {creditDueDay}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/70">Hoàn tiền</p>
                <p className="font-bold text-amber-200">{creditCardCashback}%</p>
              </div>
            </div>
          </div>

          {/* 1. Chọn Ngân hàng phát hành & Tên thẻ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                Ngân hàng phát hành
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              >
                {VIETNAMESE_BANKS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                Tên dòng thẻ
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: VPBank StepUp, VIB CashBack..."
                required
                className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              />
            </div>
          </div>

          {/* 2. Hạn mức & Dư nợ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                Hạn mức tín dụng (VND)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={creditLimitStr}
                onChange={handleLimitChange}
                placeholder="30.000.000"
                required
                className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm font-bold tabular-nums text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                Dư nợ đã tiêu (VND)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={creditBalanceStr}
                onChange={handleBalanceChange}
                placeholder="0"
                className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm font-bold tabular-nums text-rose-600 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-rose-400"
              />
            </div>
          </div>

          {/* 3. Ngày chốt sao kê & Ngày đến hạn */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                Ngày chốt sao kê
              </label>
              <select
                value={creditStatementDay}
                onChange={(e) => setCreditStatementDay(parseInt(e.target.value, 10))}
                className="w-full rounded-2xl border border-pink-100 bg-white p-2 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Ngày {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                Ngày đến hạn trả
              </label>
              <select
                value={creditDueDay}
                onChange={(e) => setCreditDueDay(parseInt(e.target.value, 10))}
                className="w-full rounded-2xl border border-pink-100 bg-white p-2 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Ngày {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                Hoàn tiền (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={creditCardCashback}
                onChange={(e) => setCreditCardCashback(parseFloat(e.target.value) || 0)}
                className="w-full rounded-2xl border border-pink-100 bg-white p-2 text-xs font-bold text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              />
            </div>
          </div>

          {/* 4. Chọn Màu Gradient Thẻ Pastel */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1.5">
              Màu thẻ pastel
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CARD_GRADIENTS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setCardGradient(g.css)}
                  className={`h-8 w-12 shrink-0 rounded-xl transition-all ${
                    cardGradient === g.css ? 'ring-2 ring-pink-500 scale-110 shadow-xs' : 'opacity-80'
                  }`}
                  style={{ background: g.css }}
                  title={g.name}
                ></button>
              ))}
            </div>
          </div>

          {/* 5. 4 số cuối thẻ & Loại mạng thẻ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                Mạng thanh toán
              </label>
              <select
                value={cardNetwork}
                onChange={(e) => setCardNetwork(e.target.value as any)}
                className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="jcb">JCB</option>
                <option value="napas">Napas</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
                4 số cuối thẻ
              </label>
              <input
                type="text"
                maxLength={4}
                value={last4Digits}
                onChange={(e) => setLast4Digits(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="7890"
                className="w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs font-mono font-bold text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-2 pt-3 border-t border-pink-50 dark:border-purple-900/40">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-purple-900/40 dark:text-purple-300"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-xs font-semibold text-white shadow-md shadow-pink-200 hover:scale-102 active:scale-95 transition-all"
            >
              Lưu thẻ tín dụng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
