
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import History from '../features/history/History';
import { View, Transaction, MonthlyData, Category } from '../entities/types';
import { CATEGORIES } from '../constants';
import Dashboard from '../features/dashboard/Dashboard';
import Analysis from '../features/analysis/Analysis';
import Overview from '../features/dashboard/Overview';
import Settings from '../features/settings/Settings';
import NewEntryModal from '../features/transactions/NewEntryModal';
import CategoryManagement from '../features/categories/CategoryManagement';
import CategoryEditorModal from '../features/categories/CategoryEditorModal';
import Support from '../features/static/Support';
import TermsOfService from '../features/static/TermsOfService';
import PrivacyPolicy from '../features/static/PrivacyPolicy';
import AuthCallback from '../features/auth/AuthCallback';
import LandingPage from '../features/static/LandingPage';
import { useAuth } from '../application/contexts/AuthContext';
import { useCloudBackup, CloudBackupProvider } from '../application/contexts/CloudBackupContext';
import { LocalRepository } from '../infrastructure/local/local-repository';
import Layout from '../shared/Layout';
import { Toaster, toast } from 'react-hot-toast';
import AccountDeletionModal from '../shared/ui/AccountDeletionModal';
import { ProfileService } from '../infrastructure/supabase/supabase-profile';
import { getCurrencySymbol } from '../entities/financial';

const AppContent: React.FC<{ onDataPulledRef: React.MutableRefObject<(() => void) | null> }> = ({ onDataPulledRef }) => {
    const { user } = useAuth();
    const { triggerBackup } = useCloudBackup();
    const userId = user?.id;

    const navigate = useNavigate();
    const location = useLocation();
    const currentView = (location.pathname.split('/')[1] as View) || 'dashboard';

    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>(CATEGORIES);
    const [selectedMonth, setSelectedMonth] = useState<MonthlyData | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [currency, setCurrency] = useState(() => LocalRepository.getSettings().currency);
    const [defaultCategoryType, setDefaultCategoryType] = useState<'income' | 'expense' | undefined>(undefined);
    const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | null>(null);

    // Apply theme on mount and when changed
    const applyTheme = useCallback(() => {
        const theme = LocalRepository.getSettings().theme;
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        applyTheme();
    }, [applyTheme]);

    const loadData = useCallback(() => {
        const freshTransactions = LocalRepository.getAllExpenses();
        setTransactions(freshTransactions);
        const settings = LocalRepository.getSettings();
        // Currency is already handled by state initialization, but we can sync it here if needed
        if (currency !== settings.currency) {
            setCurrency(settings.currency);
        }

        // Categories logic...
        const localCats = LocalRepository.getAllCategories();
        if (localCats.length > 0) {
            setCategories(localCats);
        } else {
            // Persist default categories to localStorage so the backup service can find them
            LocalRepository.bulkUpsert(CATEGORIES as any[], 'category', false);
            setCategories(CATEGORIES);
        }
    }, [currency]);

    // Listen for cross-tab or cross-file local storage changes (e.g. AuthContext syncing currency)
    useEffect(() => {
        const handleStorageChange = () => {
            const settings = LocalRepository.getSettings();
            if (currency !== settings.currency) {
                setCurrency(settings.currency);
            }
            applyTheme();
        };

        // Custom event for same-window updates
        window.addEventListener('costpilot-settings-updated', handleStorageChange);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('costpilot-settings-updated', handleStorageChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [currency, applyTheme]);

    // Expose loadData for cross-device pull refresh
    useEffect(() => {
        onDataPulledRef.current = loadData;
    }, [loadData, onDataPulledRef]);

    // Persist currency whenever it changes
    useEffect(() => {
        LocalRepository.updateSettings({ currency });
    }, [currency]);

    // Persist current view whenever it changes (optional but good for restoring state if doing full refresh)
    useEffect(() => {
        LocalRepository.updateSettings({ lastView: currentView });
    }, [currentView]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

    // Avoid redirecting '/' so LandingPage can be shown

    const handleSaveTransaction = async (transaction: Omit<Transaction, 'id'> | Transaction) => {
        const isEditing = 'id' in transaction;
        const transactionData: any = {
            ...transaction,
            id: isEditing ? (transaction as Transaction).id : crypto.randomUUID(),
            user_id: userId || null,
        };
        LocalRepository.upsertExpense(transactionData);
        setEditingTransaction(null);
        loadData();
        triggerBackup();

        toast.success(isEditing ? 'Transaction updated' : 'New entry added', {
            style: {
                borderRadius: '12px',
                background: '#1c1917',
                color: '#fff',
                fontWeight: 'bold',
                border: '1px solid #AF8F42'
            }
        });
    };

    const handleDeleteTransaction = async (id: string) => {
        LocalRepository.deleteExpense(id);
        setEditingTransaction(null);
        loadData();
        triggerBackup();
        toast.success('Transaction removed', {
            style: {
                borderRadius: '12px',
                background: '#1c1917',
                color: '#fff',
                fontWeight: 'bold',
                border: '1px solid #AF8F42'
            }
        });
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
        triggerBackup();
        toast.success(('id' in catData) ? 'Category updated' : 'New category created', {
            style: {
                borderRadius: '12px',
                background: '#1c1917',
                color: '#fff',
                fontWeight: 'bold',
                border: '1px solid #AF8F42'
            }
        });
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

    const handleViewChange = (newView: View) => {
        navigate(`/${newView}`);
    };

    return (
        <Routes>
            {/* Public layout-less routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthCallback />} />
            <Route path="/privacy" element={<PrivacyPolicy onBack={() => navigate(-1)} />} />
            <Route path="/terms" element={<TermsOfService onBack={() => navigate(-1)} />} />

            {/* App Layout Route block */}
            <Route path="/*" element={
                <Layout
                    currentView={currentView}
                    onNavigate={handleViewChange}
                    onAddEntry={() => {
                        setEditingTransaction(null);
                        setIsEntryModalOpen(true);
                    }}
                    userEmail={user?.email || undefined}
                >
                    <div key={currentView} className="animate-slide-up w-full">
                        <Routes>
                            <Route
                                path="/dashboard"
                                element={
                                    <Dashboard
                                        monthlyData={monthlyHistory}
                                        transactions={transactions}
                                        onAddEntry={() => {
                                            setEditingTransaction(null);
                                            setIsEntryModalOpen(true);
                                        }}
                                        onViewAll={() => { setTypeFilter(null); navigate('/overview'); }}
                                        onTransactionClick={(t) => {
                                            setEditingTransaction(t);
                                            setIsEntryModalOpen(true);
                                        }}
                                        onTypeFilter={(type) => { setTypeFilter(type); navigate('/overview'); }}
                                        currencySymbol={getCurrencySymbol(currency)}
                                    />
                                }
                            />

                            <Route
                                path="/overview"
                                element={
                                    <Overview
                                        month={selectedMonth || monthlyHistory[0]}
                                        transactions={getMonthTransactions(selectedMonth || monthlyHistory[0])}
                                        onBack={() => { setTypeFilter(null); navigate('/dashboard'); }}
                                        onTransactionClick={(t) => {
                                            setEditingTransaction(t);
                                            setIsEntryModalOpen(true);
                                        }}
                                        currency={currency}
                                        typeFilter={typeFilter}
                                        onClearFilter={() => setTypeFilter(null)}
                                    />
                                }
                            />

                            <Route
                                path="/history"
                                element={
                                    <History
                                        transactions={transactions}
                                        onTransactionClick={(t) => {
                                            setEditingTransaction(t);
                                            setIsEntryModalOpen(true);
                                        }}
                                        onBack={() => navigate('/dashboard')}
                                        currencySymbol={getCurrencySymbol(currency)}
                                        categories={categories}
                                    />
                                }
                            />

                            <Route
                                path="/analysis"
                                element={
                                    <Analysis
                                        transactions={transactions}
                                        categories={categories}
                                        currency={currency}
                                        onBack={() => navigate('/dashboard')}
                                    />
                                }
                            />

                            <Route
                                path="/settings"
                                element={
                                    <Settings
                                        onNavigate={(v) => navigate(`/${v}`)}
                                        onBack={() => navigate('/dashboard')}
                                        categoryCount={categories.length}
                                        transactions={transactions}
                                        currency={currency}
                                        setCurrency={setCurrency}
                                        onDeleteAccount={() => setIsDeletionModalOpen(true)}
                                    />
                                }
                            />

                            <Route
                                path="/category-picker"
                                element={
                                    <CategoryManagement
                                        categories={categories}
                                        onBack={() => navigate('/settings')}
                                        onAddCategory={(type) => {
                                            setEditingCategory(null);
                                            setDefaultCategoryType(type);
                                            setIsCategoryModalOpen(true);
                                        }}
                                        onEditCategory={(cat) => {
                                            setEditingCategory(cat);
                                            setIsCategoryModalOpen(true);
                                        }}
                                    />
                                }
                            />

                            <Route path="/support" element={<Support onBack={() => navigate('/settings')} />} />

                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </div>

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

                    <Toaster position="top-center" />

                    <AccountDeletionModal
                        isOpen={isDeletionModalOpen}
                        onClose={() => setIsDeletionModalOpen(false)}
                        userEmail={user?.email || ''}
                        onConfirm={async () => {
                            if (user) {
                                const success = await ProfileService.scheduleDeletion(user.id);
                                if (!success) throw new Error('Failed to schedule deletion.');
                            }
                        }}
                    />
                </Layout>
            } />
        </Routes>
    );
};

const App: React.FC = () => {
    const onDataPulledRef = React.useRef<(() => void) | null>(null);

    const handleDataPulled = useCallback(() => {
        if (onDataPulledRef.current) {
            onDataPulledRef.current();
        }
    }, []);

    return (
        <CloudBackupProvider onDataPulled={handleDataPulled}>
            <AppContent onDataPulledRef={onDataPulledRef} />
        </CloudBackupProvider>
    );
};

export default App;
