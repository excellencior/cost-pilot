
import React, { useState, useEffect, useMemo } from 'react';
import { View, Transaction, MonthlyData, Category } from './types';
import { CATEGORIES } from './constants';
import Dashboard from './components/Dashboard';
import Analysis from './components/Analysis';
import Overview from './components/Overview';
import Settings from './components/Settings';
import NewEntryModal from './components/NewEntryModal';
import CategoryManagement from './components/CategoryManagement';
import CategoryEditorModal from './components/CategoryEditorModal';
import { useAuth } from './components/AuthContext';
import { LocalRepository } from './services/db/localRepository';
import Layout from './components/Layout';

const App: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyData | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [defaultCategoryType, setDefaultCategoryType] = useState<'income' | 'expense' | undefined>(undefined);

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = { 'USD': '$', 'BDT': '৳', 'EUR': '€' };
    return symbols[code] || '$';
  };

  const loadData = () => {
    const freshTransactions = LocalRepository.getAllExpenses();
    setTransactions(freshTransactions);
    const localCats = LocalRepository.getAllCategories();
    setCategories(localCats.length > 0 ? localCats : CATEGORIES);
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleSaveTransaction = async (transaction: Omit<Transaction, 'id'> | Transaction) => {
    const transactionData: any = {
      ...transaction,
      id: 'id' in transaction ? transaction.id : crypto.randomUUID(),
      user_id: userId || null,
    };
    LocalRepository.upsertExpense(transactionData);
    setEditingTransaction(null);
    loadData();
  };

  const handleDeleteTransaction = async (id: string) => {
    LocalRepository.deleteExpense(id);
    setEditingTransaction(null);
    loadData();
  };

  const handleSaveCategory = async (catData: Omit<Category, 'id'> | Category) => {
    if ('id' in catData) {
      const { id, ...updates } = catData as Category;
      LocalRepository.upsertCategory({ id, ...updates, user_id: userId || null });
    } else {
      const newCat: any = {
        ...catData,
        id: crypto.randomUUID(),
        user_id: userId || null
      };
      LocalRepository.upsertCategory(newCat);
    }
    setEditingCategory(null);
    loadData();
  };

  const monthlyHistory = useMemo(() => {
    const history: MonthlyData[] = [];
    const transactionsByMonth: { [key: string]: Transaction[] } = {};

    transactions.forEach(t => {
      const monthKey = `${t.date.substring(0, 7)}`;
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
        expense: totalExpenses,
      });
    });

    // Fallback if no history
    if (history.length === 0) {
      const now = new Date();
      history.push({
        month: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear(),
        income: 0,
        expense: 0
      });
    }

    return history;
  }, [transactions]);

  const getMonthTransactions = (monthData: MonthlyData) => {
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
            transactions={transactions}
            onAddEntry={() => {
              setEditingTransaction(null);
              setIsEntryModalOpen(true);
            }}
            onViewAll={() => setCurrentView('overview')}
            onTransactionClick={(t) => {
              setEditingTransaction(t);
              setIsEntryModalOpen(true);
            }}
            currencySymbol={getCurrencySymbol(currency)}
          />
        );
      case 'overview':
        const displayMonth = selectedMonth || monthlyHistory[0];
        return (
          <Overview
            month={displayMonth}
            transactions={getMonthTransactions(displayMonth)}
            onBack={() => setCurrentView('dashboard')}
            onAddClick={() => {
              setEditingTransaction(null);
              setIsEntryModalOpen(true);
            }}
            onTransactionClick={(t) => {
              setEditingTransaction(t);
              setIsEntryModalOpen(true);
            }}
            currency={currency}
          />
        );
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
        return <Dashboard
          monthlyData={monthlyHistory}
          transactions={transactions}
          onAddEntry={() => setIsEntryModalOpen(true)}
          onViewAll={() => setCurrentView('overview')}
          onTransactionClick={() => { }}
          currencySymbol={getCurrencySymbol(currency)}
        />;
    }
  };

  return (
    <Layout
      currentView={currentView}
      onNavigate={setCurrentView}
      onAddEntry={() => {
        setEditingTransaction(null);
        setIsEntryModalOpen(true);
      }}
      userEmail={user?.email}
    >
      {renderView()}

      <NewEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        editingTransaction={editingTransaction}
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
    </Layout>
  );
};

export default App;
