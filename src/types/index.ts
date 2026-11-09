export type TransactionType = 'out' | 'in' | 'transfer';

export type CategoryGroup = 'need' | 'want' | 'save' | 'income';

export interface CategoryInfo {
  key: string;
  name: string;
  group: CategoryGroup;
  iconName: string;
  color: string;
  bgColor: string;
}

export interface TransactionItem {
  name: string;
  amount: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  cat: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  source: 'ảnh' | 'gõ nhanh' | 'nhập tay' | 'sao kê AI';
  items?: TransactionItem[];
  accountId?: string;
  toAccountId?: string;
  transferFee?: number;
  isCreditPayment?: boolean;
  confidence?: 'cao' | 'trung bình' | 'thấp';
  merchant?: string;
  createdAt: number;
}

export type AccountType = 'bank' | 'cash' | 'credit' | 'savings' | 'investment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName: string;
  balance: number;
  creditLimit?: number;
  creditBalance?: number; // số tiền đã quẹt / dư nợ
  creditDueDay?: number; // ngày hạn thanh toán (1-31)
  creditStatementDay?: number; // ngày chốt sao kê
  savingsInterestRate?: number; // %/năm
  savingsTermMonths?: number;
  savingsStartDate?: string;
  savingsMaturityDate?: string;
  color: string;
  icon: string;
  accountNumber?: string;
  creditCardCashback?: number; // % hoàn tiền
  cardNetwork?: 'visa' | 'mastercard' | 'jcb' | 'napas';
  cardGradient?: string;
}

export type InvestmentType = 'stock' | 'fund' | 'bond' | 'gold';

export interface InvestmentHolding {
  id: string;
  symbol: string; // FPT, HPG, DCDS, VESAF...
  name: string;
  type: InvestmentType;
  shares: number; // số lượng cổ phiếu / chứng chỉ quỹ / chỉ vàng
  buyPrice: number; // giá mua trung bình (VND)
  currentPrice: number; // giá thị trường hiện tại (VND)
  dividendsReceived: number; // tổng tiền cổ tức đã nhận (VND)
  unit?: string; // CP, CCQ, chỉ, lượng
  note?: string;
}

export type PastelThemeKey = 'sakura' | 'lavender' | 'mint' | 'peach';

export interface CustomMerchantRule {
  id: string;
  keyword: string; // ví dụ: "shopee", "grab", "tiktok shop", "xanh sm", "netflix"
  label: string; // ví dụ: "Shopee (Thanh toán qua Visa)", "Grab (Ví điện tử)"
  icon?: string;
  accountId: string; // ID tài khoản áp dụng
  defaultCat?: string; // mã danh mục nếu có
  enabled: boolean;
}

export interface UserProfile {
  name: string;
  avatar: string; // 'bunny' | 'cat' | 'strawberry' | 'bear' | 'crown' | 'sparkles'
  hideBalances: boolean;
  monthlyBudget: number;
  financialGoal: string;
  riskAppetite: 'low' | 'medium' | 'high';
  theme: 'system' | 'light' | 'dark';
  pastelTheme?: PastelThemeKey;
  customGreeting?: string;
  defaultMerchantAccounts?: Record<string, string>; // e.g. { shopee: 'acc_credit', grab: 'acc_credit', momo: 'acc_vcb' }
  customMerchantRules?: CustomMerchantRule[];
  autoApplyDefaultAccounts?: boolean;
  categoryBudgets?: Record<string, number>; // e.g. { an_uong: 4000000, mua_sam: 2000000 }
}

export interface AISavingsTip {
  tieu_de: string;
  chi_tiet: string;
  tiet_kiem_thang: number;
}

export interface AIAllocation {
  kenh: string;
  ty_le: number;
  ly_do: string;
}

export interface AIAnalysisRecord {
  month: string; // YYYY-MM
  healthScore: number;
  summary: string;
  warnings: string[];
  savingsTips: AISavingsTip[];
  projectedSurplus: number;
  allocation: AIAllocation[];
  nextSteps: string[];
  analyzedAt: number;
}

export interface PlannedExpense {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  cat: string;
  accountId?: string;
  isPaid: boolean;
  priority?: 'high' | 'medium' | 'low';
  note?: string;
  createdAt: number;
}

export interface AppData {
  version: string;
  profile: UserProfile;
  accounts: Account[];
  investments?: InvestmentHolding[];
  plannedExpenses?: PlannedExpense[];
  transactions: Transaction[];
  aiAnalysisHistory: Record<string, AIAnalysisRecord>;
  lastBackupDate?: string;
  dismissedSampleData?: boolean;
}

