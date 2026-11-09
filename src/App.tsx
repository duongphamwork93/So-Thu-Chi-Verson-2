/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppData,
  Transaction,
  Account,
  InvestmentHolding,
  UserProfile,
  AIAnalysisRecord,
  PlannedExpense,
} from './types';
import { loadAppData, saveAppData, formatVND } from './utils';
import { Header } from './components/Header';
import { Navbar, TabKey } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { TransactionsTab } from './components/TransactionsTab';
import { AccountsTab } from './components/AccountsTab';
import { AIAssistantTab } from './components/AIAssistantTab';
import { SettingsTab } from './components/SettingsTab';
import { AddTransactionModal } from './components/AddTransactionModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { CategoryBudgetModal } from './components/CategoryBudgetModal';
import { PlannedExpenseModal } from './components/PlannedExpenseModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // App data state
  const [appData, setAppData] = useState<AppData>(() => loadAppData());

  // Date navigation
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1);

  // Active Tab
  const [currentTab, setCurrentTab] = useState<TabKey>('overview');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'single' | 'batch' | 'transfer'>('single');
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);

  // Advanced Feature Modals
  const [isCategoryBudgetOpen, setIsCategoryBudgetOpen] = useState(false);
  const [isPlannedExpenseOpen, setIsPlannedExpenseOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to localStorage whenever appData updates
  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  // Real transactions only
  const activeTransactions = appData.transactions;

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Switch month directly to a transaction's month
  const jumpToTransactionMonth = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y) && !isNaN(m)) {
          setCurrentYear(y);
          setCurrentMonth(m);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add a single transaction
  const handleAddTransaction = (newTx: Transaction) => {
    let updatedAccounts = [...appData.accounts];
    if (newTx.type === 'out') {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === newTx.accountId) {
          if (acc.type === 'credit') {
            return { ...acc, creditBalance: (acc.creditBalance || 0) + newTx.amount };
          }
          return { ...acc, balance: acc.balance - newTx.amount };
        }
        return acc;
      });
    } else if (newTx.type === 'in') {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === newTx.accountId) {
          return { ...acc, balance: acc.balance + newTx.amount };
        }
        return acc;
      });
    } else if (newTx.type === 'transfer') {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === newTx.accountId) {
          if (acc.type === 'credit') {
            return { ...acc, creditBalance: (acc.creditBalance || 0) + newTx.amount };
          }
          return { ...acc, balance: acc.balance - newTx.amount };
        }
        if (acc.id === newTx.toAccountId) {
          if (acc.type === 'credit') {
            return {
              ...acc,
              creditBalance: Math.max(0, (acc.creditBalance || 0) - newTx.amount),
            };
          }
          return { ...acc, balance: acc.balance + newTx.amount };
        }
        return acc;
      });
    }

    setAppData((prev) => ({
      ...prev,
      accounts: updatedAccounts,
      transactions: [newTx, ...prev.transactions],
    }));

    jumpToTransactionMonth(newTx.date);
    showToast(`Đã lưu giao dịch ${formatVND(newTx.amount)} thành công!`);
  };

  // Add multiple transactions (batch scan / statement import)
  const handleAddMultipleTransactions = (newTxs: Transaction[]) => {
    if (newTxs.length === 0) return;

    let updatedAccounts = [...appData.accounts];

    newTxs.forEach((tx) => {
      if (tx.type === 'out') {
        updatedAccounts = updatedAccounts.map((acc) => {
          if (acc.id === tx.accountId) {
            if (acc.type === 'credit') {
              return { ...acc, creditBalance: (acc.creditBalance || 0) + tx.amount };
            }
            return { ...acc, balance: acc.balance - tx.amount };
          }
          return acc;
        });
      } else if (tx.type === 'in') {
        updatedAccounts = updatedAccounts.map((acc) => {
          if (acc.id === tx.accountId) {
            return { ...acc, balance: acc.balance + tx.amount };
          }
          return acc;
        });
      }
    });

    setAppData((prev) => ({
      ...prev,
      accounts: updatedAccounts,
      transactions: [...newTxs, ...prev.transactions],
    }));

    if (newTxs[0]?.date) {
      jumpToTransactionMonth(newTxs[0].date);
    }

    showToast(`Đã thêm ${newTxs.length} giao dịch vào sổ thành công!`);
  };

  // Update transaction
  const handleUpdateTransaction = (updatedTx: Transaction) => {
    const oldTx = appData.transactions.find((t) => t.id === updatedTx.id);
    if (!oldTx) return;

    let updatedAccounts = [...appData.accounts];
    if (oldTx.type === 'out') {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === oldTx.accountId) {
          if (acc.type === 'credit') {
            return {
              ...acc,
              creditBalance: Math.max(0, (acc.creditBalance || 0) - oldTx.amount),
            };
          }
          return { ...acc, balance: acc.balance + oldTx.amount };
        }
        return acc;
      });
    } else if (oldTx.type === 'in') {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === oldTx.accountId) {
          return { ...acc, balance: acc.balance - oldTx.amount };
        }
        return acc;
      });
    }

    if (updatedTx.type === 'out') {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === updatedTx.accountId) {
          if (acc.type === 'credit') {
            return { ...acc, creditBalance: (acc.creditBalance || 0) + updatedTx.amount };
          }
          return { ...acc, balance: acc.balance - updatedTx.amount };
        }
        return acc;
      });
    } else if (updatedTx.type === 'in') {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === updatedTx.accountId) {
          return { ...acc, balance: acc.balance + updatedTx.amount };
        }
        return acc;
      });
    }

    setAppData((prev) => ({
      ...prev,
      accounts: updatedAccounts,
      transactions: prev.transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t)),
    }));

    showToast('Đã cập nhật giao dịch thành công!');
  };

  // Delete transaction
  const handleDeleteTransaction = (txId: string) => {
    const tx = appData.transactions.find((t) => t.id === txId);
    if (!tx) return;

    let updatedAccounts = [...appData.accounts];
    if (tx.type === 'out') {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === tx.accountId) {
          if (acc.type === 'credit') {
            return {
              ...acc,
              creditBalance: Math.max(0, (acc.creditBalance || 0) - tx.amount),
            };
          }
          return { ...acc, balance: acc.balance + tx.amount };
        }
        return acc;
      });
    } else if (tx.type === 'in') {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === tx.accountId) {
          return { ...acc, balance: acc.balance - tx.amount };
        }
        return acc;
      });
    }

    setAppData((prev) => ({
      ...prev,
      accounts: updatedAccounts,
      transactions: prev.transactions.filter((t) => t.id !== txId),
    }));

    showToast('Đã xoá giao dịch khỏi sổ!');
  };

  // Planned Expenses Handlers
  const handleSavePlannedExpense = (expense: PlannedExpense) => {
    setAppData((prev) => {
      const currentList = prev.plannedExpenses || [];
      const exists = currentList.some((e) => e.id === expense.id);
      const updatedList = exists
        ? currentList.map((e) => (e.id === expense.id ? expense : e))
        : [expense, ...currentList];

      return {
        ...prev,
        plannedExpenses: updatedList,
      };
    });
    showToast(`Đã lưu khoản dự chi: ${expense.title}`);
  };

  const handleDeletePlannedExpense = (id: string) => {
    setAppData((prev) => ({
      ...prev,
      plannedExpenses: (prev.plannedExpenses || []).filter((e) => e.id !== id),
    }));
    showToast('Đã xoá khoản dự chi');
  };

  const handleQuickPayPlannedExpense = (expense: PlannedExpense) => {
    const newTx: Transaction = {
      id: `tx_plan_${Date.now()}`,
      amount: expense.amount,
      type: 'out',
      cat: expense.cat || 'khac',
      note: `[Đã chi] ${expense.title}`,
      date: expense.dueDate || new Date().toISOString().split('T')[0],
      accountId: expense.accountId || appData.accounts[0]?.id || 'acc_vcb',
      source: 'nhập tay',
      createdAt: Date.now(),
    };

    setAppData((prev) => {
      const currentPlans = prev.plannedExpenses || [];
      const updatedPlans = currentPlans.map((p) =>
        p.id === expense.id ? { ...p, isPaid: true } : p
      );

      return {
        ...prev,
        plannedExpenses: updatedPlans,
      };
    });

    handleAddTransaction(newTx);
    showToast(`Đã ghi nhận chi tiêu "${expense.title}" vào sổ!`);
  };

  // Accounts Handlers
  const handleSaveAccount = (account: Account) => {
    setAppData((prev) => {
      const exists = prev.accounts.some((a) => a.id === account.id);
      return {
        ...prev,
        accounts: exists
          ? prev.accounts.map((a) => (a.id === account.id ? account : a))
          : [...prev.accounts, account],
      };
    });
    showToast(`Đã lưu tài khoản ${account.name}!`);
  };

  const handleDeleteAccount = (accountId: string) => {
    setAppData((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== accountId),
    }));
    showToast('Đã xoá tài khoản.');
  };

  // Investment Handlers (Fixed Assets: Stocks, Funds, Gold)
  const handleSaveInvestment = (inv: InvestmentHolding) => {
    setAppData((prev) => {
      const list = prev.investments || [];
      const exists = list.some((i) => i.id === inv.id);
      return {
        ...prev,
        investments: exists
          ? list.map((i) => (i.id === inv.id ? inv : i))
          : [inv, ...list],
      };
    });
    showToast(`Đã lưu tài sản ${inv.symbol}!`);
  };

  const handleDeleteInvestment = (id: string) => {
    setAppData((prev) => ({
      ...prev,
      investments: (prev.investments || []).filter((i) => i.id !== id),
    }));
    showToast('Đã xoá tài sản.');
  };

  // Profile Update
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setAppData((prev) => ({
      ...prev,
      profile: updatedProfile,
    }));
    showToast('Đã lưu thông tin cài đặt!');
  };

  // Toggle Hide Balances
  const handleToggleHideBalances = () => {
    setAppData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        hideBalances: !prev.profile.hideBalances,
      },
    }));
  };

  // AI Analysis Record
  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentMonthAnalysis = appData.aiAnalysisHistory?.[currentMonthKey];

  const handleSaveAnalysis = (record: AIAnalysisRecord) => {
    setAppData((prev) => ({
      ...prev,
      aiAnalysisHistory: {
        ...prev.aiAnalysisHistory,
        [record.month]: record,
      },
    }));
    showToast('Đã lưu kết quả phân tích tài chính AI!');
  };

  // Restore backup
  const handleRestoreData = (restored: AppData) => {
    setAppData(restored);
    showToast('Khôi phục dữ liệu sao lưu thành công!');
  };

  return (
    <div className="min-h-screen bg-[#FFF7F8] dark:bg-[#150f24] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <div className="flex-1 flex flex-col md:pl-64">
        <Header
          currentTab={currentTab}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          profile={appData.profile}
          onToggleHideBalances={handleToggleHideBalances}
          onOpenSettings={() => setCurrentTab('settings')}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-2 pb-24 md:pb-12">
          {/* Tab 1: Tổng quan (Overview) */}
          {currentTab === 'overview' && (
            <OverviewTab
              currentYear={currentYear}
              currentMonth={currentMonth}
              transactions={activeTransactions}
              accounts={appData.accounts}
              investments={appData.investments || []}
              plannedExpenses={appData.plannedExpenses || []}
              profile={appData.profile}
              onOpenAddModal={() => {
                setAddModalMode('single');
                setIsAddModalOpen(true);
              }}
              onNavigateToTab={(tab) => setCurrentTab(tab as TabKey)}
              onSelectTransaction={(tx) => setSelectedTxForDetail(tx)}
              onOpenPlannedExpense={() => setIsPlannedExpenseOpen(true)}
              onOpenCategoryBudget={() => setIsCategoryBudgetOpen(true)}
            />
          )}

          {/* Tab 2: Sổ giao dịch (Transactions) */}
          {currentTab === 'transactions' && (
            <TransactionsTab
              currentYear={currentYear}
              currentMonth={currentMonth}
              transactions={activeTransactions}
              profile={appData.profile}
              onOpenAddModal={() => {
                setAddModalMode('single');
                setIsAddModalOpen(true);
              }}
              onSelectTransaction={(tx) => setSelectedTxForDetail(tx)}
            />
          )}

          {/* Tab 3: Tài sản (Accounts, Savings, Fixed Investments & Credit Cards) */}
          {currentTab === 'accounts' && (
            <AccountsTab
              accounts={appData.accounts}
              investments={appData.investments || []}
              profile={appData.profile}
              onOpenTransferModal={() => {
                setAddModalMode('transfer');
                setIsAddModalOpen(true);
              }}
              onOpenCreditPaymentModal={() => {
                setAddModalMode('transfer');
                setIsAddModalOpen(true);
              }}
              onSaveAccount={handleSaveAccount}
              onDeleteAccount={handleDeleteAccount}
              onSaveInvestment={handleSaveInvestment}
              onDeleteInvestment={handleDeleteInvestment}
            />
          )}

          {/* Tab 4: Trợ lý AI (AIAssistant) */}
          {currentTab === 'ai' && (
            <AIAssistantTab
              currentYear={currentYear}
              currentMonth={currentMonth}
              transactions={activeTransactions}
              profile={appData.profile}
              historyAnalysis={currentMonthAnalysis}
              onSaveAnalysis={handleSaveAnalysis}
            />
          )}

          {/* Tab 5: Cài đặt (Settings) */}
          {currentTab === 'settings' && (
            <SettingsTab
              profile={appData.profile}
              appData={appData}
              onUpdateProfile={handleUpdateProfile}
              onRestoreData={handleRestoreData}
            />
          )}
        </main>
      </div>

      {/* Navigation (Mobile Bottom Bar + Desktop Left Sidebar) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAddModal={() => {
          setAddModalMode('single');
          setIsAddModalOpen(true);
        }}
      />

      {/* Add / Scan Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={appData.accounts}
        profile={appData.profile}
        onUpdateProfile={handleUpdateProfile}
        onAddTransaction={handleAddTransaction}
        onAddMultipleTransactions={handleAddMultipleTransactions}
        initialMode={addModalMode}
      />

      {/* Planned Expenses Modal (Dự chi thông minh) */}
      <PlannedExpenseModal
        isOpen={isPlannedExpenseOpen}
        onClose={() => setIsPlannedExpenseOpen(false)}
        plannedExpenses={appData.plannedExpenses || []}
        accounts={appData.accounts}
        onSaveExpense={handleSavePlannedExpense}
        onDeleteExpense={handleDeletePlannedExpense}
        onQuickPayExpense={handleQuickPayPlannedExpense}
      />

      {/* Category Budget Modal */}
      <CategoryBudgetModal
        isOpen={isCategoryBudgetOpen}
        onClose={() => setIsCategoryBudgetOpen(false)}
        profile={appData.profile}
        transactions={activeTransactions}
        currentMonth={`${currentYear}-${String(currentMonth).padStart(2, '0')}`}
        onSaveCategoryBudgets={(cats) => {
          handleUpdateProfile({
            ...appData.profile,
            categoryBudgets: cats,
          });
        }}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTxForDetail}
        accounts={appData.accounts}
        onClose={() => setSelectedTxForDetail(null)}
        onUpdate={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Little Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-gray-900/90 text-white px-4 py-2.5 text-xs font-semibold shadow-xl backdrop-blur-md animate-fade-in dark:bg-purple-950/95">
          <CheckCircle2 size={15} className="text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
