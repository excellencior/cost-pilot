
import React, { useState, useEffect, useMemo } from 'react';
import { View, Transaction, MonthlyData, Category } from './types';
import { CATEGORIES } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analysis from './components/Analysis';
import Overview from './components/Overview';
import Settings from './components/Settings';
import NewEntryModal from './components/NewEntryModal';
import CategoryManagement from './components/CategoryManagement';
import CategoryEditorModal from './components/CategoryEditorModal';
import { useAuth } from './components/AuthContext';
import { LocalRepository, LocalExpense, LocalCategory } from './services/db/localRepository';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const userId = user?.id;

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyData | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [defaultCategoryType, setDefaultCategoryType] = useState<'income' | 'expense' | undefined>(undefined);

  // Load Data Function
  const loadData = () => {
    setTransactions(LocalRepository.getAllExpenses());
    const localCats = LocalRepository.getAllCategories();
    setCategories(localCats.length > 0 ? localCats : CATEGORIES);
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
    // Initial Load
    loadData();

    // Setup listener for sync/updates? 
    // Ideally use a custom event or store subscription. 
    // For now, simple polling or refresh on focus could work, but React state needs to know when to update.
    // We'll update state on successful CRUD operations.
  }, []);

  // Update data when user changes (sync might happen)
  useEffect(() => {
    if (user) {
      loadData(); // Reload in case sync brought new data
    }
  }, [user]);


  // Handler Wrappers - Interacting with LocalDB ("Single Source of Truth")
  const handleAddTransaction = async (newT: Omit<Transaction, 'id'>) => {
    const expenseData: any = {
      ...newT,
      id: crypto.randomUUID(), // Generate ID
      user_id: userId || null,
    };
    LocalRepository.upsertExpense(expenseData);
    loadData(); // Refresh UI
  };

  const handleSaveCategory = async (catData: Omit<Category, 'id'> | Category) => {
    if ('id' in catData) {
      // Update
      const { id, ...updates } = catData as Category;
      LocalRepository.upsertCategory({ id, ...updates, user_id: userId || null });
    } else {
      // Create
      const newCat: any = {
        ...catData,
        id: crypto.randomUUID(),
        user_id: userId || null
      };
      LocalRepository.upsertCategory(newCat);
    }
    setEditingCategory(null);
    loadData(); // Refresh UI
  };


  const monthlyHistory = useMemo(() => {
    const history: MonthlyData[] = [];
    const transactionsByMonth: { [key: string]: Transaction[] } = {};

    transactions.forEach(t => {
      const monthKey = `${t.date.substring(0, 7)}`; // YYYY-MM
      if (!transactionsByMonth[monthKey]) {
        transactionsByMonth[monthKey] = [];
      }
      transactionsByMonth[monthKey].push(t);
    });

    Object.keys(transactionsByMonth).sort().reverse().forEach(monthKey => {
      const monthTransactions = transactionsByMonth[monthKey];
      const totalIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const dateDate = new Date(`${monthKey}-01`);

      history.push({
        month: dateDate.toLocaleString('default', { month: 'long' }),
        year: dateDate.getFullYear(),
        income: totalIncome,
        expenses: totalExpenses,
      });
    });

    return history;
  }, [transactions]);

  const getMonthTransactions = (monthData: MonthlyData) => {
    // Need to match Month Name + Year to date string YYYY-MM
    // This is a bit loose, better to store YYYY-MM in MonthlyData, but keeping types as is.
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.toLocaleString('default', { month: 'long' }) === monthData.month && d.getFullYear() === monthData.year;
    });
  };

  const handleMonthSelect = (month: MonthlyData) => {
    setSelectedMonth(month);
    setCurrentView('overview');
  };


  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            monthlyData={monthlyHistory}
            onMonthSelect={handleMonthSelect}
            onAddEntry={() => setIsEntryModalOpen(true)}
            currency={currency}
          />
        );
      case 'overview':
        return selectedMonth ? (
          <Overview
            month={selectedMonth}
            transactions={getMonthTransactions(selectedMonth)}
            onBack={() => setCurrentView('dashboard')}
            onAddClick={() => setIsEntryModalOpen(true)}
            currency={currency}
          />
        ) : <Dashboard monthlyData={monthlyHistory} onMonthSelect={handleMonthSelect} currency={currency} />;
      case 'analysis':
        return <Analysis transactions={transactions} currency={currency} />;
      case 'settings':
        return <Settings
          onNavigate={setCurrentView}
          categoryCount={categories.length}
          transactions={transactions}
          currency={currency}
          setCurrency={setCurrency}
        />;
      case 'category-picker':
        return <CategoryManagement
          categories={categories}
          onBack={() => setCurrentView('settings')}
          onAddCategory={(type) => {
            setEditingCategory(null);
            setDefaultCategoryType(type);
            setIsCategoryModalOpen(true);
          }}
          onEditCategory={(cat) => {
            setEditingCategory(cat);
            setIsCategoryModalOpen(true);
          }}
        />;
      default:
        return (
          <Dashboard
            monthlyData={monthlyHistory}
            onMonthSelect={handleMonthSelect}
            currency={currency}
          />
        );
    }
  };

  return (
    <div className="relative flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark overflow-hidden font-sans border-x border-white/10">
      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[100%] h-[40%] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[10%] right-[-5%] w-[100%] h-[40%] rounded-full bg-purple-400/10 blur-[100px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 pb-2 bg-white/40 dark:bg-background-dark/40 backdrop-blur-xl border-b border-white/10">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="size-12 flex items-center justify-center text-slate-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[28px]">menu</span>
        </button>
        <h1 className="text-base font-bold tracking-tight text-center flex-1 uppercase tracking-[0.2em] text-slate-400 truncate px-2">
          {currentView === 'dashboard' ? 'History' :
            currentView === 'overview' ? 'Details' :
              currentView === 'category-picker' ? 'Categories' :
                currentView}
        </h1>
        <div className="size-12 flex items-center justify-center">
          <div className="size-9 rounded-full bg-gradient-to-tr from-primary to-purple-500 border-2 border-white/20 shadow-md flex items-center justify-center text-white text-xs font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'G'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-hidden">
        {renderView()}
      </main>

      {/* Modals & Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view !== 'overview') setSelectedMonth(null);
        }}
      />

      <NewEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleAddTransaction}
        categories={categories}
      />

      <CategoryEditorModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setDefaultCategoryType(undefined);
        }}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
        defaultType={defaultCategoryType}
      />
    </div>
  );
};

export default App;
