import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Transaction, Category } from '../types';

// ============================================
// TRANSACTION OPERATIONS
// ============================================

/**
 * Add a new transaction for a user
 */
export const addTransaction = async (
    userId: string,
    transaction: Omit<Transaction, 'id'>
): Promise<string> => {
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const docRef = await addDoc(transactionsRef, {
        ...transaction,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
};

/**
 * Update an existing transaction
 */
export const updateTransaction = async (
    userId: string,
    transactionId: string,
    updates: Partial<Transaction>
): Promise<void> => {
    const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
    await updateDoc(transactionRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (
    userId: string,
    transactionId: string
): Promise<void> => {
    const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(transactionRef);
};

/**
 * Get all transactions for a user (one-time fetch)
 */
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Transaction[];
};

/**
 * Subscribe to real-time transaction updates
 */
export const subscribeToTransactions = (
    userId: string,
    callback: (transactions: Transaction[]) => void
): Unsubscribe => {
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Transaction[];
        callback(transactions);
    });
};

// ============================================
// CATEGORY OPERATIONS
// ============================================

/**
 * Add a new category for a user
 */
export const addCategory = async (
    userId: string,
    category: Omit<Category, 'id'>
): Promise<string> => {
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const docRef = await addDoc(categoriesRef, {
        ...category,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
};

/**
 * Update an existing category
 */
export const updateCategory = async (
    userId: string,
    categoryId: string,
    updates: Partial<Category>
): Promise<void> => {
    const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
    await updateDoc(categoryRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
};

/**
 * Delete a category
 */
export const deleteCategory = async (
    userId: string,
    categoryId: string
): Promise<void> => {
    const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
    await deleteDoc(categoryRef);
};

/**
 * Get all categories for a user (one-time fetch)
 */
export const getCategories = async (userId: string): Promise<Category[]> => {
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const snapshot = await getDocs(categoriesRef);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Category[];
};

/**
 * Subscribe to real-time category updates
 */
export const subscribeToCategories = (
    userId: string,
    callback: (categories: Category[]) => void
): Unsubscribe => {
    const categoriesRef = collection(db, 'users', userId, 'categories');

    return onSnapshot(categoriesRef, (snapshot) => {
        const categories = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Category[];
        callback(categories);
    });
};

// ============================================
// INITIALIZE DEFAULT DATA
// ============================================

/**
 * Initialize default categories for a new user
 */
export const initializeUserData = async (
    userId: string,
    defaultCategories: Omit<Category, 'id'>[]
): Promise<void> => {
    const existingCategories = await getCategories(userId);

    // Only initialize if user has no categories
    if (existingCategories.length === 0) {
        const promises = defaultCategories.map((cat) => addCategory(userId, cat));
        await Promise.all(promises);
    }
};
