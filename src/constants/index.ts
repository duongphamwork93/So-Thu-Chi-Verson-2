import { Account, CategoryInfo, InvestmentHolding, Transaction, UserProfile } from '../types';

export const STORAGE_KEY = 'sothuchi.v1';

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { key: 'an_uong', name: 'Ăn uống', group: 'need', iconName: 'Utensils', color: '#F43F5E', bgColor: '#FFE4E6' },
  { key: 'cho_sieu_thi', name: 'Chợ, siêu thị', group: 'need', iconName: 'ShoppingCart', color: '#10B981', bgColor: '#D1FAE5' },
  { key: 'di_lai', name: 'Đi lại, xăng xe', group: 'need', iconName: 'Car', color: '#0EA5E9', bgColor: '#E0F2FE' },
  { key: 'nha_o', name: 'Nhà ở, điện nước', group: 'need', iconName: 'Home', color: '#F97316', bgColor: '#FFEDD5' },
  { key: 'suc_khoe', name: 'Sức khoẻ, bảo hiểm', group: 'need', iconName: 'HeartPulse', color: '#EC4899', bgColor: '#FCE7F3' },
  { key: 'giao_duc', name: 'Học tập, con cái', group: 'need', iconName: 'GraduationCap', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { key: 'cafe', name: 'Cà phê, trà sữa', group: 'want', iconName: 'Coffee', color: '#D97706', bgColor: '#FEF3C7' },
  { key: 'mua_sam', name: 'Mua sắm', group: 'want', iconName: 'ShoppingBag', color: '#DB2777', bgColor: '#FCE7F3' },
  { key: 'giai_tri', name: 'Giải trí, du lịch', group: 'want', iconName: 'Plane', color: '#A855F7', bgColor: '#F3E8FF' },
  { key: 'hieu_hi', name: 'Hiếu hỉ, quà tặng', group: 'want', iconName: 'Gift', color: '#E11D48', bgColor: '#FFE4E6' },
  { key: 'tiet_kiem', name: 'Tiết kiệm, đầu tư', group: 'save', iconName: 'PiggyBank', color: '#6366F1', bgColor: '#EEF2FF' },
  { key: 'khac', name: 'Chi khác', group: 'want', iconName: 'Sparkles', color: '#64748B', bgColor: '#F1F5F9' },
];

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { key: 'luong', name: 'Lương', group: 'income', iconName: 'Banknote', color: '#059669', bgColor: '#D1FAE5' },
  { key: 'thuong', name: 'Thưởng', group: 'income', iconName: 'Trophy', color: '#D97706', bgColor: '#FEF3C7' },
  { key: 'thu_phu', name: 'Thu nhập phụ', group: 'income', iconName: 'Briefcase', color: '#0D9488', bgColor: '#CCFBF1' },
  { key: 'loi_dau_tu', name: 'Lãi, cổ tức', group: 'income', iconName: 'TrendingUp', color: '#7C3AED', bgColor: '#EDE9FE' },
  { key: 'thu_khac', name: 'Thu khác', group: 'income', iconName: 'Coins', color: '#0284C7', bgColor: '#E0F2FE' },
];

export const ALL_CATEGORIES: CategoryInfo[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const CATEGORY_MAP: Record<string, CategoryInfo> = ALL_CATEGORIES.reduce((acc, cat) => {
  acc[cat.key] = cat;
  return acc;
}, {} as Record<string, CategoryInfo>);

export const VIETNAMESE_BANKS = [
  { name: 'Vietcombank', code: 'VCB', color: '#008542', logo: 'VCB' },
  { name: 'Techcombank', code: 'TCB', color: '#ED1C24', logo: 'TCB' },
  { name: 'MB Bank', code: 'MB', color: '#1B3C87', logo: 'MB' },
  { name: 'HSBC Việt Nam', code: 'HSBC', color: '#DB0011', logo: 'HSBC' },
  { name: 'VPBank', code: 'VPB', color: '#009743', logo: 'VPB' },
  { name: 'ACB', code: 'ACB', color: '#005CA9', logo: 'ACB' },
  { name: 'TPBank', code: 'TPB', color: '#772B8B', logo: 'TPB' },
  { name: 'BIDV', code: 'BIDV', color: '#006B68', logo: 'BIDV' },
  { name: 'Agribank', code: 'VBA', color: '#881F23', logo: 'VBA' },
  { name: 'Sacombank', code: 'STB', color: '#0054A6', logo: 'STB' },
  { name: 'VIB', code: 'VIB', color: '#0066B3', logo: 'VIB' },
  { name: 'MSB', code: 'MSB', color: '#EA580C', logo: 'MSB' },
  { name: 'HDBank', code: 'HDB', color: '#DC2626', logo: 'HDB' },
  { name: 'Timo Digital Bank', code: 'TIMO', color: '#7C3AED', logo: 'TIMO' },
  { name: 'Cake by VPBank', code: 'CAKE', color: '#EC4899', logo: 'CAKE' },
  { name: 'MoMo', code: 'MOMO', color: '#A50064', logo: 'MOMO' },
  { name: 'ZaloPay', code: 'ZLP', color: '#0068FF', logo: 'ZLP' },
  { name: 'Viettel Money', code: 'VTL', color: '#E11D48', logo: 'VTL' },
  { name: 'Tiền mặt trong ví', code: 'CASH', color: '#F43F5E', logo: 'CASH' },
];

export const POPULAR_STOCKS = [
  { symbol: 'FPT', name: 'Tập đoàn FPT', price: 138000 },
  { symbol: 'HPG', name: 'Tập đoàn Hoà Phát', price: 28500 },
  { symbol: 'MWG', name: 'Thế Giới Di Động', price: 65000 },
  { symbol: 'TCB', name: 'Techcombank', price: 24500 },
  { symbol: 'MBB', name: 'Ngân hàng Quân Đội', price: 25200 },
  { symbol: 'VNM', name: 'Vinamilk', price: 67000 },
  { symbol: 'PNJ', name: 'Vàng Bạc Đá Quý Phú Nhuận', price: 98000 },
  { symbol: 'SSI', name: 'Chứng khoán SSI', price: 34000 },
];

export const POPULAR_FUNDS = [
  { symbol: 'VESAF', name: 'Quỹ Cổ Phiếu VinaCapital', price: 27800 },
  { symbol: 'DCDS', name: 'Quỹ Năng Động Dragon Capital', price: 79500 },
  { symbol: 'VEOF', name: 'Quỹ Đầu Tư Cơ Hội VinaCapital', price: 29400 },
  { symbol: 'E1VFVN30', name: 'Quỹ ETF VN30 Dragon Capital', price: 26100 },
  { symbol: 'FUEVFVND', name: 'Quỹ ETF VN Diamond', price: 31200 },
];

export const POPULAR_GOLD = [
  { symbol: 'VANG_9999', name: 'Vàng nhẫn trơn 9999 (chỉ)', price: 8650000, unit: 'chỉ' },
  { symbol: 'VANG_SJC', name: 'Vàng miếng SJC (lượng)', price: 88500000, unit: 'lượng' },
];

export const PASTEL_THEMES = [
  {
    id: 'sakura',
    name: 'Hồng Sakura',
    emoji: '🌸',
    gradient: 'from-pink-500 via-rose-400 to-purple-500',
    cardGradient: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 50%, #E11D48 100%)',
    bg: '#FFF7F8',
    primary: '#EC4899',
  },
  {
    id: 'lavender',
    name: 'Tím Lavender',
    emoji: '💜',
    gradient: 'from-purple-600 via-indigo-500 to-pink-500',
    cardGradient: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #C026D3 100%)',
    bg: '#FAF5FF',
    primary: '#8B5CF6',
  },
  {
    id: 'mint',
    name: 'Xanh Bạc Hà',
    emoji: '🌿',
    gradient: 'from-teal-500 via-emerald-400 to-cyan-500',
    cardGradient: 'linear-gradient(135deg, #0F766E 0%, #059669 50%, #0284C7 100%)',
    bg: '#F0FDF4',
    primary: '#10B981',
  },
  {
    id: 'peach',
    name: 'Cam Đào Sunset',
    emoji: '🍑',
    gradient: 'from-amber-500 via-orange-400 to-rose-400',
    cardGradient: 'linear-gradient(135deg, #C2410C 0%, #EA580C 50%, #E11D48 100%)',
    bg: '#FFF7ED',
    primary: '#F97316',
  },
];

export const AVATAR_OPTIONS = [
  { id: 'bunny', label: 'Thỏ Con', icon: '🐰' },
  { id: 'cat', label: 'Mèo Lười', icon: '🐱' },
  { id: 'strawberry', label: 'Dâu Tây', icon: '🍓' },
  { id: 'bear', label: 'Gấu Bông', icon: '🐻' },
  { id: 'crown', label: 'Công Chúa', icon: '👑' },
  { id: 'sparkles', label: 'Ngôi Sao', icon: '✨' },
  { id: 'cherry', label: 'Cherry', icon: '🍒' },
  { id: 'tulip', label: 'Hoa Tulip', icon: '🌷' },
  { id: 'butterfly', label: 'Bướm Xinh', icon: '🦋' },
  { id: 'ribbon', label: 'Nơ Hồng', icon: '🎀' },
];

export const DEFAULT_MERCHANT_RULES = [
  { key: 'shopee', label: 'Shopee (Mua sắm online)', icon: '🛍️', defaultCat: 'mua_sam', suggestedAcc: 'acc_credit', reason: 'Thanh toán qua Thẻ Visa hoàn tiền 6%' },
  { key: 'grab', label: 'Grab (GrabFood, GrabCar, Be)', icon: '🚗', defaultCat: 'an_uong', suggestedAcc: 'acc_credit', reason: 'Thanh toán qua Ví điện tử hoặc Thẻ Visa' },
  { key: 'momo', label: 'Ví điện tử MoMo', icon: '📱', defaultCat: 'khac', suggestedAcc: 'acc_vcb', reason: 'Tài khoản ngân hàng liên kết Ví MoMo' },
  { key: 'zalopay', label: 'Ví điện tử ZaloPay', icon: '💳', defaultCat: 'khac', suggestedAcc: 'acc_vcb', reason: 'Nạp ví điện tử ZaloPay' },
  { key: 'sieu_thi', label: 'Co.opmart / WinMart / Bách Hoá', icon: '🛒', defaultCat: 'cho_sieu_thi', suggestedAcc: 'acc_credit', reason: 'Tích điểm & hoàn tiền siêu thị' },
  { key: 'an_uong', label: 'Cà phê & Ăn uống văn phòng', icon: '☕', defaultCat: 'cafe', suggestedAcc: 'acc_vcb', reason: 'Quét mã VietQR hoặc tiền mặt' },
  { key: 'luong', label: 'Lương & Thu nhập chính', icon: '💵', defaultCat: 'luong', suggestedAcc: 'acc_vcb', reason: 'Tài khoản ngân hàng nhận lương' },
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Bé Yêu',
  avatar: 'bunny',
  hideBalances: false,
  monthlyBudget: 15000000,
  financialGoal: 'Tiết kiệm 50 triệu và đầu tư quỹ mở đều đặn',
  riskAppetite: 'medium',
  theme: 'system',
  pastelTheme: 'sakura',
  customGreeting: 'Chào buổi sáng, nàng thơ của tài chính ✨',
  autoApplyDefaultAccounts: true,
  defaultMerchantAccounts: {
    shopee: 'acc_credit',
    grab: 'acc_credit',
    momo: 'acc_vcb',
    zalopay: 'acc_vcb',
    sieu_thi: 'acc_credit',
    an_uong: 'acc_vcb',
    luong: 'acc_vcb',
  },
  customMerchantRules: [],
};

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_vcb',
    name: 'Vietcombank Tiêu Dùng',
    type: 'bank',
    bankName: 'Vietcombank',
    balance: 0,
    color: '#008542',
    icon: 'Landmark',
    accountNumber: '9988***123',
  },
  {
    id: 'acc_cash',
    name: 'Tiền mặt trong ví',
    type: 'cash',
    bankName: 'Tiền mặt',
    balance: 0,
    color: '#EC4899',
    icon: 'Wallet',
  },
  {
    id: 'acc_hsbc',
    name: 'Thẻ HSBC Visa Platinum',
    type: 'credit',
    bankName: 'HSBC',
    balance: 0,
    creditLimit: 50000000,
    creditBalance: 0,
    creditStatementDay: 25,
    creditDueDay: 15,
    creditCardCashback: 8,
    cardNetwork: 'visa',
    cardGradient: 'from-red-600 via-rose-600 to-slate-900',
    color: '#DB0011',
    icon: 'CreditCard',
    accountNumber: '4111****5678',
  },
  {
    id: 'acc_credit',
    name: 'Thẻ VPBank StepUp',
    type: 'credit',
    bankName: 'VPBank',
    balance: 0,
    creditLimit: 30000000,
    creditBalance: 0,
    creditStatementDay: 20,
    creditDueDay: 5,
    creditCardCashback: 6,
    cardNetwork: 'visa',
    cardGradient: 'from-emerald-600 via-teal-600 to-indigo-900',
    color: '#009743',
    icon: 'CreditCard',
    accountNumber: '5285****7890',
  },
];

export const DEFAULT_INVESTMENTS: InvestmentHolding[] = [];

// Helper to get sample transactions (returns empty array for clean zero-slate ledger)
export const getSampleTransactions = (_year: number, _month: number): Transaction[] => [];

