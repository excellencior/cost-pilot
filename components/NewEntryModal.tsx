import React, { useState, useEffect } from 'react';
import { Category, Transaction } from '../types';
import CategoryPickerModal from './CategoryPickerModal';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
  onDelete?: (id: string) => void;
  categories: Category[];
  editingTransaction?: Transaction | null;
}

const NewEntryModal: React.FC<NewEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  categories,
  editingTransaction
}) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(categories[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setTitle(editingTransaction.title);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      const firstOfType = categories.find(c => c.type === 'expense');
      if (firstOfType) setCategory(firstOfType);
    }
  }, [editingTransaction, isOpen, categories]);

  useEffect(() => {
    if (!editingTransaction) {
      const firstOfType = categories.find(c => c.type === type);
      if (firstOfType) {
        setCategory(firstOfType);
      }
    }
  }, [type, categories, editingTransaction]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const transactionData = {
      title: title || (type === 'expense' ? 'New Expense' : 'New Income'),
      amount: parseFloat(amount),
      type,
      category,
      date,
    };

    if (editingTransaction) {
      onSave({ ...transactionData, id: editingTransaction.id });
    } else {
      onSave(transactionData);
    }

    onClose();
  };

  const handleDelete = () => {
    if (editingTransaction && onDelete) {
      if (confirm('Are you sure you want to delete this transaction?')) {
        onDelete(editingTransaction.id);
        onClose();
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 transition-opacity animate-backdrop"
          onClick={onClose}
        />

        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <div className="flex items-center gap-2">
              {editingTransaction && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="size-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  title="Delete Transaction"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  disabled={!!editingTransaction}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize ${type === t
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 opacity-50'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="label-text">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  className="input-field font-mono text-lg"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="label-text">Date</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="label-text">Description</label>
              <input
                type="text"
                className="input-field"
                placeholder="What was this for?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="label-text">Category</label>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900 transition-all text-left"
              >
                <div className="size-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <span className="material-symbols-outlined text-2xl">{category.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{category.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Tap to change</p>
                </div>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </button>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                {editingTransaction ? 'Update Entry' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CategoryPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={setCategory}
        categories={categories}
        selectedCategoryId={category.id}
        type={type}
      />
    </>
  );
};

export default NewEntryModal;
