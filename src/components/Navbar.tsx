import React from 'react';
import {
  Home,
  ListTodo,
  Plus,
  Sparkles,
  Landmark,
} from 'lucide-react';

export type TabKey = 'overview' | 'transactions' | 'accounts' | 'ai' | 'settings';

interface NavbarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenAddModal: () => void;
  unreadAITipsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  unreadAITipsCount,
}) => {
  return (
    <>
      {/* Mobile Bottom Tab Bar (matching screenshot layout) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 block border-t border-pink-100/90 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_25px_rgba(225,29,72,0.06)] backdrop-blur-xl dark:border-purple-900/50 dark:bg-[#1a1428]/95 md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {/* 1. Tổng quan */}
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 ${
              currentTab === 'overview'
                ? 'font-bold text-[#DE3B68] dark:text-pink-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-purple-300/60'
            }`}
          >
            <div className="flex h-6 w-6 items-center justify-center">
              <Home size={22} strokeWidth={currentTab === 'overview' ? 2.5 : 1.8} />
            </div>
            <span className="text-[11px] mt-0.5">Tổng quan</span>
          </button>

          {/* 2. Sổ giao dịch */}
          <button
            type="button"
            onClick={() => onSelectTab('transactions')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 ${
              currentTab === 'transactions'
                ? 'font-bold text-[#DE3B68] dark:text-pink-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-purple-300/60'
            }`}
          >
            <div className="flex h-6 w-6 items-center justify-center">
              <ListTodo size={22} strokeWidth={currentTab === 'transactions' ? 2.5 : 1.8} />
            </div>
            <span className="text-[11px] mt-0.5">Sổ</span>
          </button>

          {/* 3. Center Floating '+' Button */}
          <div className="relative flex flex-1 items-center justify-center -top-3">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-[#DE3B68] to-[#EA618D] text-white shadow-[0_6px_20px_rgba(222,59,104,0.45)] ring-4 ring-white dark:ring-[#1a1428] active:scale-90 transition-all cursor-pointer"
              aria-label="Thêm thu chi mới"
            >
              <Plus size={28} strokeWidth={2.8} />
            </button>
          </div>

          {/* 4. Trợ lý AI */}
          <button
            type="button"
            onClick={() => onSelectTab('ai')}
            className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 ${
              currentTab === 'ai'
                ? 'font-bold text-[#DE3B68] dark:text-pink-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-purple-300/60'
            }`}
          >
            <div className="flex h-6 w-6 items-center justify-center">
              <Sparkles size={22} strokeWidth={currentTab === 'ai' ? 2.5 : 1.8} />
            </div>
            <span className="text-[11px] mt-0.5">Trợ lý AI</span>
            {unreadAITipsCount && unreadAITipsCount > 0 ? (
              <span className="absolute top-1 right-3 flex h-2 w-2 rounded-full bg-[#DE3B68]"></span>
            ) : null}
          </button>

          {/* 5. Tài sản */}
          <button
            type="button"
            onClick={() => onSelectTab('accounts')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 ${
              currentTab === 'accounts'
                ? 'font-bold text-[#DE3B68] dark:text-pink-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-purple-300/60'
            }`}
          >
            <div className="flex h-6 w-6 items-center justify-center">
              <Landmark size={22} strokeWidth={currentTab === 'accounts' ? 2.5 : 1.8} />
            </div>
            <span className="text-[11px] mt-0.5">Tài sản</span>
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar (Left Navigation) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:border-r md:border-pink-100/90 md:bg-white/90 md:backdrop-blur-md md:p-5 md:dark:border-purple-900/50 md:dark:bg-[#1a1428]/95 z-20">
        <div className="flex items-center gap-3 px-2 py-4 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#DE3B68] to-[#EA618D] text-white shadow-md shadow-pink-500/30">
            <Landmark size={22} />
          </div>
          <div>
            <h2 className="font-heading font-black text-lg text-slate-800 dark:text-white">
              Sổ Thu Chi
            </h2>
            <p className="text-[11px] text-slate-400">Quản lý tài chính cá nhân</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
              currentTab === 'overview'
                ? 'bg-pink-50 text-[#DE3B68] shadow-xs dark:bg-purple-950/60 dark:text-pink-300'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-purple-900/20'
            }`}
          >
            <Home size={19} />
            <span>Tổng quan</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('transactions')}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
              currentTab === 'transactions'
                ? 'bg-pink-50 text-[#DE3B68] shadow-xs dark:bg-purple-950/60 dark:text-pink-300'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-purple-900/20'
            }`}
          >
            <ListTodo size={19} />
            <span>Sổ giao dịch</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('accounts')}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
              currentTab === 'accounts'
                ? 'bg-pink-50 text-[#DE3B68] shadow-xs dark:bg-purple-950/60 dark:text-pink-300'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-purple-900/20'
            }`}
          >
            <Landmark size={19} />
            <span>Tài sản & Khoản nợ</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('ai')}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
              currentTab === 'ai'
                ? 'bg-pink-50 text-[#DE3B68] shadow-xs dark:bg-purple-950/60 dark:text-pink-300'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-purple-900/20'
            }`}
          >
            <Sparkles size={19} />
            <span>Trợ lý AI</span>
          </button>
        </nav>

        <div className="pt-4 border-t border-slate-100 dark:border-purple-900/40">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#DE3B68] to-[#EA618D] py-3 text-sm font-bold text-white shadow-md shadow-pink-500/25 active:scale-95 transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>+ Ghi khoản mới</span>
          </button>
        </div>
      </aside>
    </>
  );
};
