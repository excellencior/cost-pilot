import React, { useState, useEffect } from 'react';
import { Category, Transaction } from '../types';
import CategoryPickerModal from './CategoryPickerModal';
import DatePicker from './UI/DatePicker';
import ConfirmModal from './UI/ConfirmModal';

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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (editingTransaction && onDelete) {
      onDelete(editingTransaction.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-stone-900/60 transition-opacity animate-backdrop"
          onClick={onClose}
        />

        <div className="relative w-full max-w-sm bg-brand-surface-light dark:bg-brand-surface-dark rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">
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
                className="size-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div className="flex p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  disabled={!!editingTransaction}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all capitalize ${type === t
                    ? 'bg-brand-surface-light dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-500 opacity-50'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input-field font-mono text-lg"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <DatePicker
                  label="Date"
                  value={date}
                  onChange={setDate}
                />
              </div>
            </div>

            <div>
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
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 hover:border-primary-200 dark:hover:border-primary-900 transition-all text-left"
              >
                <div className="size-10 rounded-lg bg-brand-surface-light dark:bg-stone-800 shadow-sm flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <span className="material-symbols-outlined text-xl">{category?.icon || 'category'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">{category?.name || 'Select Category'}</p>
                  <p className="text-[9px] text-stone-500 font-medium uppercase tracking-tight">Tap to change</p>
                </div>
                <span className="material-symbols-outlined text-stone-400 text-xl">chevron_right</span>
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 py-2 text-xs"
              >
                {editingTransaction ? 'Update' : 'Save'}
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

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to remove this record? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
};

export default NewEntryModal;
