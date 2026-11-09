import React from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, SlidersHorizontal } from 'lucide-react';
import { UserProfile } from '../types';
import { TabKey } from './Navbar';

interface HeaderProps {
  currentTab: TabKey;
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  profile: UserProfile;
  onToggleHideBalances: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  profile,
  onToggleHideBalances,
  onOpenSettings,
}) => {
  // Title matching user's requested layout
  const getTabTitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Tổng quan';
      case 'transactions':
        return 'Sổ giao dịch';
      case 'accounts':
        return 'Tài sản';
      case 'ai':
        return 'Trợ lý AI';
      case 'settings':
        return 'Cài đặt';
      default:
        return 'Tổng quan';
    }
  };

  const showMonthNavigator = currentTab === 'overview' || currentTab === 'transactions';

  return (
    <div className="w-full bg-[#FFF7F8] dark:bg-[#150f24] pt-3 pb-2 px-4 sm:px-6 max-w-5xl mx-auto transition-colors">
      {/* 1. Main Header Title Bar */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
          {getTabTitle()}
        </h1>

        {/* Right Action Icons: Eye Toggle & Settings Sliders */}
        <div className="flex items-center gap-2">
          {/* Eye Hide/Show Balance Button */}
          <button
            type="button"
            onClick={onToggleHideBalances}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-200/80 bg-white/90 text-slate-600 shadow-2xs hover:bg-pink-50 hover:text-pink-600 active:scale-95 transition-all dark:border-purple-900/50 dark:bg-[#231c35] dark:text-purple-300"
            title={profile.hideBalances ? 'Hiển thị số tiền' : 'Ẩn số tiền'}
            aria-label="Ẩn hiện số dư"
          >
            {profile.hideBalances ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>

          {/* Settings / Filters Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-200/80 bg-white/90 text-slate-600 shadow-2xs hover:bg-pink-50 hover:text-pink-600 active:scale-95 transition-all dark:border-purple-900/50 dark:bg-[#231c35] dark:text-purple-300"
            title="Cài đặt & Tuỳ chỉnh"
            aria-label="Cài đặt"
          >
            <SlidersHorizontal size={19} />
          </button>
        </div>
      </div>

      {/* 2. Month Navigator Card (Shown on Overview & Transactions tabs, exactly as in screenshots) */}
      {showMonthNavigator && (
        <div className="mt-3">
          <div className="flex items-center justify-between rounded-2xl border border-pink-200/70 bg-white/95 px-4 py-2.5 shadow-2xs dark:border-purple-900/40 dark:bg-[#231c35]">
            <button
              type="button"
              onClick={onPrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 active:scale-90 transition-all dark:text-purple-300"
              aria-label="Tháng trước"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="font-heading text-sm sm:text-base font-bold text-slate-800 dark:text-purple-100 tabular-nums">
              Tháng {String(currentMonth).padStart(2, '0')}/{currentYear}
            </span>

            <button
              type="button"
              onClick={onNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 active:scale-90 transition-all dark:text-purple-300"
              aria-label="Tháng sau"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
