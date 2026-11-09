import React, { useState } from 'react';
import { X, Trash2, Check, AlertTriangle, Calendar, Tag, Wallet } from 'lucide-react';
import { Account, Transaction, TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_MAP } from '../constants';
import { formatVND, parseVND } from '../utils';
import { CategoryIcon } from './CategoryIcon';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  accounts: Account[];
  onClose: () => void;
  onUpdate: (updated: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  accounts,
  onClose,
  onUpdate,
  onDelete,
}) => {
  if (!transaction) return null;

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amountStr, setAmountStr] = useState<string>(
    transaction.amount.toLocaleString('vi-VN')
  );
  const [cat, setCat] = useState<string>(transaction.cat);
  const [date, setDate] = useState<string>(transaction.date);
  const [note, setNote] = useState<string>(transaction.note || '');
  const [accountId, setAccountId] = useState<string>(transaction.accountId || accounts[0]?.id || '');

  // 2-step delete confirmation state (no browser alert/confirm)
  const [confirmDeleteStage, setConfirmDeleteStage] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    if (!val) {
      setAmountStr('');
      return;
    }
    const num = parseInt(val, 10);
    setAmountStr(num.toLocaleString('vi-VN'));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseVND(amountStr);
    if (amount <= 0) return;

    onUpdate({
      ...transaction,
      type,
      amount,
      cat,
      date,
      note,
      accountId,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDeleteStage) {
      setConfirmDeleteStage(true);
      return;
    }
    onDelete(transaction.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-[#231c35]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100/80 pb-3 dark:border-purple-900/40">
          <div className="flex items-center gap-2">
            <CategoryIcon catKey={cat} size={18} />
            <h3 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100">
              Chi tiết giao dịch
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-pink-50 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-3.5">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-pink-100/60 p-1 dark:bg-purple-950/60">
            <button
              type="button"
              onClick={() => setType('out')}
              className={`rounded-xl py-2 text-xs font-bold transition-all ${
                type === 'out'
                  ? 'bg-white text-rose-600 shadow-xs dark:bg-[#231c35] dark:text-rose-400'
                  : 'text-gray-500'
              }`}
            >
              Khoản chi (-)
            </button>
            <button
              type="button"
              onClick={() => setType('in')}
              className={`rounded-xl py-2 text-xs font-bold transition-all ${
                type === 'in'
                  ? 'bg-white text-emerald-600 shadow-xs dark:bg-[#231c35] dark:text-emerald-400'
                  : 'text-gray-500'
              }`}
            >
              Khoản thu (+)
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
              Số tiền (VND)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={handleAmountChange}
              required
              className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-3 font-heading text-xl font-bold tabular-nums text-gray-900 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
              Danh mục
            </label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
            >
              {(type === 'out' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
              Tài khoản
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                Ngày
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-2 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                Ghi chú
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-2 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              />
            </div>
          </div>

          {/* Items if present */}
          {transaction.items && transaction.items.length > 0 && (
            <div className="rounded-2xl bg-pink-50/50 p-2.5 text-[11px] text-gray-600 dark:bg-purple-950/30 dark:text-purple-300">
              <p className="font-semibold mb-1">Mặt hàng chi tiết đã đọc:</p>
              <div className="space-y-0.5 max-h-24 overflow-y-auto no-scrollbar">
                {transaction.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.name}</span>
                    <span className="font-semibold tabular-nums">{formatVND(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions: 2-step delete & Save button */}
          <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-pink-50">
            {/* 2-Step Confirm Delete */}
            <button
              type="button"
              onClick={handleDelete}
              className={`flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold transition-all ${
                confirmDeleteStage
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'border border-rose-200 text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Trash2 size={14} />
              <span>{confirmDeleteStage ? 'Bấm lần nữa để xoá' : 'Xoá'}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2 text-xs font-semibold text-white shadow-xs"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
