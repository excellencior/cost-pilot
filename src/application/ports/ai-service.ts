import { Transaction } from '../../entities/types';

export interface FinancialInsight {
    summary: string;
    suggestions: string[];
    spendingPatterns: { category: string; trend: 'up' | 'down' | 'stable'; percent: number }[];
}

export interface AiServicePort {
    analyzeSpending(transactions: Transaction[], period: string): Promise<FinancialInsight>;
}
