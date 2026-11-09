import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Download,
  Upload,
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Trash2,
  Zap,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { UserProfile, AppData, CustomMerchantRule } from '../types';
import { AVATAR_OPTIONS, DEFAULT_MERCHANT_RULES, EXPENSE_CATEGORIES } from '../constants';
import { exportToCSV, formatVND, getMerchantRuleMatchInfo } from '../utils';
import { googleSignIn, logout, initAuth } from '../services/firebaseAuth';
import {
  uploadBackupToDrive,
  listDriveBackups,
  downloadBackupFromDrive,
  DriveBackupFile,
} from '../services/googleDrive';

interface SettingsTabProps {
  profile: UserProfile;
  appData: AppData;
  onUpdateProfile: (updated: UserProfile) => void;
  onRestoreData: (restored: AppData) => void;
  onClearSampleData?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  profile,
  appData,
  onUpdateProfile,
  onRestoreData,
  onClearSampleData,
}) => {
  const [name, setName] = useState(profile.name || '');
  const [avatar, setAvatar] = useState(profile.avatar || 'bunny');
  const [monthlyBudget, setMonthlyBudget] = useState(profile.monthlyBudget || 15000000);
  const [financialGoal, setFinancialGoal] = useState(
    profile.financialGoal || 'Tiết kiệm 50 triệu và đầu tư định kỳ'
  );
  const [riskAppetite, setRiskAppetite] = useState(profile.riskAppetite || 'medium');
  const [hideBalances, setHideBalances] = useState(profile.hideBalances || false);
  const [merchantAccounts, setMerchantAccounts] = useState<Record<string, string>>(
    profile.defaultMerchantAccounts || {
      shopee: 'acc_credit',
      grab: 'acc_credit',
      momo: 'acc_vcb',
      zalopay: 'acc_vcb',
      sieu_thi: 'acc_credit',
      an_uong: 'acc_vcb',
      luong: 'acc_vcb',
    }
  );
  const [autoApplyDefaults, setAutoApplyDefaults] = useState(
    profile.autoApplyDefaultAccounts !== false
  );
  const [customRules, setCustomRules] = useState<CustomMerchantRule[]>(
    profile.customMerchantRules || []
  );

  // Adding new rule state
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleLabel, setNewRuleLabel] = useState('');
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleAccountId, setNewRuleAccountId] = useState(appData.accounts[0]?.id || '');
  const [newRuleCat, setNewRuleCat] = useState('mua_sam');

  // Interactive live tester state
  const [testText, setTestText] = useState('Shopee đồ gia dụng');

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [cardSaveMsg, setCardSaveMsg] = useState(false);

  // Google Drive state
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isDriveBusy, setIsDriveBusy] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [driveStatusMsg, setDriveStatusMsg] = useState<string | null>(null);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [confirmRestoreFile, setConfirmRestoreFile] = useState<DriveBackupFile | null>(null);

  useEffect(() => {
    // Check initial auth state
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name,
      avatar,
      monthlyBudget,
      financialGoal,
      riskAppetite,
      hideBalances,
      defaultMerchantAccounts: merchantAccounts,
      customMerchantRules: customRules,
      autoApplyDefaultAccounts: autoApplyDefaults,
    });
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleSaveMerchantRule = (key: string, accountId: string) => {
    const updated = {
      ...merchantAccounts,
      [key]: accountId,
    };
    setMerchantAccounts(updated);
    onUpdateProfile({
      ...profile,
      defaultMerchantAccounts: updated,
    });
    setCardSaveMsg(true);
    setTimeout(() => setCardSaveMsg(false), 2500);
  };

  const handleToggleAutoApply = () => {
    const nextVal = !autoApplyDefaults;
    setAutoApplyDefaults(nextVal);
    onUpdateProfile({
      ...profile,
      autoApplyDefaultAccounts: nextVal,
    });
    setCardSaveMsg(true);
    setTimeout(() => setCardSaveMsg(false), 2500);
  };

  const handleCreateCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleKeyword.trim() || !newRuleLabel.trim()) return;

    const newRule: CustomMerchantRule = {
      id: `rule_${Date.now()}`,
      label: newRuleLabel.trim(),
      keyword: newRuleKeyword.trim(),
      accountId: newRuleAccountId || appData.accounts[0]?.id || '',
      defaultCat: newRuleCat,
      enabled: true,
    };

    const updated = [...customRules, newRule];
    setCustomRules(updated);
    onUpdateProfile({
      ...profile,
      customMerchantRules: updated,
    });

    setNewRuleLabel('');
    setNewRuleKeyword('');
    setIsAddingRule(false);
    setCardSaveMsg(true);
    setTimeout(() => setCardSaveMsg(false), 2500);
  };

  const handleDeleteCustomRule = (ruleId: string) => {
    const updated = customRules.filter((r) => r.id !== ruleId);
    setCustomRules(updated);
    onUpdateProfile({
      ...profile,
      customMerchantRules: updated,
    });
    setCardSaveMsg(true);
    setTimeout(() => setCardSaveMsg(false), 2500);
  };

  const handleToggleCustomRule = (ruleId: string) => {
    const updated = customRules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    setCustomRules(updated);
    onUpdateProfile({
      ...profile,
      customMerchantRules: updated,
    });
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setIsDriveBusy(true);
    setDriveStatusMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setDriveStatusMsg('Đã đăng nhập Google thành công!');
      }
    } catch (err: any) {
      console.error('Lỗi đăng nhập Google:', err);
      setDriveStatusMsg(err.message || 'Không thể đăng nhập Google');
    } finally {
      setIsDriveBusy(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setDriveBackups([]);
    setDriveStatusMsg('Đã đăng xuất Google');
  };

  // Backup to Google Drive
  const handleBackupToDrive = async () => {
    if (!googleUser) {
      await handleGoogleLogin();
    }
    setIsDriveBusy(true);
    setDriveStatusMsg('Đang tạo bản sao lưu lên Google Drive…');
    try {
      const res = await uploadBackupToDrive(appData);
      setDriveStatusMsg(`Đã sao lưu thành công lên Google Drive: ${res.name}`);
    } catch (err: any) {
      console.error('Lỗi sao lưu Google Drive:', err);
      setDriveStatusMsg(err.message || 'Lỗi khi sao lưu lên Google Drive');
    } finally {
      setIsDriveBusy(false);
    }
  };

  // List Drive backups
  const handleOpenDriveList = async () => {
    if (!googleUser) {
      await handleGoogleLogin();
    }
    setIsDriveBusy(true);
    try {
      const list = await listDriveBackups();
      setDriveBackups(list);
      setShowDriveModal(true);
    } catch (err: any) {
      setDriveStatusMsg(err.message || 'Không thể lấy danh sách từ Drive');
    } finally {
      setIsDriveBusy(false);
    }
  };

  // Confirm restore from Drive
  const executeRestoreFromDrive = async (file: DriveBackupFile) => {
    setIsDriveBusy(true);
    try {
      const data = await downloadBackupFromDrive(file.id);
      if (data && (data.transactions || data.accounts)) {
        onRestoreData(data);
        setConfirmRestoreFile(null);
        setShowDriveModal(false);
        setDriveStatusMsg(`Đã khôi phục thành công từ bản ${file.name}`);
      } else {
        throw new Error('File sao lưu không đúng định dạng Sổ Thu Chi');
      }
    } catch (err: any) {
      setDriveStatusMsg(err.message || 'Lỗi khi khôi phục dữ liệu');
    } finally {
      setIsDriveBusy(false);
    }
  };

  // Export local JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `SoThuChi_Backup_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import local JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (parsed.transactions || parsed.accounts)) {
          if (
            window.confirm(
              'Khôi phục dữ liệu từ file này sẽ thay thế dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục không?'
            )
          ) {
            onRestoreData(parsed);
            alert('Khôi phục dữ liệu thành công!');
          }
        } else {
          alert('File JSON không đúng cấu trúc ứng dụng Sổ Thu Chi.');
        }
      } catch (err) {
        alert('File không hợp lệ hoặc bị lỗi đọc.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Cá Nhân Hoá & Thiết Lập Tài Chính */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 sm:p-6 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-pink-600 dark:bg-purple-900/50 dark:text-purple-300">
            <Sparkles size={18} />
          </div>
          <h3 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100">
            Cá Nhân Hoá & Thiết Lập Tài Chính
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar selector */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
              Chọn linh vật / Avatar dễ thương
            </label>
            <div className="mt-2 grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setAvatar(opt.id)}
                  className={`flex flex-col items-center justify-center rounded-2xl p-2.5 transition-all ${
                    avatar === opt.id
                      ? 'border-2 border-pink-500 bg-pink-50 shadow-xs dark:border-pink-400 dark:bg-purple-900/50'
                      : 'border border-pink-100/60 hover:bg-pink-50/40 dark:border-purple-900/30'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-[10px] text-gray-500 dark:text-purple-300 mt-1">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* User Name */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
              Tên hiển thị của bạn
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Bé Bắp, Phương Linh, Mai Anh..."
              required
              className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-3 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
            />
          </div>

          {/* Monthly Budget */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
              Ngân sách chi tiêu mỗi tháng (VND)
            </label>
            <input
              type="number"
              step="500000"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(parseInt(e.target.value, 10) || 0)}
              className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-3 text-xs sm:text-sm text-gray-800 tabular-nums font-semibold dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Hiện tại: {formatVND(monthlyBudget)}/tháng
            </p>
          </div>

          {/* Financial Goal */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
              Mục tiêu tài chính
            </label>
            <input
              type="text"
              value={financialGoal}
              onChange={(e) => setFinancialGoal(e.target.value)}
              placeholder="Ví dụ: Tiết kiệm 50 triệu mua xe, đầu tư tích sản dài hạn..."
              className="mt-1 w-full rounded-2xl border border-pink-100 bg-white p-3 text-xs sm:text-sm text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
            />
          </div>

          {/* Risk Appetite */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200">
              Khẩu vị rủi ro đầu tư
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Thấp', desc: 'Ưu tiên an toàn, tiền gửi ngân hàng' },
                { id: 'medium', label: 'Trung bình', desc: 'Cân bằng, quỹ mở & vàng' },
                { id: 'high', label: 'Cao', desc: 'Tăng trưởng, cổ phiếu & CCQ' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setRiskAppetite(item.id as any)}
                  className={`rounded-2xl p-2.5 text-left border transition-all ${
                    riskAppetite === item.id
                      ? 'border-pink-500 bg-pink-50 shadow-xs dark:border-pink-400 dark:bg-purple-900/40'
                      : 'border-pink-100/60 bg-white dark:border-purple-900/30 dark:bg-[#1a1428]'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-800 dark:text-purple-100">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Toggle: Hide Balances */}
          <div className="flex items-center justify-between rounded-2xl bg-pink-50/50 p-3.5 dark:bg-purple-950/30">
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-purple-100">
                Ẩn số tiền trên toàn ứng dụng
              </p>
              <p className="text-[11px] text-gray-400">
                Làm mờ (blur) mọi con số để bảo mật khi dùng nơi đông người
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHideBalances(!hideBalances)}
              className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors ${
                hideBalances ? 'bg-pink-500 justify-end' : 'bg-gray-300 justify-start dark:bg-purple-900'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-xs">
                {hideBalances ? <EyeOff size={12} className="text-pink-600" /> : <Eye size={12} className="text-gray-400" />}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccessMsg && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 size={14} />
                Đã lưu cài đặt!
              </span>
            )}
            <button
              type="submit"
              className="ml-auto rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-pink-200/80 hover:scale-105 active:scale-95 transition-all dark:shadow-none"
            >
              Lưu thiết lập
            </button>
          </div>
        </form>
      </div>

      {/* 2. CẤU HÌNH TÀI KHOẢN MẶC ĐỊNH CHO TỪNG DANH MỤC ĐẶC THÙ (SHOPEE VISA, GRAB VÍ ĐIỆN TỬ...) */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 sm:p-6 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        {/* Card Header & Auto-Apply Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-100/60 pb-3 mb-4 dark:border-purple-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-xs">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100">
                Tài Khoản Mặc Định Cho Danh Mục Đặc Thù
              </h3>
              <p className="text-[11px] text-gray-400">
                Cài thẻ Visa cho Shopee, Ví điện tử cho Grab để AI tự động chọn đúng khi quét hoá đơn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {cardSaveMsg && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 animate-fade-in">
                <CheckCircle2 size={13} />
                Đã lưu!
              </span>
            )}
            <button
              type="button"
              onClick={handleToggleAutoApply}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                autoApplyDefaults
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-purple-900/40 dark:text-purple-300'
              }`}
            >
              <Zap size={13} className={autoApplyDefaults ? 'text-emerald-600' : 'text-gray-400'} />
              <span>{autoApplyDefaults ? 'AI tự động gán: BẬT' : 'AI tự động gán: TẮT'}</span>
            </button>
          </div>
        </div>

        {/* Tip Box */}
        <div className="rounded-2xl border border-pink-100/70 bg-gradient-to-r from-pink-50/50 via-purple-50/40 to-pink-50/30 p-3.5 text-xs text-gray-700 dark:border-purple-900/40 dark:from-purple-950/30 dark:to-pink-950/20 dark:text-purple-200 mb-4">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="text-pink-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-pink-700 dark:text-pink-300">
                Quy tắc hoàn tiền & tối ưu tài chính:
              </span>
              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-600 dark:text-purple-300/80">
                Cài đặt thẻ thanh toán riêng cho từng nguồn: <b>Shopee</b> thanh toán qua Thẻ tín dụng Visa để nhận 6% hoàn tiền trực tuyến; <b>Grab</b> thanh toán qua Ví điện tử MoMo/ZaloPay để tích điểm. Khi bạn quét ảnh hoá đơn hay sao kê, hệ thống sẽ tự động gán chính xác tài khoản này!
              </p>
            </div>
          </div>
        </div>

        {/* 1. PRESET SPECIAL MERCHANTS */}
        <div className="space-y-3">
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-purple-300/60">
            Dịch vụ đặc thù phổ biến (Cố định)
          </h4>

          {DEFAULT_MERCHANT_RULES.map((rule) => {
            const currentAccId = merchantAccounts[rule.key] || appData.accounts[0]?.id;
            const currentAcc = appData.accounts.find((a) => a.id === currentAccId);
            return (
              <div
                key={rule.key}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-pink-50 bg-pink-50/20 p-3 hover:bg-pink-50/40 transition-colors dark:border-purple-900/30 dark:bg-purple-950/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{rule.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-purple-100 truncate">
                      {rule.label}
                    </p>
                    <p className="text-[10px] text-pink-600 dark:text-pink-300">
                      {rule.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={currentAccId}
                    onChange={(e) => handleSaveMerchantRule(rule.key, e.target.value)}
                    className="w-full sm:w-64 rounded-xl border border-pink-200/80 bg-white px-2.5 py-2 text-xs text-gray-800 font-semibold shadow-2xs focus:border-pink-400 focus:outline-hidden dark:border-purple-900/60 dark:bg-[#1a1428] dark:text-purple-100"
                  >
                    {appData.accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type === 'credit' ? '💳 [Visa/Mastercard] ' : acc.type === 'cash' ? '💵 ' : '🏦 '}
                        {acc.name} ({acc.bankName})
                        {acc.creditCardCashback ? ` - Hoàn ${acc.creditCardCashback}%` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. CUSTOM USER-DEFINED RULES */}
        <div className="mt-5 pt-4 border-t border-pink-100/60 dark:border-purple-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-purple-300/60">
                Quy tắc dịch vụ riêng của bạn ({customRules.length})
              </h4>
              <p className="text-[10px] text-gray-400">
                Thêm từ khoá riêng như "TikTok Shop", "Xanh SM", "Lazada", "Netflix"...
              </p>
            </div>

            {!isAddingRule && (
              <button
                type="button"
                onClick={() => setIsAddingRule(true)}
                className="flex items-center gap-1 rounded-xl bg-pink-100 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-200 active:scale-95 transition-all dark:bg-purple-900/50 dark:text-pink-300"
              >
                <Plus size={14} />
                <span>+ Thêm quy tắc riêng</span>
              </button>
            )}
          </div>

          {/* Form adding custom rule */}
          {isAddingRule && (
            <form
              onSubmit={handleCreateCustomRule}
              className="rounded-2xl border border-pink-200 bg-pink-50/40 p-4 space-y-3 dark:border-purple-800 dark:bg-purple-950/30 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-purple-100">
                  Thêm dịch vụ & tài khoản mặc định mới
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Huỷ
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-purple-200">
                    Tên hiển thị dịch vụ
                  </label>
                  <input
                    type="text"
                    value={newRuleLabel}
                    onChange={(e) => setNewRuleLabel(e.target.value)}
                    placeholder="Ví dụ: TikTok Shop (Visa), Xanh SM (Ví MoMo)..."
                    required
                    className="mt-1 w-full rounded-xl border border-pink-200 bg-white p-2 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-purple-200">
                    Từ khoá trong hoá đơn/sao kê
                  </label>
                  <input
                    type="text"
                    value={newRuleKeyword}
                    onChange={(e) => setNewRuleKeyword(e.target.value)}
                    placeholder="Ví dụ: tiktok, xanh sm, netflix, be..."
                    required
                    className="mt-1 w-full rounded-xl border border-pink-200 bg-white p-2 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-purple-200">
                    Tài khoản / Thẻ thanh toán mặc định
                  </label>
                  <select
                    value={newRuleAccountId}
                    onChange={(e) => setNewRuleAccountId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-pink-200 bg-white p-2 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  >
                    {appData.accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type === 'credit' ? '💳 [Visa] ' : '🏦 '}
                        {acc.name} ({acc.bankName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-purple-200">
                    Danh mục chi tiêu mặc định
                  </label>
                  <select
                    value={newRuleCat}
                    onChange={(e) => setNewRuleCat(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-pink-200 bg-white p-2 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="rounded-xl bg-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-pink-700 active:scale-95 transition-all"
                >
                  Lưu quy tắc này
                </button>
              </div>
            </form>
          )}

          {/* List of custom rules */}
          {customRules.length > 0 ? (
            <div className="space-y-2">
              {customRules.map((rule) => {
                const acc = appData.accounts.find((a) => a.id === rule.accountId);
                return (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-purple-100 bg-white p-3 shadow-2xs dark:border-purple-900/40 dark:bg-[#1a1428]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-600 text-xs font-bold dark:bg-purple-900 dark:text-pink-300">
                        ⚡
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-purple-100 truncate">
                          {rule.label}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Từ khoá: <code className="bg-pink-50 text-pink-700 px-1 rounded dark:bg-purple-900 dark:text-pink-300">{rule.keyword}</code> • Thẻ: <b>{acc?.name || 'Tài khoản mặc định'}</b>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleCustomRule(rule.id)}
                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
                          rule.enabled
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-gray-200 text-gray-500 dark:bg-purple-900/40'
                        }`}
                      >
                        {rule.enabled ? 'Đang bật' : 'Đã tắt'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomRule(rule.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Xoá quy tắc"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !isAddingRule && (
              <p className="text-[11px] text-gray-400 italic py-1">
                Chưa có quy tắc riêng. Bạn có thể nhấn "+ Thêm quy tắc riêng" để cài đặt thêm cho TikTok Shop, Xanh SM, Lazada...
              </p>
            )
          )}
        </div>

        {/* 3. INTERACTIVE LIVE TESTER (Kiểm tra thử quy tắc trực tiếp) */}
        <div className="mt-5 pt-4 border-t border-pink-100/60 dark:border-purple-900/40">
          <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-3.5 dark:border-purple-900/30 dark:bg-purple-950/20">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-purple-100 mb-2">
              <Zap size={14} className="text-amber-500" />
              <span>Kiểm tra thử quy tắc nhận diện:</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Gõ thử: Shopee 150k, Đi Grab 45k, Cơm Tấm Ba Son..."
                className="flex-1 rounded-xl border border-pink-200 bg-white px-3 py-1.5 text-xs text-gray-800 dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
              />
            </div>

            {/* Test matching result */}
            {(() => {
              const match = getMerchantRuleMatchInfo(testText, merchantAccounts, customRules);
              const matchedAcc = appData.accounts.find((a) => a.id === match?.accountId);
              return (
                <div className="mt-2.5 flex items-center gap-2 text-xs">
                  {match && matchedAcc ? (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-200 w-full">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>
                        AI tự động chọn: <b>{matchedAcc.name}</b> ({matchedAcc.bankName})
                        {matchedAcc.type === 'credit' ? ' 💳 [Visa]' : ' 🏦'} cho {match.ruleLabel}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400">
                      Chưa khớp quy tắc riêng nào, AI sẽ dùng tài khoản mặc định thông thường.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 3. GOOGLE DRIVE BACKUP & SYNC */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 sm:p-6 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <Cloud size={18} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100">
                Sao Lưu & Đồng Bộ Google Drive
              </h3>
              <p className="text-[11px] text-gray-400">
                Lưu an toàn trên đám mây của bạn, không sợ mất khi đổi máy
              </p>
            </div>
          </div>
        </div>

        {googleUser ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-blue-50/60 p-3 dark:bg-blue-950/30 border border-blue-100/60 dark:border-blue-900/40">
              <div className="flex items-center gap-2.5">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt="Google user"
                    className="h-8 w-8 rounded-full border border-blue-200"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-blue-800 font-bold text-xs">
                    G
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-purple-100">
                    {googleUser.displayName || 'Tài khoản Google'}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-purple-300/70">
                    {googleUser.email}
                  </p>
                </div>
              </div>

              <button
                onClick={handleGoogleLogout}
                className="flex items-center gap-1 text-xs text-rose-600 hover:underline p-1.5"
              >
                <LogOut size={14} />
                <span>Đăng xuất</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleBackupToDrive}
                disabled={isDriveBusy}
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isDriveBusy ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
                <span>Sao lưu lên Google Drive</span>
              </button>

              <button
                onClick={handleOpenDriveList}
                disabled={isDriveBusy}
                className="flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 active:scale-95 transition-all dark:bg-[#1a1428] dark:border-blue-900/60 dark:text-blue-300"
              >
                <Download size={15} />
                <span>Xem bản sao lưu & Khôi phục</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-500 dark:text-purple-300/80 mb-3">
              Kết nối Google Drive để sao lưu toàn bộ nhật ký thu chi, số dư ngân hàng và báo cáo tài chính một cách riêng tư và bảo mật.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={isDriveBusy}
              className="flex items-center gap-3 rounded-2xl border border-gray-300 bg-white px-5 py-3 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 active:scale-95 transition-all dark:bg-[#1a1428] dark:border-purple-900/60 dark:text-purple-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
              </svg>
              <span>{isDriveBusy ? 'Đang kết nối…' : 'Đăng nhập với Google để kích hoạt Drive'}</span>
            </button>
          </div>
        )}

        {driveStatusMsg && (
          <div className="mt-3 rounded-xl bg-pink-50 p-2.5 text-xs text-pink-700 dark:bg-purple-950/40 dark:text-purple-300">
            {driveStatusMsg}
          </div>
        )}
      </div>

      {/* 3. SAO LƯU NỘI BỘ & XUẤT CSV */}
      <div className="rounded-3xl border border-pink-100/90 bg-white p-5 sm:p-6 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
        <h3 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100 mb-2">
          Xuất & Khôi Phục File Thiết Bị
        </h3>
        <p className="text-xs text-gray-500 dark:text-purple-300/80 mb-4">
          Tải file dữ liệu về máy tính/điện thoại để lưu trữ độc lập hoặc nhập vào Excel.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* CSV Export */}
          <button
            onClick={() => exportToCSV(appData.transactions)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất Excel / CSV (BOM UTF-8)</span>
          </button>

          {/* JSON Export */}
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50/60 p-3 text-xs font-semibold text-purple-800 hover:bg-purple-100 active:scale-95 transition-all dark:bg-purple-950/30 dark:border-purple-900/50 dark:text-purple-300"
          >
            <Download size={16} />
            <span>Sao lưu JSON về máy</span>
          </button>

          {/* JSON Import */}
          <label className="flex items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-pink-50/60 p-3 text-xs font-semibold text-pink-800 hover:bg-pink-100 active:scale-95 transition-all cursor-pointer dark:bg-pink-950/30 dark:border-pink-900/50 dark:text-pink-300">
            <Upload size={16} />
            <span>Khôi phục từ file JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* 5. Ghi Chú Bảo Mật */}
      <div className="rounded-3xl border border-pink-100/80 bg-pink-50/40 p-5 text-xs text-gray-600 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-300/80">
        <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-purple-100 mb-1.5">
          <Shield size={16} className="text-pink-500" />
          <span>Bảo Mật & Quyền Riêng Tư</span>
        </div>
        <ul className="space-y-1.5 list-disc list-inside text-[11px] leading-relaxed text-gray-500 dark:text-purple-300/70">
          <li>Dữ liệu thu chi và tài khoản lưu trữ an toàn trong trình duyệt của máy bạn (localStorage).</li>
          <li>Ảnh hoá đơn và sao kê chỉ gửi tạm thời đến AI để nhận diện số liệu, không lưu trữ ảnh trên máy chủ.</li>
          <li>Bạn nên che số tài khoản đầy đủ và tuyệt đối không tải ảnh có mã OTP hoặc mật khẩu.</li>
        </ul>
      </div>

      {/* DRIVE RESTORE MODAL (Mandatory User Confirmation for Destructive/Mutating Operations) */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl dark:bg-[#231c35]">
            <div className="flex items-center justify-between border-b border-pink-50 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Cloud size={20} className="text-blue-600" />
                <h4 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100">
                  Bản Sao Lưu Trên Google Drive
                </h4>
              </div>
              <button
                onClick={() => {
                  setShowDriveModal(false);
                  setConfirmRestoreFile(null);
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Đóng
              </button>
            </div>

            {/* List of files */}
            {driveBackups.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                {driveBackups.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-2xl border border-pink-50 p-3 bg-pink-50/20 hover:bg-pink-50/50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-purple-100">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Tạo lúc: {new Date(file.createdTime).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <button
                      onClick={() => setConfirmRestoreFile(file)}
                      className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Chọn khôi phục
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">
                Chưa tìm thấy bản sao lưu nào trên Google Drive của bạn.
              </p>
            )}

            {/* Explicit Confirmation Dialog (Mandatory Workspace Skill Requirement) */}
            {confirmRestoreFile && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs dark:bg-rose-950/40 dark:border-rose-900/50">
                <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-200">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <p className="font-bold">Xác nhận khôi phục dữ liệu?</p>
                    <p className="text-[11px] mt-0.5 text-rose-700 dark:text-rose-300">
                      Hành động này sẽ ghi đè toàn bộ nhật ký giao dịch và tài khoản hiện tại trên máy bằng bản sao lưu &quot;{confirmRestoreFile.name}&quot;. Bạn có muốn tiếp tục không?
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmRestoreFile(null)}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Huỷ bỏ
                  </button>
                  <button
                    onClick={() => executeRestoreFromDrive(confirmRestoreFile)}
                    disabled={isDriveBusy}
                    className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    {isDriveBusy ? 'Đang khôi phục…' : 'Xác nhận khôi phục'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
