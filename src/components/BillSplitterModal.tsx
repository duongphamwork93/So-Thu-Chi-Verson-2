import React, { useState } from 'react';
import { 
  X, 
  Users, 
  QrCode, 
  Copy, 
  Check, 
  Sparkles, 
  Share2, 
  CreditCard, 
  ArrowRight, 
  Utensils, 
  Receipt,
  Download,
  Info
} from 'lucide-react';
import { VIETNAMESE_BANKS } from '../constants';
import { Account, Transaction } from '../types';
import { formatMoney, parseVND } from '../utils';

interface BillSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  recentTransactions: Transaction[];
}

export const BillSplitterModal: React.FC<BillSplitterModalProps> = ({
  isOpen,
  onClose,
  accounts,
  recentTransactions,
}) => {
  const bankAccounts = accounts.filter(a => a.type === 'bank' || a.type === 'cash');

  const [billTitle, setBillTitle] = useState('Ăn uống liên hoan');
  const [totalAmount, setTotalAmount] = useState<number>(360000);
  const [peopleCount, setPeopleCount] = useState<number>(3);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    bankAccounts[0]?.id || ''
  );
  const [customBankCode, setCustomBankCode] = useState('MB');
  const [customAccountNum, setCustomAccountNum] = useState(bankAccounts[0]?.accountNumber || '0987654321');
  const [customHolderName, setCustomHolderName] = useState('NGUYEN VAN A');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeAccount = bankAccounts.find(a => a.id === selectedAccountId);

  // Determine bank code for VietQR
  const getBankCode = (bankName: string) => {
    const matched = VIETNAMESE_BANKS.find(b => 
      bankName.toLowerCase().includes(b.code.toLowerCase()) || 
      bankName.toLowerCase().includes(b.name.toLowerCase())
    );
    return matched ? matched.code : 'MB';
  };

  const effectiveBankCode = activeAccount 
    ? getBankCode(activeAccount.bankName)
    : customBankCode;
  const effectiveAccountNum = activeAccount?.accountNumber || customAccountNum || '0987654321';
  const effectiveHolderName = activeAccount?.name || customHolderName || 'CHU TAI KHOAN';

  const amountPerPerson = Math.ceil(totalAmount / Math.max(1, peopleCount));
  const transferContent = `Tien ${billTitle.slice(0, 15)}`;

  // Construct VietQR URL
  const qrUrl = `https://img.vietqr.io/image/${effectiveBankCode}-${effectiveAccountNum}-compact2.png?amount=${amountPerPerson}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(effectiveHolderName)}`;

  // Text message to copy for Zalo / Messenger
  const shareMessage = `🍴 Chia tiền "${billTitle}":
- Tổng bill: ${formatMoney(totalAmount)}
- Số người: ${peopleCount} người
👉 Mỗi người: ${formatMoney(amountPerPerson)}

Chuyển khoản theo thông tin:
🏦 Ngân hàng: ${effectiveBankCode}
💳 Số tài khoản: ${effectiveAccountNum}
👤 Chủ TK: ${effectiveHolderName}
📝 Nội dung CK: ${transferContent}

Hoặc quét mã VietQR để tự động điền số tiền và nội dung nhé!`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handlePickTransaction = (t: Transaction) => {
    setBillTitle(t.note || t.cat || 'Hoá đơn chi tiêu');
    setTotalAmount(t.amount);
    if (t.accountId) {
      setSelectedAccountId(t.accountId);
    }
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
        <div className="px-6 py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                Chia Tiền Nhóm & Tạo Mã VietQR
                <Sparkles className="w-4 h-4 text-emerald-200 fill-emerald-200" />
              </h3>
              <p className="text-xs text-white/80">Tính tiền mỗi người & tạo mã QR ngân hàng bắn sang Zalo</p>
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
          {/* Recent Expenses Quick Selector */}
          {recentTransactions.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-teal-500" />
                Chọn nhanh từ chi tiêu gần đây:
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {recentTransactions
                  .filter(t => t.type === 'out')
                  .slice(0, 5)
                  .map(t => (
                    <button
                      key={t.id}
                      onClick={() => handlePickTransaction(t)}
                      className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-400 whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200">{t.note || t.cat}</span>
                      <span className="font-bold text-rose-500 tabular-nums">-{formatMoney(t.amount)}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Bill Details Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tên bữa ăn / Hoá đơn
              </label>
              <input 
                type="text"
                value={billTitle}
                onChange={e => setBillTitle(e.target.value)}
                placeholder="VD: Lẩu Haidilao, Grab Food, Tiền điện nước..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tổng tiền hoá đơn
              </label>
              <div className="relative">
                <input 
                  type="text"
                  value={totalAmount > 0 ? totalAmount.toLocaleString('vi-VN') : ''}
                  onChange={e => setTotalAmount(parseVND(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">₫</span>
              </div>
            </div>
          </div>

          {/* People Count Selector */}
          <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Số người chia tiền:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPeopleCount(Math.max(2, peopleCount - 1))}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-teal-100 active:scale-95"
                >
                  -
                </button>
                <span className="text-base font-black text-teal-700 dark:text-teal-300 tabular-nums px-2">
                  {peopleCount} người
                </span>
                <button
                  onClick={() => setPeopleCount(peopleCount + 1)}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-teal-100 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              {[2, 3, 4, 5, 6, 8, 10].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setPeopleCount(cnt)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    peopleCount === cnt
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-100/50'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>

            {/* Result callout */}
            <div className="pt-2 border-t border-teal-200/60 dark:border-teal-800/40 flex items-baseline justify-between">
              <span className="text-xs text-teal-700 dark:text-teal-300">
                Mỗi người chuyển khoản:
              </span>
              <span className="text-xl font-black text-teal-700 dark:text-teal-200 tabular-nums">
                {formatMoney(amountPerPerson)}
              </span>
            </div>
          </div>

          {/* Bank Account to Receive */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-teal-500" />
              Tài khoản nhận tiền chuyển:
            </label>

            {bankAccounts.length > 0 ? (
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {bankAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.bankName} - {a.name} ({a.accountNumber || 'Không có STK'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="text" 
                  placeholder="Ngân hàng (MB, VCB...)"
                  value={customBankCode}
                  onChange={e => setCustomBankCode(e.target.value.toUpperCase())}
                  className="px-3 py-1.5 rounded-xl border text-xs"
                />
                <input 
                  type="text" 
                  placeholder="Số tài khoản"
                  value={customAccountNum}
                  onChange={e => setCustomAccountNum(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border text-xs"
                />
                <input 
                  type="text" 
                  placeholder="Tên chủ thẻ"
                  value={customHolderName}
                  onChange={e => setCustomHolderName(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border text-xs"
                />
              </div>
            )}
          </div>

          {/* VietQR Card & Copy Message */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-5">
            {/* QR Image preview */}
            <div className="w-44 h-44 shrink-0 bg-white p-2 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center relative group">
              <img 
                src={qrUrl} 
                alt="VietQR Code" 
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>

            {/* Info & action buttons */}
            <div className="space-y-3 flex-1 text-center md:text-left">
              <div>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider block">
                  VietQR Chuẩn NAPAS 247
                </span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {effectiveHolderName}
                </h4>
                <p className="text-xs text-slate-500 tabular-nums">
                  {effectiveBankCode} • {effectiveAccountNum}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Nội dung tự động: <span className="font-semibold text-slate-600 dark:text-slate-300">{transferContent}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={handleCopyMessage}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:opacity-95'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Đã chép lời nhắn Zalo!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Sao chép lời nhắn gửi Zalo
                    </>
                  )}
                </button>

                <a 
                  href={qrUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Mở ảnh QR
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-teal-500" />
            Tự động điền số tiền khi bạn bè quét mã bằng app ngân hàng
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
