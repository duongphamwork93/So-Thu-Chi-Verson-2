import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Send,
  X,
  Sparkles,
  ArrowRightLeft,
  CreditCard,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Receipt,
  FileText,
  Wallet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Account, Transaction, TransactionType, UserProfile } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_MAP } from '../constants';
import { compressImage, formatVND, parseVND, parseDecimal, matchDefaultAccountForTransaction } from '../utils';
import {
  parseReceiptWithAI,
  parseStatementWithAI,
  parseQuickInputWithAI,
  StatementItem,
} from '../services/aiApi';
import { CategoryIcon } from './CategoryIcon';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  profile?: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onAddTransaction: (tx: Transaction) => void;
  onAddMultipleTransactions?: (txs: Transaction[]) => void;
  initialMode?: 'single' | 'batch' | 'transfer';
  demoType?: 'receipt' | 'statement' | 'shopee' | 'grab' | 'techcombank' | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  profile,
  onUpdateProfile,
  onAddTransaction,
  onAddMultipleTransactions,
  initialMode = 'single',
  demoType = null,
}) => {
  const [mode, setMode] = useState<'single' | 'batch' | 'transfer'>(initialMode);

  // Single form states
  const [type, setType] = useState<TransactionType>('out');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('an_uong');
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');
  const [toAccount, setToAccount] = useState<string>(accounts[1]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>('');
  const [source, setSource] = useState<'nhập tay' | 'gõ nhanh' | 'ảnh' | 'sao kê AI'>('nhập tay');
  const [items, setItems] = useState<Array<{ name: string; amount: number }>>([]);
  const [confidence, setConfidence] = useState<'cao' | 'trung bình' | 'thấp' | null>(null);
  const [showItemsList, setShowItemsList] = useState(false);

  // Quick input text state
  const [quickText, setQuickText] = useState('');
  const [isQuickLoading, setIsQuickLoading] = useState(false);

  // Image AI scanning state & Progress steps
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0); // 1: nén siêu tốc, 2: AI bóc tách, 3: lên danh mục & thẻ
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiScanStatus, setAiScanStatus] = useState<string | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [detectedMerchant, setDetectedMerchant] = useState<string | null>(null);
  const [autoSwitchedToBatch, setAutoSwitchedToBatch] = useState(false);
  const [rememberDefaultCard, setRememberDefaultCard] = useState(false);

  // Batch Statement scanning state
  const [batchTransactions, setBatchTransactions] = useState<StatementItem[]>([]);
  const [statementTitle, setStatementTitle] = useState('');
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [batchSelectedCount, setBatchSelectedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const batchCameraInputRef = useRef<HTMLInputElement>(null);

  // Sync mode and demo when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setAiErrorMessage(null);
      setAiScanStatus(null);
      setAutoSwitchedToBatch(false);
      setDetectedMerchant(null);
      setScanStep(0);

      const todayStr = new Date().toISOString().slice(0, 10);
      const shopeeCard = profile?.defaultMerchantAccounts?.['shopee'] || accounts[0]?.id;
      const grabCard = profile?.defaultMerchantAccounts?.['grab'] || accounts[0]?.id;
      const bankAcc = profile?.defaultMerchantAccounts?.['momo'] || accounts[0]?.id;

      if (demoType === 'receipt') {
        setType('out');
        setAmountStr('65.000');
        setSelectedCat('cafe');
        setDate(todayStr);
        setNote('Phúc Long Tea - Trà Ô Long Sữa');
        setItems([
          { name: 'Trà Ô Long Sữa (Size L)', amount: 55000 },
          { name: 'Topping Thạch Củ Năng', amount: 10000 },
        ]);
        setConfidence('cao');
        setSource('ảnh');
        setAiScanStatus('Đã đọc mẫu hoá đơn Phúc Long (65k)!');
      } else if (demoType === 'statement') {
        setMode('batch');
        setStatementTitle('Bảng Sao Kê Ngân Hàng Vietcombank');
        const demoStmt: StatementItem[] = [
          {
            id: 'stmt_d1',
            type: 'in',
            amount: 28000000,
            date: todayStr,
            cat: 'luong',
            merchant: 'Công ty Cổ phần Công nghệ',
            note: 'Chuyen luong thang nay',
            confidence: 'cao',
            selected: true,
            accountId: profile?.defaultMerchantAccounts?.['luong'] || accounts[0]?.id,
          },
          {
            id: 'stmt_d2',
            type: 'out',
            amount: 1150000,
            date: todayStr,
            cat: 'cho_sieu_thi',
            merchant: 'Co.opmart Cong Quynh',
            note: 'Thanh toan sieu thi thuc pham',
            confidence: 'cao',
            selected: true,
            accountId: profile?.defaultMerchantAccounts?.['sieu_thi'] || accounts[0]?.id,
          },
          {
            id: 'stmt_d3',
            type: 'out',
            amount: 45000,
            date: todayStr,
            cat: 'di_lai',
            merchant: 'Grab Vietnam',
            note: 'Cuoc GrabCar di lam',
            confidence: 'cao',
            selected: true,
            accountId: grabCard,
          },
          {
            id: 'stmt_d4',
            type: 'transfer',
            isCreditPayment: true,
            amount: 2000000,
            date: todayStr,
            cat: 'tiet_kiem',
            merchant: 'VPBank Credit Card',
            note: 'Thanh toan du no the tin dung VPBank StepUp',
            confidence: 'cao',
            selected: true,
            accountId: bankAcc,
          },
        ];
        setBatchTransactions(demoStmt);
        setBatchSelectedCount(demoStmt.length);
      } else if (demoType === 'shopee') {
        setMode('batch');
        setStatementTitle('Đơn đã mua Shopee (3 đơn chờ giao)');
        const shopeeStmt: StatementItem[] = [
          {
            id: 'shopee_1',
            type: 'out',
            amount: 36000,
            date: todayStr,
            cat: 'mua_sam',
            merchant: 'Shopee - ARIA DECOR',
            note: 'Rèm nhà bếp rèm dán 1 LỚP tủ bếp (ARIA DECOR)',
            confidence: 'cao',
            selected: true,
            accountId: shopeeCard,
          },
          {
            id: 'shopee_2',
            type: 'out',
            amount: 42000,
            date: todayStr,
            cat: 'nha_o',
            merchant: 'Shopee - Shop Bố Soup',
            note: 'Xốp bọc cạnh bàn an toàn cho bé (Shop Bố Soup)',
            confidence: 'cao',
            selected: true,
            accountId: shopeeCard,
          },
          {
            id: 'shopee_3',
            type: 'out',
            amount: 21000,
            date: todayStr,
            cat: 'mua_sam',
            merchant: 'Shopee - Shop Mẹ Nhép',
            note: 'Khóa tủ an toàn cho bé gấu hồng (Shop Mẹ Nhép)',
            confidence: 'cao',
            selected: true,
            accountId: shopeeCard,
          },
        ];
        setBatchTransactions(shopeeStmt);
        setBatchSelectedCount(shopeeStmt.length);
        setAiScanStatus('Đã nhận diện 3 đơn Shopee & tự động gán Thẻ tín dụng Shopee hoàn 6%!');
      } else if (demoType === 'grab') {
        setMode('batch');
        setStatementTitle('Hoạt động Grab gần đây (Đã lọc đơn huỷ)');
        const grabStmt: StatementItem[] = [
          {
            id: 'grab_1',
            type: 'out',
            amount: 136000,
            date: todayStr,
            cat: 'an_uong',
            merchant: 'Grab - Cơm Tấm Sườn Ba Son',
            note: 'Cơm Tấm Sườn Ba Son - Láng Hạ (2 món)',
            confidence: 'cao',
            selected: true,
            accountId: grabCard,
          },
          {
            id: 'grab_2',
            type: 'out',
            amount: 117000,
            date: todayStr,
            cat: 'an_uong',
            merchant: 'Grab - Bún Bò Huế Ngự Uyển',
            note: 'Bún Bò Huế Ngự Uyển - Hồ Đắc Di (2 món)',
            confidence: 'cao',
            selected: true,
            accountId: grabCard,
          },
          {
            id: 'grab_3',
            type: 'out',
            amount: 111864,
            date: todayStr,
            cat: 'an_uong',
            merchant: 'Grab - KHAOSAN Bún Thái',
            note: 'KHAOSAN - Bún Thái Hải Sản',
            confidence: 'cao',
            selected: true,
            accountId: grabCard,
          },
        ];
        setBatchTransactions(grabStmt);
        setBatchSelectedCount(grabStmt.length);
        setAiScanStatus('Đã đọc 3 đơn Grab thành công (loại trừ đơn lỗi) & gán thẻ mặc định!');
      } else if (demoType === 'techcombank') {
        setMode('batch');
        setStatementTitle('Biến động số dư Techcombank Sinh lời tự động');
        const tcbStmt: StatementItem[] = [
          {
            id: 'tcb_1',
            type: 'in',
            amount: 8415,
            date: todayStr,
            cat: 'loi_dau_tu',
            merchant: 'Techcombank',
            note: 'Lợi nhuận Sinh lời tự động Techcombank',
            confidence: 'cao',
            selected: true,
            accountId: bankAcc,
          },
          {
            id: 'tcb_2',
            type: 'out',
            amount: 283000,
            date: todayStr,
            cat: 'khac',
            merchant: 'Ví MoMo',
            note: 'Nap tien vao vi MoMo',
            confidence: 'cao',
            selected: true,
            accountId: bankAcc,
          },
          {
            id: 'tcb_3',
            type: 'out',
            amount: 392436,
            date: todayStr,
            cat: 'suc_khoe',
            merchant: 'CTCP Bệnh Viện Đông Đô',
            note: 'Thanh toán viện phí Bệnh Viện Đông Đô',
            confidence: 'cao',
            selected: true,
            accountId: bankAcc,
          },
          {
            id: 'tcb_4',
            type: 'out',
            amount: 575000,
            date: todayStr,
            cat: 'khac',
            merchant: 'Nông Đức Minh',
            note: 'Chuyen khoan Nong Duc Minh',
            confidence: 'cao',
            selected: true,
            accountId: bankAcc,
          },
          {
            id: 'tcb_5',
            type: 'transfer',
            isCreditPayment: true,
            amount: 12055130,
            date: todayStr,
            cat: 'tiet_kiem',
            merchant: 'VPBank Credit Card',
            note: 'Thanh toan no the tin dung VPBank StepUp',
            confidence: 'cao',
            selected: true,
            accountId: bankAcc,
          },
          {
            id: 'tcb_6',
            type: 'out',
            amount: 136000,
            date: todayStr,
            cat: 'khac',
            merchant: 'Ví MoMo',
            note: 'Nap tien vao vi MoMo (136k)',
            confidence: 'cao',
            selected: true,
            accountId: bankAcc,
          },
        ];
        setBatchTransactions(tcbStmt);
        setBatchSelectedCount(tcbStmt.length);
        setAiScanStatus('Đã đọc sao kê Techcombank, tự động đánh dấu trả thẻ tín dụng!');
      }
    }
  }, [isOpen, initialMode, demoType, profile, accounts]);

  // Support paste image anywhere while modal is open
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessImage(file, mode === 'batch');
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, mode]);

  // Amount formatted input handler (supports flexible dots and commas)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/^[0-9.,]*$/.test(raw)) {
      setAmountStr(raw);
    }
  };

  // Process image with blazing-fast 1200px compression and 3-step progress
  const handleProcessImage = async (file: File, isBatch = false) => {
    setIsScanningImage(true);
    setAiErrorMessage(null);
    setAutoSwitchedToBatch(false);

    try {
      // Step 1: Blazing fast canvas compression
      setScanStep(1);
      setAiScanStatus('⚡ 1. Đang tối ưu hoá ảnh siêu tốc (<50ms)…');
      const { base64, mimeType, previewUrl } = await compressImage(file, 1200, 0.82);
      setImagePreview(previewUrl);

      // Step 2: Gemini Vision AI analysis
      setScanStep(2);
      setAiScanStatus('🤖 2. Gemini AI đang bóc tách giao dịch & số tiền…');

      if (isBatch) {
        setIsBatchScanning(true);
        const res = await parseStatementWithAI(base64, mimeType, date);
        setScanStep(3);
        setAiScanStatus('✨ 3. Đang gán thẻ thanh toán mặc định…');

        const txsWithAccounts = res.transactions.map((tx) => {
          const matchedAcc =
            profile?.autoApplyDefaultAccounts !== false
              ? matchDefaultAccountForTransaction(
                  (tx.merchant || '') + ' ' + (tx.note || ''),
                  profile?.defaultMerchantAccounts,
                  profile?.customMerchantRules
                )
              : undefined;
          return {
            ...tx,
            accountId: matchedAcc || selectedAccount || accounts[0]?.id,
          };
        });

        setStatementTitle(res.statementName || 'Sao kê ngân hàng');
        setBatchTransactions(txsWithAccounts);
        setBatchSelectedCount(txsWithAccounts.length);
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
        setIsBatchScanning(false);
        return;
      }

      // Single receipt parser (with auto-detection of multi-order screens like Shopee/Grab)
      const parsed = await parseReceiptWithAI(base64, mimeType, date);
      setScanStep(3);
      setAiScanStatus('✨ 3. Đang hoàn thiện dữ liệu…');

      if (parsed.isMulti && parsed.transactions && parsed.transactions.length > 1) {
        // Automatically switch to Batch review mode!
        const txsWithAccounts = parsed.transactions.map((tx) => {
          const matchedAcc =
            profile?.autoApplyDefaultAccounts !== false
              ? matchDefaultAccountForTransaction(
                  (tx.merchant || '') + ' ' + (tx.note || ''),
                  profile?.defaultMerchantAccounts,
                  profile?.customMerchantRules
                )
              : undefined;
          return {
            ...tx,
            accountId: matchedAcc || selectedAccount || accounts[0]?.id,
          };
        });

        setMode('batch');
        setAutoSwitchedToBatch(true);
        setStatementTitle(parsed.statementName || 'Danh sách đơn hàng phát hiện');
        setBatchTransactions(txsWithAccounts);
        setBatchSelectedCount(txsWithAccounts.length);
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
        return;
      }

      // Single transaction mode auto-fill
      setType(parsed.type);
      setAmountStr(parsed.amount.toLocaleString('vi-VN'));
      setSelectedCat(parsed.cat);
      setDate(parsed.date);
      setNote(parsed.note);
      setItems(parsed.items || []);
      setConfidence(parsed.confidence || 'cao');
      setSource('ảnh');

      // Check default merchant account
      if (profile?.autoApplyDefaultAccounts !== false) {
        const searchKey = (parsed.merchant || '') + ' ' + (parsed.note || '');
        const matchedAcc = matchDefaultAccountForTransaction(
          searchKey,
          profile?.defaultMerchantAccounts,
          profile?.customMerchantRules
        );
        if (matchedAcc) {
          setSelectedAccount(matchedAcc);
          const lower = searchKey.toLowerCase();
          if (lower.includes('shopee')) setDetectedMerchant('Shopee (Visa)');
          else if (lower.includes('grab')) setDetectedMerchant('Grab (Ví điện tử)');
          else if (lower.includes('momo')) setDetectedMerchant('Ví MoMo');
          else if (lower.includes('zalopay')) setDetectedMerchant('Ví ZaloPay');
          else setDetectedMerchant(parsed.merchant || 'Quy tắc đặc thù');
        }
      }

      setAiScanStatus('Đã đọc xong siêu tốc! Vui lòng kiểm tra lại trước khi lưu.');
    } catch (err: any) {
      console.error('Lỗi khi đọc hoá đơn:', err);
      let msg = err?.message || 'Không thể đọc ảnh tự động. Bạn vẫn có thể nhập tay số tiền nhé!';
      if (msg.includes('Load failed') || msg.includes('Failed to fetch')) {
        msg = 'Mạng bị gián đoạn hoặc ảnh quá mờ. Vui lòng thử lại với ảnh rõ hơn.';
      } else if (msg.includes('{') && msg.includes('503')) {
        msg = 'Hệ thống AI đang có lượng truy cập cao trong giây lát. Vui lòng bấm thử lại.';
      }
      setAiErrorMessage(msg);
    } finally {
      setIsScanningImage(false);
      setIsBatchScanning(false);
      setScanStep(0);
    }
  };

  // Process quick natural language input
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;

    setIsQuickLoading(true);
    setAiErrorMessage(null);

    try {
      const parsed = await parseQuickInputWithAI(quickText, date);
      setType(parsed.type);
      setAmountStr(parsed.amount.toLocaleString('vi-VN'));
      setSelectedCat(parsed.cat);
      setDate(parsed.date);
      setNote(parsed.note);
      setSource('gõ nhanh');
      setConfidence(parsed.confidence || 'cao');

      // Auto match default account for quick text input
      if (profile?.autoApplyDefaultAccounts !== false) {
        const searchKey = (parsed.note || '') + ' ' + (parsed.merchant || '');
        const matchedAcc = matchDefaultAccountForTransaction(
          searchKey,
          profile?.defaultMerchantAccounts,
          profile?.customMerchantRules
        );
        if (matchedAcc) {
          setSelectedAccount(matchedAcc);
          const lower = searchKey.toLowerCase();
          if (lower.includes('shopee')) setDetectedMerchant('Shopee (Visa)');
          else if (lower.includes('grab')) setDetectedMerchant('Grab (Ví điện tử)');
          else if (lower.includes('momo')) setDetectedMerchant('Ví MoMo');
          else if (lower.includes('zalopay')) setDetectedMerchant('Ví ZaloPay');
          else setDetectedMerchant(parsed.merchant || 'Quy tắc đặc thù');
        }
      }

      setQuickText('');
    } catch (err: any) {
      setAiErrorMessage('Không thể phân tích câu gõ nhanh.');
    } finally {
      setIsQuickLoading(false);
    }
  };

  // Submit Single Transaction
  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseDecimal(amountStr);
    if (amount <= 0) {
      alert('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

    // Save default card preference if requested
    if (rememberDefaultCard && detectedMerchant && profile && onUpdateProfile) {
      const key = detectedMerchant.toLowerCase();
      const updatedDefaults = {
        ...(profile.defaultMerchantAccounts || {}),
        [key]: selectedAccount,
      };
      onUpdateProfile({
        ...profile,
        defaultMerchantAccounts: updatedDefaults,
      });
    }

    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      cat: type === 'transfer' ? 'tiet_kiem' : selectedCat,
      amount,
      date,
      note: note || (type === 'in' ? 'Khoản thu' : type === 'transfer' ? 'Chuyển tiền' : 'Khoản chi'),
      source,
      items: items.length > 0 ? items : undefined,
      accountId: selectedAccount,
      toAccountId: type === 'transfer' ? toAccount : undefined,
      confidence: confidence || undefined,
      createdAt: Date.now(),
    };

    onAddTransaction(tx);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
    onClose();
  };

  // Submit Batch Statement Transactions (with per-item account assignment!)
  const handleSaveBatch = () => {
    const selectedTxs = batchTransactions.filter((t) => t.selected);
    if (selectedTxs.length === 0) {
      alert('Vui lòng chọn ít nhất 1 giao dịch để ghi vào sổ');
      return;
    }

    const newTransactions: Transaction[] = selectedTxs.map((t, idx) => ({
      id: `stmt_tx_${Date.now()}_${idx}`,
      type: t.type,
      cat: t.cat,
      amount: t.amount,
      date: t.date,
      note: t.note,
      source: 'sao kê AI',
      merchant: t.merchant,
      accountId: t.accountId || selectedAccount,
      isCreditPayment: t.isCreditPayment,
      createdAt: Date.now() + idx,
    }));

    if (onAddMultipleTransactions) {
      onAddMultipleTransactions(newTransactions);
    } else {
      newTransactions.forEach((tx) => onAddTransaction(tx));
    }

    confetti({ particleCount: 70, spread: 90, origin: { y: 0.5 } });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl dark:bg-[#231c35] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-pink-100/80 px-5 py-3.5 dark:border-purple-900/40">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-full bg-pink-100/70 p-0.5 dark:bg-purple-950/60">
            <button
              onClick={() => setMode('single')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                mode === 'single'
                  ? 'bg-white text-pink-600 shadow-xs dark:bg-[#231c35] dark:text-pink-300'
                  : 'text-gray-500 hover:text-pink-600 dark:text-purple-300/70'
              }`}
            >
              Ghi thu chi
            </button>

            <button
              onClick={() => setMode('batch')}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                mode === 'batch'
                  ? 'bg-white text-purple-600 shadow-xs dark:bg-[#231c35] dark:text-purple-300'
                  : 'text-gray-500 hover:text-purple-600 dark:text-purple-300/70'
              }`}
            >
              <Sparkles size={11} className="text-purple-500" />
              <span>Quét sao kê AI</span>
            </button>

            <button
              onClick={() => setMode('transfer')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                mode === 'transfer'
                  ? 'bg-white text-pink-600 shadow-xs dark:bg-[#231c35] dark:text-pink-300'
                  : 'text-gray-500 hover:text-pink-600 dark:text-purple-300/70'
              }`}
            >
              Chuyển tiền / Trả thẻ
            </button>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-pink-50 hover:text-gray-600 dark:hover:bg-purple-900/40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* ================= MODE 1: SINGLE TRANSACTION ================= */}
          {mode === 'single' && (
            <>
              {/* 1. HAI NÚT LỚN: CHỤP HOÁ ĐƠN & CHỌN ẢNH */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="group flex items-center justify-center gap-2 rounded-2xl border border-pink-200/80 bg-gradient-to-r from-pink-50 to-rose-50 py-3 text-xs sm:text-sm font-semibold text-pink-700 shadow-xs hover:border-pink-300 active:scale-95 transition-all dark:border-pink-900/50 dark:from-pink-950/30 dark:to-purple-950/30 dark:text-pink-300"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-pink-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                    <Camera size={15} />
                  </div>
                  <span>Chụp hoá đơn</span>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessImage(file);
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex items-center justify-center gap-2 rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50 to-pink-50 py-3 text-xs sm:text-sm font-semibold text-purple-700 shadow-xs hover:border-purple-300 active:scale-95 transition-all dark:border-purple-900/50 dark:from-purple-950/30 dark:to-pink-950/30 dark:text-purple-300"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                    <ImageIcon size={15} />
                  </div>
                  <span>Chọn ảnh từ máy</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessImage(file);
                  }}
                />
              </div>

              {/* Quick sample buttons for testing */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-gray-400">Thử ảnh mẫu:</span>
                <button
                  type="button"
                  onClick={() => {
                    const shopeeCard = profile?.defaultMerchantAccounts?.['shopee'] || accounts[0]?.id;
                    const todayStr = new Date().toISOString().slice(0, 10);
                    setMode('batch');
                    setStatementTitle('Đơn đã mua Shopee (3 đơn chờ giao)');
                    setBatchTransactions([
                      { id: 'shopee_1', type: 'out', amount: 36000, date: todayStr, cat: 'mua_sam', merchant: 'Shopee - ARIA DECOR', note: 'Rèm nhà bếp rèm dán 1 LỚP tủ bếp (ARIA DECOR)', confidence: 'cao', selected: true, accountId: shopeeCard },
                      { id: 'shopee_2', type: 'out', amount: 42000, date: todayStr, cat: 'nha_o', merchant: 'Shopee - Shop Bố Soup', note: 'Xốp bọc cạnh bàn an toàn cho bé (Shop Bố Soup)', confidence: 'cao', selected: true, accountId: shopeeCard },
                      { id: 'shopee_3', type: 'out', amount: 21000, date: todayStr, cat: 'mua_sam', merchant: 'Shopee - Shop Mẹ Nhép', note: 'Khóa tủ an toàn cho bé gấu hồng (Shop Mẹ Nhép)', confidence: 'cao', selected: true, accountId: shopeeCard },
                    ]);
                    setAiScanStatus('Đã nhận diện 3 đơn Shopee & gán Thẻ tín dụng Shopee hoàn 6%!');
                  }}
                  className="rounded-full bg-pink-100/70 hover:bg-pink-200/80 px-2.5 py-1 text-[11px] font-semibold text-pink-700 dark:bg-purple-900/50 dark:text-pink-300"
                >
                  🛍️ Shopee (3 đơn)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const grabCard = profile?.defaultMerchantAccounts?.['grab'] || accounts[0]?.id;
                    const todayStr = new Date().toISOString().slice(0, 10);
                    setMode('batch');
                    setStatementTitle('Hoạt động Grab gần đây (Đã lọc đơn huỷ)');
                    setBatchTransactions([
                      { id: 'grab_1', type: 'out', amount: 136000, date: todayStr, cat: 'an_uong', merchant: 'Grab - Cơm Tấm Sườn Ba Son', note: 'Cơm Tấm Sườn Ba Son - Láng Hạ (2 món)', confidence: 'cao', selected: true, accountId: grabCard },
                      { id: 'grab_2', type: 'out', amount: 117000, date: todayStr, cat: 'an_uong', merchant: 'Grab - Bún Bò Huế Ngự Uyển', note: 'Bún Bò Huế Ngự Uyển - Hồ Đắc Di (2 món)', confidence: 'cao', selected: true, accountId: grabCard },
                      { id: 'grab_3', type: 'out', amount: 111864, date: todayStr, cat: 'an_uong', merchant: 'Grab - KHAOSAN Bún Thái', note: 'KHAOSAN - Bún Thái Hải Sản', confidence: 'cao', selected: true, accountId: grabCard },
                    ]);
                    setAiScanStatus('Đã đọc 3 đơn Grab & gán thẻ mặc định!');
                  }}
                  className="rounded-full bg-emerald-100/70 hover:bg-emerald-200/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                >
                  🛵 Grab (3 món)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const bankAcc = profile?.defaultMerchantAccounts?.['momo'] || accounts[0]?.id;
                    const todayStr = new Date().toISOString().slice(0, 10);
                    setMode('batch');
                    setStatementTitle('Biến động Techcombank Sinh lời tự động');
                    setBatchTransactions([
                      { id: 'tcb_1', type: 'in', amount: 8415, date: todayStr, cat: 'loi_dau_tu', merchant: 'Techcombank', note: 'Lợi nhuận Sinh lời tự động Techcombank', confidence: 'cao', selected: true, accountId: bankAcc },
                      { id: 'tcb_2', type: 'out', amount: 283000, date: todayStr, cat: 'khac', merchant: 'Ví MoMo', note: 'Nap tien vao vi MoMo', confidence: 'cao', selected: true, accountId: bankAcc },
                      { id: 'tcb_3', type: 'out', amount: 392436, date: todayStr, cat: 'suc_khoe', merchant: 'CTCP Bệnh Viện Đông Đô', note: 'Thanh toán viện phí Bệnh Viện Đông Đô', confidence: 'cao', selected: true, accountId: bankAcc },
                      { id: 'tcb_5', type: 'transfer', isCreditPayment: true, amount: 12055130, date: todayStr, cat: 'tiet_kiem', merchant: 'VPBank Credit Card', note: 'Thanh toan no the tin dung VPBank StepUp', confidence: 'cao', selected: true, accountId: bankAcc },
                    ]);
                    setAiScanStatus('Đã đọc sao kê Techcombank!');
                  }}
                  className="rounded-full bg-blue-100/70 hover:bg-blue-200/80 px-2.5 py-1 text-[11px] font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                >
                  🏦 Techcombank
                </button>
              </div>

              {/* AI Status / Image Preview Banner & 3-Step Speed Indicator */}
              {(isScanningImage || imagePreview || aiScanStatus || aiErrorMessage) && (
                <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-3.5 text-xs dark:border-purple-900/40 dark:bg-purple-950/30">
                  <div className="flex items-center gap-3">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Hoá đơn preview"
                        className="h-14 w-14 rounded-xl object-cover border border-pink-200 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {isScanningImage ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 font-semibold text-pink-600 dark:text-pink-300">
                            <Sparkles size={16} className="animate-spin text-pink-500" />
                            <span>{aiScanStatus || 'Đang quét ảnh...'}</span>
                          </div>
                          {/* 3-Step Progress Bar */}
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${scanStep >= 1 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                              1. Tối ưu ảnh
                            </span>
                            <span>→</span>
                            <span className={`px-2 py-0.5 rounded-full font-medium ${scanStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                              2. Gemini AI
                            </span>
                            <span>→</span>
                            <span className={`px-2 py-0.5 rounded-full font-medium ${scanStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                              3. Gán thẻ
                            </span>
                          </div>
                        </div>
                      ) : aiErrorMessage ? (
                        <p className="text-rose-600 font-medium">{aiErrorMessage}</p>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-pink-700 dark:text-pink-300">
                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                            <span className="truncate">{aiScanStatus || 'Đã đọc thành công'}</span>
                          </div>
                          {confidence && (
                            <span className="text-[10px] text-gray-500">
                              Độ tin cậy: <b className="text-pink-600">{confidence}</b>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collapsible extracted items */}
                  {items.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-pink-100 dark:border-purple-900/40">
                      <button
                        type="button"
                        onClick={() => setShowItemsList(!showItemsList)}
                        className="flex items-center justify-between w-full text-[11px] font-semibold text-gray-700 dark:text-purple-200"
                      >
                        <span>Danh sách món/mặt hàng đọc được ({items.length})</span>
                        {showItemsList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {showItemsList && (
                        <div className="mt-1.5 space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                          {items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[10px] text-gray-600 dark:text-purple-300">
                              <span className="truncate max-w-[200px]">• {it.name}</span>
                              <span className="font-semibold tabular-nums">{formatVND(it.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Ô GÕ NHANH KÈM NÚT GỬI */}
              <form onSubmit={handleQuickSubmit} className="relative">
                <input
                  type="text"
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  placeholder="Gõ nhanh: ăn trưa 65k hôm qua, lương 28tr..."
                  className="w-full rounded-2xl border border-pink-100 bg-white py-3 pl-4 pr-12 text-xs sm:text-sm text-gray-800 placeholder-gray-400 shadow-xs focus:border-pink-400 focus:outline-hidden focus:ring-2 focus:ring-pink-100 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                />
                <button
                  type="submit"
                  disabled={isQuickLoading || !quickText.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500 text-white shadow-xs hover:bg-pink-600 disabled:opacity-40 transition-all"
                  title="Phân tích câu"
                >
                  <Send size={14} />
                </button>
              </form>

              {/* 3. DÒNG PHÂN CÁCH "HOẶC NHẬP TAY" */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-pink-100 dark:border-purple-900/40"></div>
                <span className="absolute bg-white px-3 text-[11px] font-medium text-gray-400 dark:bg-[#231c35]">
                  hoặc nhập tay
                </span>
              </div>

              {/* 4. NÚT CHUYỂN KHOẢN CHI / KHOẢN THU */}
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-pink-100/60 p-1 dark:bg-purple-950/60">
                <button
                  type="button"
                  onClick={() => setType('out')}
                  className={`rounded-xl py-2 text-xs font-bold transition-all ${
                    type === 'out'
                      ? 'bg-white text-rose-600 shadow-xs dark:bg-[#231c35] dark:text-rose-400'
                      : 'text-gray-500 hover:text-rose-600 dark:text-purple-300/70'
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
                      : 'text-gray-500 hover:text-emerald-600 dark:text-purple-300/70'
                  }`}
                >
                  Khoản thu (+)
                </button>
              </div>

              {/* 5. Ô SỐ TIỀN CHỮ TO Ở GIỮA */}
              <div className="text-center py-1">
                <label className="text-[11px] font-medium text-gray-400">Số tiền (VND)</label>
                <div className="relative mt-1 inline-flex items-center justify-center w-full">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountStr}
                    onChange={handleAmountChange}
                    placeholder="0"
                    autoFocus
                    className="w-full text-center font-heading text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-gray-900 placeholder-gray-300 focus:outline-hidden dark:text-purple-100"
                  />
                  <span className="font-heading text-xl sm:text-2xl font-bold text-pink-500 ml-1">
                    ₫
                  </span>
                </div>
                {amountStr && (
                  <p className="text-center text-xs font-semibold text-pink-600 dark:text-pink-400 mt-1">
                    = {formatVND(parseDecimal(amountStr))}
                  </p>
                )}
              </div>

              {/* Account Selector */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                    Tài khoản / Thẻ thanh toán
                  </label>
                  {detectedMerchant && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      ⚡ Mặc định cho {detectedMerchant}
                    </span>
                  )}
                </div>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-3 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type === 'credit' ? '💳 [Thẻ TD] ' : '🏦 '}
                      {acc.name} ({acc.bankName}) · {formatVND(acc.type === 'credit' ? acc.creditBalance : acc.balance)}
                      {acc.creditCardCashback ? ` (Hoàn ${acc.creditCardCashback}%)` : ''}
                    </option>
                  ))}
                </select>

                {/* Option to remember as default */}
                <label className="flex items-center gap-2 mt-2 text-[11px] text-pink-700 dark:text-pink-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberDefaultCard}
                    onChange={(e) => setRememberDefaultCard(e.target.checked)}
                    className="h-3.5 w-3.5 rounded text-pink-600 focus:ring-pink-400"
                  />
                  <span>
                    Đặt làm thẻ thanh toán mặc định cho các đơn{' '}
                    <b>{detectedMerchant || (note ? `liên quan "${note.slice(0, 15)}"` : 'này')}</b>
                  </span>
                </label>
              </div>

              {/* 6. LƯỚI CHỌN DANH MỤC BẰNG ICON (4 CỘT) */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 mb-2 block">
                  Chọn danh mục {type === 'out' ? 'chi' : 'thu'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(type === 'out' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => {
                    const isSelected = selectedCat === cat.key;
                    return (
                      <button
                        type="button"
                        key={cat.key}
                        onClick={() => setSelectedCat(cat.key)}
                        className={`flex flex-col items-center justify-center rounded-2xl p-2 transition-all ${
                          isSelected
                            ? 'border-2 border-pink-500 bg-pink-50/80 shadow-xs dark:border-pink-400 dark:bg-purple-900/50'
                            : 'border border-pink-100/60 bg-white hover:bg-pink-50/30 dark:border-purple-900/30 dark:bg-[#1a1428]'
                        }`}
                      >
                        <CategoryIcon catKey={cat.key} size={20} showBg={false} />
                        <span className="mt-1 text-[10px] font-semibold text-gray-700 truncate max-w-full text-center dark:text-purple-200">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. NGÀY VÀ GHI CHÚ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                    Ngày giao dịch
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                    Ghi chú chi tiết
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Tên quán, món ăn, siêu thị..."
                    className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  />
                </div>
              </div>
            </>
          )}

          {/* ================= MODE 2: BATCH STATEMENT AI ================= */}
          {mode === 'batch' && (
            <div className="space-y-4">
              {/* Card Hướng dẫn & 2 Nút tải ảnh / Chụp ảnh */}
              <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 p-4 text-xs dark:border-purple-900/50 dark:from-purple-950/30 dark:to-pink-950/30 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-200 mb-1">
                  <Sparkles size={16} className="text-purple-600" />
                  <span>Quét Sao Kê & Lịch Sử Giao Dịch Nhiều Dòng</span>
                </div>
                <p className="text-purple-800/80 dark:text-purple-300/80 leading-relaxed text-[11px]">
                  Tải ảnh chụp màn hình app ngân hàng (Techcombank, Vietcombank, MB, VPBank...), ví MoMo, Shopee hoặc Grab. AI sẽ trích xuất tất cả các dòng giao dịch để bạn kiểm tra đầy đủ!
                </p>

                {/* 2 Nút: Chụp ảnh trực tiếp & Chọn ảnh từ thư viện */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => batchCameraInputRef.current?.click()}
                    disabled={isBatchScanning}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-700 py-2.5 px-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-800 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Camera size={14} />
                    <span>Chụp ảnh sao kê</span>
                  </button>
                  <input
                    ref={batchCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessImage(file, true);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => batchFileInputRef.current?.click()}
                    disabled={isBatchScanning}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 py-2.5 px-2 text-xs font-semibold text-white shadow-xs hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isBatchScanning ? <Sparkles size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    <span>{isBatchScanning ? 'Đang đọc...' : 'Chọn ảnh từ máy'}</span>
                  </button>
                  <input
                    ref={batchFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessImage(file, true);
                    }}
                  />
                </div>
              </div>

              {/* Trạng thái AI đang bóc tách */}
              {isBatchScanning && (
                <div className="rounded-2xl border border-purple-200 bg-purple-50/90 p-3.5 text-xs text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200 animate-pulse">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <Sparkles size={16} className="animate-spin text-purple-600" />
                    <span>Gemini AI đang bóc tách tất cả các dòng giao dịch...</span>
                  </div>
                  <p className="text-[11px] text-purple-700/80 dark:text-purple-300">
                    Hệ thống đang tự động nhận diện số tiền, nội dung chuyển khoản, ngày giờ và tự động gán thẻ thanh toán.
                  </p>
                </div>
              )}

              {/* Thông báo tự động chuyển sang sao kê nhiều dòng */}
              {autoSwitchedToBatch && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200 animate-fade-in">
                  🎉 <b>Đã phát hiện nhiều giao dịch:</b> Ảnh chứa {batchTransactions.length} đơn/giao dịch. Mời bạn kiểm tra chi tiết bên dưới trước khi ghi sổ.
                </div>
              )}

              {/* Thông báo lỗi rõ ràng nếu có */}
              {aiErrorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{aiErrorMessage}</p>
                      <p className="text-[11px] text-rose-600/80 mt-1">
                        Gợi ý: Bạn có thể chụp lại ảnh rõ hơn hoặc bấm dùng thử các mẫu sao kê chuẩn có sẵn bên dưới.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nếu chưa có giao dịch nào được đọc, hiển thị gợi ý & mẫu thử nhanh */}
              {batchTransactions.length === 0 && !isBatchScanning && (
                <div className="rounded-2xl border border-dashed border-purple-200 p-4 text-center dark:border-purple-900/40">
                  <Receipt size={28} className="mx-auto text-purple-400 mb-2" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                    Chưa có giao dịch sao kê nào
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
                    Bấm nút <b>Chụp ảnh sao kê</b> hoặc <b>Chọn ảnh từ máy</b> ở trên, hoặc bấm thử nhanh 1 trong các dữ liệu mẫu thực tế:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = new Date().toISOString().slice(0, 10);
                        const bankAcc = profile?.defaultMerchantAccounts?.['momo'] || accounts[0]?.id;
                        setStatementTitle('Sao kê Techcombank (Sinh lời tự động & Viện phí)');
                        setBatchTransactions([
                          { id: 'tcb_1', type: 'in', amount: 8415, date: todayStr, cat: 'loi_dau_tu', merchant: 'Techcombank', note: 'Lợi nhuận Sinh lời tự động Techcombank', confidence: 'cao', selected: true, accountId: bankAcc },
                          { id: 'tcb_2', type: 'out', amount: 283000, date: todayStr, cat: 'khac', merchant: 'Ví MoMo', note: 'Nap tien vao vi MoMo', confidence: 'cao', selected: true, accountId: bankAcc },
                          { id: 'tcb_3', type: 'out', amount: 392436, date: todayStr, cat: 'suc_khoe', merchant: 'CTCP Bệnh Viện Đông Đô', note: 'Thanh toán viện phí Bệnh Viện Đông Đô', confidence: 'cao', selected: true, accountId: bankAcc },
                          { id: 'tcb_4', type: 'out', amount: 575000, date: todayStr, cat: 'khac', merchant: 'Nông Đức Minh', note: 'Chuyen khoan tien an Nong Duc Minh', confidence: 'cao', selected: true, accountId: bankAcc },
                          { id: 'tcb_5', type: 'transfer', isCreditPayment: true, amount: 12055130, date: todayStr, cat: 'tiet_kiem', merchant: 'VPBank Credit Card', note: 'Thanh toan no the tin dung VPBank StepUp', confidence: 'cao', selected: true, accountId: bankAcc },
                        ]);
                      }}
                      className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      🏦 Thử sao kê Techcombank
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = new Date().toISOString().slice(0, 10);
                        const shopeeCard = profile?.defaultMerchantAccounts?.['shopee'] || accounts[0]?.id;
                        setStatementTitle('Đơn đã mua Shopee (3 đơn chờ giao)');
                        setBatchTransactions([
                          { id: 'sp_1', type: 'out', amount: 36000, date: todayStr, cat: 'mua_sam', merchant: 'Shopee - ARIA DECOR', note: 'Rèm nhà bếp dán 1 LỚP tủ bếp', confidence: 'cao', selected: true, accountId: shopeeCard },
                          { id: 'sp_2', type: 'out', amount: 42000, date: todayStr, cat: 'nha_o', merchant: 'Shopee - Shop Bố Soup', note: 'Xốp bọc cạnh bàn an toàn cho bé', confidence: 'cao', selected: true, accountId: shopeeCard },
                          { id: 'sp_3', type: 'out', amount: 21000, date: todayStr, cat: 'mua_sam', merchant: 'Shopee - Shop Mẹ Nhép', note: 'Khóa tủ an toàn cho bé gấu hồng', confidence: 'cao', selected: true, accountId: shopeeCard },
                        ]);
                      }}
                      className="rounded-full bg-pink-100 px-3 py-1 text-[11px] font-semibold text-pink-700 hover:bg-pink-200 transition-colors"
                    >
                      🛍️ Thử 3 đơn Shopee
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = new Date().toISOString().slice(0, 10);
                        const grabCard = profile?.defaultMerchantAccounts?.['grab'] || accounts[0]?.id;
                        setStatementTitle('Hoạt động Grab gần đây');
                        setBatchTransactions([
                          { id: 'gb_1', type: 'out', amount: 136000, date: todayStr, cat: 'an_uong', merchant: 'Grab - Cơm Tấm Sườn Ba Son', note: 'Cơm Tấm Sườn Ba Son - Láng Hạ (2 món)', confidence: 'cao', selected: true, accountId: grabCard },
                          { id: 'gb_2', type: 'out', amount: 117000, date: todayStr, cat: 'an_uong', merchant: 'Grab - Bún Bò Huế Ngự Uyển', note: 'Bún Bò Huế Ngự Uyển - Hồ Đắc Di', confidence: 'cao', selected: true, accountId: grabCard },
                          { id: 'gb_3', type: 'out', amount: 111864, date: todayStr, cat: 'an_uong', merchant: 'Grab - KHAOSAN Bún Thái', note: 'KHAOSAN - Bún Thái Hải Sản', confidence: 'cao', selected: true, accountId: grabCard },
                        ]);
                      }}
                      className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-200 transition-colors"
                    >
                      🛵 Thử 3 đơn Grab
                    </button>
                  </div>
                </div>
              )}

              {/* Tài khoản thanh toán mặc định cho cả danh sách */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                  Tài khoản mặc định cho cả danh sách:
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => {
                    const accId = e.target.value;
                    setSelectedAccount(accId);
                    setBatchTransactions((prev) =>
                      prev.map((t) => ({ ...t, accountId: accId }))
                    );
                  }}
                  className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type === 'credit' ? '💳 [Thẻ TD] ' : '🏦 '}
                      {acc.name} ({acc.bankName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Danh sách giao dịch đã bóc tách: Hiển thị đầy đủ mọi chi tiết */}
              {batchTransactions.length > 0 && (
                <div className="space-y-3 pt-1">
                  {/* Thanh tổng quan số tiền & Thao tác chọn tất cả */}
                  <div className="rounded-2xl bg-purple-100/50 p-3 dark:bg-purple-950/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-heading text-xs sm:text-sm font-bold text-gray-900 dark:text-purple-100">
                          {statementTitle || 'Giao dịch bóc tách được'} ({batchTransactions.length})
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          {/* Tổng Thu */}
                          {batchTransactions.filter((t) => t.selected && t.type === 'in').length > 0 && (
                            <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950/50 dark:text-emerald-400">
                              Thu: +{formatVND(batchTransactions.filter((t) => t.selected && t.type === 'in').reduce((s, t) => s + t.amount, 0))}
                            </span>
                          )}
                          {/* Tổng Chi */}
                          <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full dark:bg-rose-950/50 dark:text-rose-400">
                            Chi: -{formatVND(batchTransactions.filter((t) => t.selected && t.type !== 'in').reduce((s, t) => s + t.amount, 0))}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = batchTransactions.every((t) => t.selected);
                          setBatchTransactions((prev) =>
                            prev.map((t) => ({ ...t, selected: !allSelected }))
                          );
                        }}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-2xs hover:bg-purple-50 transition-all dark:bg-[#1a1428] dark:text-purple-200"
                      >
                        {batchTransactions.every((t) => t.selected) ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                      </button>
                    </div>
                  </div>

                  {/* Danh sách thẻ giao dịch: Hiển thị ĐẦY ĐỦ THÔNG TIN, KHÔNG TRUNCATE */}
                  <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
                    {batchTransactions.map((tx, idx) => {
                      const isIncome = tx.type === 'in';
                      return (
                        <div
                          key={tx.id || idx}
                          className={`flex flex-col gap-2 rounded-2xl border p-3.5 transition-all ${
                            tx.selected
                              ? 'border-purple-200 bg-white shadow-2xs dark:border-purple-800 dark:bg-[#231c35]'
                              : 'border-gray-200/50 bg-gray-50/60 opacity-60 dark:border-purple-900/20'
                          }`}
                        >
                          {/* Dòng trên: Checkbox + Tiêu đề / Tên cửa hàng + Số tiền lớn */}
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={!!tx.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setBatchTransactions((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, selected: checked } : item))
                                );
                              }}
                              className="mt-1 h-4 w-4 rounded-md text-pink-500 focus:ring-pink-400 cursor-pointer shrink-0"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-purple-100 break-words">
                                  {tx.merchant || (isIncome ? 'Khoản tiền nhận được' : 'Giao dịch thanh toán')}
                                </div>
                                <span
                                  className={`font-heading font-bold tabular-nums text-sm shrink-0 whitespace-nowrap ${
                                    isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-purple-100'
                                  }`}
                                >
                                  {isIncome ? `+${formatVND(tx.amount)}` : `-${formatVND(tx.amount)}`}
                                </span>
                              </div>

                              {/* Nội dung giao dịch đầy đủ (KHÔNG CẮT NGẮN) */}
                              {tx.note && (
                                <p className="text-[11px] text-gray-600 dark:text-purple-300/90 mt-1 leading-snug break-words">
                                  {tx.note}
                                </p>
                              )}

                              {/* Huy hiệu ngày tháng, trạng thái trả thẻ */}
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 mt-1.5">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded-md dark:bg-purple-900/40 dark:text-purple-300">
                                  {tx.date}
                                </span>
                                {tx.isCreditPayment && (
                                  <span className="rounded-md bg-rose-100 px-1.5 py-0.5 font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                    Thanh toán nợ thẻ TD
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Dòng dưới: Bộ chọn Danh mục + Bộ chọn Tài khoản cho từng mục */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-purple-100/60 dark:border-purple-900/40 text-[11px]">
                            {/* Chọn danh mục */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500 shrink-0">Danh mục:</span>
                              <select
                                value={tx.cat}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBatchTransactions((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, cat: val } : item))
                                  );
                                }}
                                className="flex-1 rounded-lg border border-purple-200 bg-purple-50/50 px-2 py-1 text-[11px] font-semibold text-purple-900 dark:bg-[#1a1428] dark:border-purple-900/50 dark:text-purple-200"
                              >
                                {(tx.type === 'in' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                                  <option key={c.key} value={c.key}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Chọn tài khoản thanh toán */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500 shrink-0">Thẻ/TK:</span>
                              <select
                                value={tx.accountId || selectedAccount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBatchTransactions((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, accountId: val } : item))
                                  );
                                }}
                                className="flex-1 rounded-lg border border-purple-200 bg-white px-2 py-1 text-[11px] font-semibold text-purple-900 dark:bg-[#1a1428] dark:border-purple-900/50 dark:text-purple-200"
                              >
                                {accounts.map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.type === 'credit' ? '💳 ' : '🏦 '}
                                    {acc.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= MODE 3: CHUYỂN TIỀN & TRẢ NỢ THẺ ================= */}
          {mode === 'transfer' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-3.5 text-xs text-gray-700 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-200">
                <div className="flex items-center gap-2 font-bold text-pink-700 dark:text-pink-300 mb-1">
                  <ArrowRightLeft size={16} />
                  <span>Chuyển tiền giữa các tài khoản & Trả nợ thẻ</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-purple-300/70">
                  Số dư tài khoản chuyển đi sẽ giảm, và số dư tài khoản nhận (hoặc dư nợ thẻ tín dụng) sẽ được cập nhật tương ứng.
                </p>
              </div>

              {/* Source Account */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                  Từ tài khoản nguồn (Chuyển đi)
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-3 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                >
                  {accounts
                    .filter((a) => a.type !== 'credit')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.bankName}) · Khả dụng: {formatVND(acc.balance)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Destination Account */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                  Đến tài khoản đích (Nhận tiền hoặc Thẻ tín dụng cần trả)
                </label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-3 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type === 'credit'
                        ? `[Thẻ Tín Dụng] ${acc.name} (Dư nợ: ${formatVND(acc.creditBalance)})`
                        : `${acc.name} (${acc.bankName})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                  Số tiền chuyển (VND)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-3 font-heading text-lg font-bold tabular-nums text-gray-900 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                />
                {amountStr && (
                  <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 mt-1">
                    = {formatVND(parseDecimal(amountStr))}
                  </p>
                )}
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
                    className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
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
                    placeholder="Chuyển tiền, trả nợ thẻ..."
                    className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-2.5 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 8. NÚT CỐ ĐỊNH Ở ĐÁY: HUỶ VÀ GHI VÀO SỔ */}
        <div className="border-t border-pink-100/80 bg-white px-5 py-3.5 dark:border-purple-900/40 dark:bg-[#231c35] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-gray-200 py-3 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all dark:border-purple-900/40 dark:text-purple-300"
          >
            Huỷ
          </button>

          {mode === 'batch' ? (
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={batchTransactions.filter((t) => t.selected).length === 0}
              className="flex-1 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-pink-200 hover:scale-102 active:scale-95 transition-all disabled:opacity-50"
            >
              Ghi nhận tất cả ({batchTransactions.filter((t) => t.selected).length})
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                if (mode === 'transfer') {
                  setType('transfer');
                }
                handleSaveSingle(e);
              }}
              className="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 py-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-pink-200/80 hover:scale-102 active:scale-95 transition-all"
            >
              Ghi vào sổ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
