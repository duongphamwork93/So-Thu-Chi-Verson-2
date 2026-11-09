import { AppData, CustomMerchantRule } from '../types';
import { DEFAULT_USER_PROFILE, DEFAULT_ACCOUNTS, DEFAULT_INVESTMENTS, STORAGE_KEY } from '../constants';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';

/**
 * Format number into Vietnamese currency format: 1.250.000 ₫
 */
export function formatVND(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 ₫';
  }
  const formatted = Math.round(amount).toLocaleString('vi-VN');
  return `${formatted} ₫`;
}

export const formatMoney = formatVND;

/**
 * Parse string with dots or commas into integer VND
 */
export function parseVND(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Parse decimal string supporting both dot and comma (e.g. "50.000.000", "50,000,000", "8,5" or "8.5")
 */
export function parseDecimal(str: string | number): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const s = str.toString().trim();
  if (!s) return 0;

  // Case 1: Multiple dots or commas, e.g. "50.000.000" or "50,000,000" -> integer VND
  const dotCount = (s.match(/\./g) || []).length;
  const commaCount = (s.match(/,/g) || []).length;
  if (dotCount > 1 || commaCount > 1) {
    return parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
  }

  // Case 2: One comma and one dot, e.g. "50.000,50" or "50,000.50"
  if (dotCount === 1 && commaCount === 1) {
    if (s.indexOf('.') < s.indexOf(',')) {
      // European / VN style: dot is thousands, comma is decimal -> 50.000,50
      return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    } else {
      // US style: comma is thousands, dot is decimal -> 50,000.50
      return parseFloat(s.replace(/,/g, '')) || 0;
    }
  }

  // Case 3: Exactly one dot or one comma, e.g. "8.5", "8,5", "50.000", "50,000"
  const sep = dotCount === 1 ? '.' : commaCount === 1 ? ',' : null;
  if (sep) {
    const parts = s.split(sep);
    // If the part after separator has exactly 3 digits and looks like thousands, e.g. "50.000" or "1.500"
    if (parts[1].length === 3 && parts[0].length >= 1) {
      return parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
    }
    // Otherwise treat as decimal fraction, e.g. "8.5", "8,5", "12,75", "0.25"
    return parseFloat(`${parts[0].replace(/[^\d]/g, '')}.${parts[1].replace(/[^\d]/g, '')}`) || 0;
  }

  return parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
}

/**
 * Parse fraction/quantity string (e.g. "12,5", "12.5", "150,75" or "0,25")
 */
export function parseFraction(str: string | number): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const s = str.toString().trim().replace(/,/g, '.');
  return parseFloat(s) || 0;
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Compress image to maximum side 1000px and JPEG quality 0.74 for blazing-fast mobile upload & AI recognition
 */
export async function compressImage(
  file: File,
  maxSide = 1000,
  quality = 0.74
): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    // 10-second timeout guard for mobile Safari memory safety
    const timer = setTimeout(() => {
      reject(new Error('Thời gian nén ảnh quá lâu. Vui lòng thử lại với ảnh nhỏ hơn.'));
    }, 10000);

    const reader = new FileReader();
    reader.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Không thể đọc file ảnh từ thiết bị'));
    };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Ảnh không hợp lệ hoặc bị lỗi'));
      };
      img.onload = () => {
        clearTimeout(timer);
        let width = img.width;
        let height = img.height;

        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể tạo canvas xử lý ảnh'));
          return;
        }

        // Fill white background for transparency in PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({ base64, mimeType, previewUrl: dataUrl });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Format date YYYY-MM-DD to friendly Vietnamese label
 */
export function formatVietnameseDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(year, month - 1, day);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today.getTime() - targetDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays === -1) return 'Ngày mai';

    const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday}, ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

/**
 * Intelligent regex fallback parser for quick Vietnamese text input
 */
export function parseQuickInputOffline(input: string): {
  type: 'out' | 'in';
  amount: number;
  date: string;
  cat: string;
  note: string;
} {
  const text = input.trim();
  const today = new Date();
  let targetDate = new Date();

  // Date parsing
  if (/hôm qua|hom qua/i.test(text)) {
    targetDate.setDate(today.getDate() - 1);
  } else if (/hôm kia|hom kia/i.test(text)) {
    targetDate.setDate(today.getDate() - 2);
  }

  const dateStr = targetDate.toISOString().slice(0, 10);

  // Amount parsing
  let amount = 0;
  // Match "25tr", "25 tr", "25 triệu", "2.5tr", "500k", "65k", "100.000", "100000"
  const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|nghìn|nghin|tr|triệu|trieu|củ|cu|đ|vnd)?(?:\b|$)/i);
  if (amountMatch) {
    const numPart = parseFloat(amountMatch[1].replace(',', '.'));
    const unit = (amountMatch[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'nghìn' || unit === 'nghin') {
      amount = Math.round(numPart * 1000);
    } else if (unit === 'tr' || unit === 'triệu' || unit === 'trieu' || unit === 'củ' || unit === 'cu') {
      amount = Math.round(numPart * 1000000);
    } else {
      if (numPart < 1000) {
        amount = Math.round(numPart * 1000); // assume 65 -> 65k
      } else {
        amount = Math.round(numPart);
      }
    }
  }

  // Type & category detection
  let type: 'out' | 'in' = 'out';
  let cat = 'an_uong';

  const lower = text.toLowerCase();
  if (/lương|luong/i.test(lower)) {
    type = 'in';
    cat = 'luong';
  } else if (/thưởng|thuong/i.test(lower)) {
    type = 'in';
    cat = 'thuong';
  } else if (/cổ tức|co tuc|lãi|lai/i.test(lower)) {
    type = 'in';
    cat = 'loi_dau_tu';
  } else if (/nhận tiền|thu vào|thu khác/i.test(lower)) {
    type = 'in';
    cat = 'thu_phu';
  } else if (/cà phê|ca phe|cafe|trà sữa|tra sua|highlands|phúc long|phuc long/i.test(lower)) {
    cat = 'cafe';
  } else if (/chợ|cho|siêu thị|sieu thi|coop|winmart|bách hoá/i.test(lower)) {
    cat = 'cho_sieu_thi';
  } else if (/xăng|xang|grab|be|xe|gửi xe|vé xe/i.test(lower)) {
    cat = 'di_lai';
  } else if (/tiền nhà|thuê nhà|điện|nước|internet|wifi/i.test(lower)) {
    cat = 'nha_o';
  } else if (/thuốc|bác sĩ|bệnh viện|khám|skincare|mỹ phẩm/i.test(lower)) {
    cat = 'suc_khoe';
  } else if (/học|sách|khoá học|học phí/i.test(lower)) {
    cat = 'giao_duc';
  } else if (/mua|shopee|lazada|tiki|quần áo|váy|son/i.test(lower)) {
    cat = 'mua_sam';
  } else if (/phim|du lịch|chơi|karaoke|vé xem/i.test(lower)) {
    cat = 'giai_tri';
  } else if (/cưới|tiệc|quà|sinh nhật|mừng/i.test(lower)) {
    cat = 'hieu_hi';
  } else if (/tiết kiệm|tiet kiem|gửi tk|đầu tư/i.test(lower)) {
    cat = 'tiet_kiem';
  }

  // Clean note
  let cleanNote = text
    .replace(/\b(hôm qua|hom qua|hôm nay|hom nay|hôm kia|hom kia)\b/gi, '')
    .trim();

  return {
    type,
    amount,
    date: dateStr,
    cat,
    note: cleanNote || (type === 'in' ? 'Thu nhập' : 'Khoản chi'),
  };
}

/**
 * Export transactions to CSV with UTF-8 BOM so Excel opens with proper Vietnamese
 */
export function exportToCSV(transactions: any[], fileName = 'SoThuChi_Export.csv') {
  const headers = ['ID', 'Ngày', 'Loại', 'Danh mục', 'Số tiền (VND)', 'Ghi chú', 'Nguồn', 'Tài khoản'];
  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.type === 'in' ? 'Thu' : t.type === 'transfer' ? 'Chuyển khoản' : 'Chi'}"`,
    `"${t.cat}"`,
    t.amount,
    `"${(t.note || '').replace(/"/g, '""')}"`,
    `"${t.source || 'nhập tay'}"`,
    `"${t.accountId || ''}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Load app data from localStorage with full fallback
 */
export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        version: '2.0',
        profile: DEFAULT_USER_PROFILE,
        accounts: DEFAULT_ACCOUNTS,
        investments: [],
        plannedExpenses: [],
        transactions: [],
        aiAnalysisHistory: {},
      };
    }
    const data = JSON.parse(raw);
    let loadedAccounts: any[] = Array.isArray(data.accounts) && data.accounts.length > 0 ? data.accounts : DEFAULT_ACCOUNTS;
    
    // Allow bank, cash, credit, and savings accounts
    loadedAccounts = loadedAccounts.filter(
      (a) => a.type === 'bank' || a.type === 'cash' || a.type === 'credit' || a.type === 'savings'
    );

    // Ensure HSBC card is present if not already added
    const hasHsbc = loadedAccounts.some(
      (a) => a.id === 'acc_hsbc' || (a.bankName && a.bankName.toLowerCase().includes('hsbc'))
    );
    if (!hasHsbc) {
      const hsbcDefault = DEFAULT_ACCOUNTS.find((a) => a.id === 'acc_hsbc');
      if (hsbcDefault) {
        loadedAccounts.push(hsbcDefault);
      }
    }

    return {
      version: data.version || '2.0',
      profile: { ...DEFAULT_USER_PROFILE, ...(data.profile || {}) },
      accounts: loadedAccounts,
      investments: Array.isArray(data.investments) ? data.investments : [],
      plannedExpenses: Array.isArray(data.plannedExpenses) ? data.plannedExpenses : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      aiAnalysisHistory: data.aiAnalysisHistory || {},
      lastBackupDate: data.lastBackupDate,
    };
  } catch (err) {
    console.error('Lỗi khi đọc localStorage:', err);
    return {
      version: '2.0',
      profile: DEFAULT_USER_PROFILE,
      accounts: DEFAULT_ACCOUNTS,
      investments: [],
      plannedExpenses: [],
      transactions: [],
      aiAnalysisHistory: {},
    };
  }
}

/**
 * Save app data to localStorage with try/catch
 */
export function saveAppData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu localStorage:', err);
    return false;
  }
}

/**
 * Determine default payment account based on merchant or description (Shopee, Grab, MoMo, etc.)
 * Supports custom merchant rules and preset defaults
 */
export function matchDefaultAccountForTransaction(
  text: string,
  defaultMerchantAccounts?: Record<string, string>,
  customMerchantRules?: CustomMerchantRule[]
): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();

  // 1. Check custom user-defined rules first
  if (customMerchantRules && customMerchantRules.length > 0) {
    for (const rule of customMerchantRules) {
      if (rule.enabled !== false && rule.keyword) {
        const kw = rule.keyword.toLowerCase().trim();
        if (kw && lower.includes(kw)) {
          return rule.accountId;
        }
      }
    }
  }

  // 2. Check built-in preset rules
  if (defaultMerchantAccounts) {
    if (lower.includes('shopee') || lower.includes('lazada') || lower.includes('tiki')) {
      return defaultMerchantAccounts['shopee'];
    }
    if (lower.includes('grab') || lower.includes('be ') || lower.includes('gojek') || lower.includes('xanh sm')) {
      return defaultMerchantAccounts['grab'];
    }
    if (lower.includes('momo')) {
      return defaultMerchantAccounts['momo'];
    }
    if (lower.includes('zalopay') || lower.includes('zalo pay')) {
      return defaultMerchantAccounts['zalopay'];
    }
    if (lower.includes('co.op') || lower.includes('coop') || lower.includes('winmart') || lower.includes('bach hoa') || lower.includes('bách hoá')) {
      return defaultMerchantAccounts['sieu_thi'];
    }
    if (lower.includes('lương') || lower.includes('luong')) {
      return defaultMerchantAccounts['luong'];
    }
    if (lower.includes('cafe') || lower.includes('cà phê') || lower.includes('highlands') || lower.includes('phúc long') || lower.includes('phuclong') || lower.includes('trà sữa')) {
      return defaultMerchantAccounts['an_uong'];
    }
  }

  return undefined;
}

/**
 * Get detailed matched rule info for display in UI
 */
export function getMerchantRuleMatchInfo(
  text: string,
  defaultMerchantAccounts?: Record<string, string>,
  customMerchantRules?: CustomMerchantRule[]
): { ruleLabel: string; accountId: string } | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (customMerchantRules && customMerchantRules.length > 0) {
    for (const rule of customMerchantRules) {
      if (rule.enabled !== false && rule.keyword) {
        const kw = rule.keyword.toLowerCase().trim();
        if (kw && lower.includes(kw)) {
          return { ruleLabel: rule.label, accountId: rule.accountId };
        }
      }
    }
  }

  if (defaultMerchantAccounts) {
    if (lower.includes('shopee') || lower.includes('lazada') || lower.includes('tiki')) {
      return { ruleLabel: 'Shopee (Mua sắm)', accountId: defaultMerchantAccounts['shopee'] };
    }
    if (lower.includes('grab') || lower.includes('be ') || lower.includes('gojek') || lower.includes('xanh sm')) {
      return { ruleLabel: 'Grab (Di chuyển & Ăn uống)', accountId: defaultMerchantAccounts['grab'] };
    }
    if (lower.includes('momo')) {
      return { ruleLabel: 'Ví điện tử MoMo', accountId: defaultMerchantAccounts['momo'] };
    }
    if (lower.includes('zalopay') || lower.includes('zalo pay')) {
      return { ruleLabel: 'Ví ZaloPay', accountId: defaultMerchantAccounts['zalopay'] };
    }
    if (lower.includes('co.op') || lower.includes('coop') || lower.includes('winmart') || lower.includes('bach hoa') || lower.includes('bách hoá')) {
      return { ruleLabel: 'Siêu thị & Chợ', accountId: defaultMerchantAccounts['sieu_thi'] };
    }
    if (lower.includes('lương') || lower.includes('luong')) {
      return { ruleLabel: 'Nhận Lương', accountId: defaultMerchantAccounts['luong'] };
    }
    if (lower.includes('cafe') || lower.includes('cà phê') || lower.includes('highlands') || lower.includes('phúc long') || lower.includes('phuclong') || lower.includes('trà sữa')) {
      return { ruleLabel: 'Cà phê & Ăn uống', accountId: defaultMerchantAccounts['an_uong'] };
    }
  }

  return null;
}

