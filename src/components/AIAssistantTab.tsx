import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  PieChart,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Coins,
  Smile,
} from 'lucide-react';
import { AIAnalysisRecord, Transaction, UserProfile } from '../types';
import { analyzeFinancesWithAI } from '../services/aiApi';
import { formatVND } from '../utils';

interface AIAssistantTabProps {
  currentYear: number;
  currentMonth: number;
  transactions: Transaction[];
  profile: UserProfile;
  historyAnalysis?: AIAnalysisRecord;
  onSaveAnalysis: (record: AIAnalysisRecord) => void;
  isSampleData?: boolean;
}

export const AIAssistantTab: React.FC<AIAssistantTabProps> = ({
  currentYear,
  currentMonth,
  transactions,
  profile,
  historyAnalysis,
  onSaveAnalysis,
  isSampleData,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentAnalysis = historyAnalysis;

  // Run analysis function
  const handleAnalyze = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Gather 3 months summary
      const threeMonthsData: Record<string, any> = {};
      for (let offset = 0; offset < 3; offset++) {
        let m = currentMonth - offset;
        let y = currentYear;
        if (m <= 0) {
          m += 12;
          y -= 1;
        }
        const key = `${y}-${String(m).padStart(2, '0')}`;
        const txs = transactions.filter((t) => t.date.startsWith(key));
        const inc = txs.filter((t) => t.type === 'in').reduce((s, t) => s + t.amount, 0);
        const exp = txs.filter((t) => t.type === 'out').reduce((s, t) => s + t.amount, 0);
        threeMonthsData[key] = { totalIncome: inc, totalExpense: exp, count: txs.length };
      }

      // 2. Largest 40 expenses of current month
      const currentMonthTxs = transactions.filter(
        (t) => t.date.startsWith(monthKey) && t.type === 'out'
      );
      const largestExpenses = [...currentMonthTxs]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 40)
        .map((t) => ({ amount: t.amount, cat: t.cat, note: t.note, date: t.date }));

      const result = await analyzeFinancesWithAI({
        monthlyBudget: profile.monthlyBudget || 15000000,
        financialGoal: profile.financialGoal || 'Tích lũy tài sản và đầu tư dài hạn',
        riskAppetite:
          profile.riskAppetite === 'high'
            ? 'Cao'
            : profile.riskAppetite === 'low'
            ? 'Thấp'
            : 'Trung bình',
        threeMonthsData,
        largestExpenses,
        isSampleData,
      });

      onSaveAnalysis(result);
    } catch (err: any) {
      console.error('Lỗi khi phân tích:', err);
      setErrorMessage(err.message || 'Không thể kết nối dịch vụ AI. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for health score label & color
  const getScoreInfo = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Tốt & Ổn định',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        ring: '#10B981',
      };
    }
    if (score >= 60) {
      return {
        label: 'Cần cải thiện',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        ring: '#F59E0B',
      };
    }
    return {
      label: 'Đáng lo ngại',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      ring: '#EF4444',
    };
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Action Card */}
      <div className="rounded-3xl border border-pink-100/90 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 p-5 shadow-xs dark:border-purple-900/40 dark:from-[#2a1e3e] dark:to-[#221735]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-md shadow-pink-200 dark:shadow-none">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-gray-800 dark:text-purple-100">
                Cố Vấn Tài Chính AI Gemini
              </h3>
              <p className="text-xs text-gray-500 dark:text-purple-300/80">
                Đánh giá sức khỏe tài chính tháng {currentMonth}/{currentYear} & gợi ý phân bổ tiền dư
              </p>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-pink-200/80 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 dark:shadow-none"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>AI đang đọc sổ…</span>
              </>
            ) : currentAnalysis ? (
              <>
                <RefreshCw size={16} />
                <span>Phân tích lại tháng này</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Phân tích tháng này</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-xl bg-rose-100/80 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 rounded-3xl bg-pink-100/60 dark:bg-purple-900/30"></div>
          <div className="h-28 rounded-3xl bg-pink-100/60 dark:bg-purple-900/30"></div>
          <div className="h-36 rounded-3xl bg-pink-100/60 dark:bg-purple-900/30"></div>
        </div>
      )}

      {/* Analysis Results */}
      {!isLoading && currentAnalysis && (
        <div className="space-y-5">
          {/* 1. Health Score Card */}
          {(() => {
            const scoreInfo = getScoreInfo(currentAnalysis.healthScore);
            return (
              <div className="rounded-3xl border border-pink-100/90 bg-white p-5 sm:p-6 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Score circle */}
                  <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full shadow-inner">
                    <div
                      className="absolute inset-0 rounded-full transition-all duration-700"
                      style={{
                        background: `conic-gradient(${scoreInfo.ring} 0% ${currentAnalysis.healthScore}%, #F3E8FF ${currentAnalysis.healthScore}% 100%)`,
                      }}
                    ></div>
                    <div className="relative flex h-22 w-22 flex-col items-center justify-center rounded-full bg-white dark:bg-[#231c35] text-center">
                      <span className="font-heading text-2xl font-black tabular-nums text-gray-800 dark:text-purple-100">
                        {currentAnalysis.healthScore}
                      </span>
                      <span className="text-[10px] text-gray-400">/ 100 điểm</span>
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${scoreInfo.ring}20`, color: scoreInfo.ring }}>
                      <span>Sức khoẻ tài chính:</span>
                      <span>{scoreInfo.label}</span>
                    </div>

                    <p className="mt-2 text-xs sm:text-sm text-gray-700 dark:text-purple-200 leading-relaxed">
                      {currentAnalysis.summary}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. Cần Chú Ý (Warnings & Leakages) */}
          {currentAnalysis.warnings && currentAnalysis.warnings.length > 0 && (
            <div className="rounded-3xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Các khoản cần chú ý & rò rỉ chi tiêu</span>
              </div>
              <ul className="space-y-2 text-xs text-amber-900/90 dark:text-amber-200/90">
                {currentAnalysis.warnings.map((warn, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Gợi Ý Tiết Kiệm (Savings Tips with +X/month badges) */}
          {currentAnalysis.savingsTips && currentAnalysis.savingsTips.length > 0 && (
            <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-600 dark:bg-purple-900/50 dark:text-purple-300">
                  <Lightbulb size={16} />
                </div>
                <h4 className="font-heading text-sm sm:text-base font-bold text-gray-800 dark:text-purple-100">
                  Gợi Ý Tiết Kiệm Thực Tế Mỗi Tháng
                </h4>
              </div>

              <div className="space-y-3">
                {currentAnalysis.savingsTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-pink-100/80 bg-pink-50/40 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/20"
                  >
                    <div>
                      <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-purple-100">
                        {tip.tieu_de}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-purple-300/80 mt-0.5">
                        {tip.chi_tiet}
                      </p>
                    </div>

                    {tip.tiet_kiem_thang > 0 && (
                      <span className="shrink-0 self-start sm:self-center rounded-full bg-emerald-100 px-3 py-1 font-heading text-xs font-bold tabular-nums text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        +{formatVND(tip.tiet_kiem_thang)}/tháng
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Đề Xuất Phân Bổ Tiền Dư (Multi-color bar + Channel explanations) */}
          {currentAnalysis.allocation && currentAnalysis.allocation.length > 0 && (
            <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                    <Coins size={16} />
                  </div>
                  <h4 className="font-heading text-sm sm:text-base font-bold text-gray-800 dark:text-purple-100">
                    Đề Xuất Phân Bổ Tiền Dư Hằng Tháng
                  </h4>
                </div>

                {currentAnalysis.projectedSurplus > 0 && (
                  <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                    Dự kiến dư: {formatVND(currentAnalysis.projectedSurplus)}
                  </span>
                )}
              </div>

              {/* Multi-color Allocation Progress Bar */}
              {(() => {
                const colors = ['#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6'];
                return (
                  <div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-purple-950">
                      {currentAnalysis.allocation.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: `${item.ty_le}%`,
                            backgroundColor: colors[idx % colors.length],
                          }}
                          title={`${item.kenh}: ${item.ty_le}%`}
                          className="h-full transition-all"
                        ></div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {currentAnalysis.allocation.map((item, idx) => {
                        const channelColor = colors[idx % colors.length];
                        const channelAmount = Math.round(
                          (currentAnalysis.projectedSurplus * item.ty_le) / 100
                        );
                        return (
                          <div
                            key={idx}
                            className="rounded-2xl border border-pink-50 p-3 bg-pink-50/20 dark:border-purple-900/40 dark:bg-purple-950/20"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: channelColor }}
                                ></span>
                                <span className="font-semibold text-gray-800 dark:text-purple-100">
                                  {item.kenh}
                                </span>
                              </div>
                              <span
                                className="font-heading font-bold tabular-nums"
                                style={{ color: channelColor }}
                              >
                                {item.ty_le}%
                              </span>
                            </div>

                            {channelAmount > 0 && (
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-purple-200 tabular-nums">
                                ≈ {formatVND(channelAmount)}
                              </p>
                            )}
                            <p className="text-[11px] text-gray-500 dark:text-purple-300/70 mt-1 leading-normal">
                              {item.ly_do}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 5. Các Bước Tiếp Theo */}
          {currentAnalysis.nextSteps && currentAnalysis.nextSteps.length > 0 && (
            <div className="rounded-3xl border border-pink-100/90 bg-white p-5 shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
              <h4 className="font-heading text-sm font-bold text-gray-800 dark:text-purple-100 mb-3">
                Kế Hoạch Hành Động Tiếp Theo
              </h4>
              <div className="space-y-2">
                {currentAnalysis.nextSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-purple-200">
                    <CheckCircle2 size={16} className="text-pink-500 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer (Mandatory) */}
          <div className="rounded-2xl bg-gray-50 p-3.5 text-center text-[11px] text-gray-400 dark:bg-purple-950/30 dark:text-purple-400">
            Gợi ý do AI tạo, chỉ mang tính tham khảo, không phải tư vấn đầu tư được cấp phép.
          </div>
        </div>
      )}

      {/* Empty State when no analysis yet */}
      {!isLoading && !currentAnalysis && (
        <div className="rounded-3xl border border-pink-100/80 bg-white p-10 text-center shadow-xs dark:border-purple-900/40 dark:bg-[#231c35]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300 mb-3">
            <Sparkles size={28} />
          </div>
          <h4 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100">
            Chưa có báo cáo phân tích cho tháng {currentMonth}/{currentYear}
          </h4>
          <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
            Bấm nút &quot;Phân tích tháng này&quot; bên trên để AI tính điểm sức khoẻ tài chính, lọc chi tiêu lãng phí và đưa ra lộ trình tích lũy nhé!
          </p>
        </div>
      )}
    </div>
  );
};
