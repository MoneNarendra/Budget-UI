
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD'
}

export enum Category {
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  BOOKS = 'Books',
  ENTERTAINMENT = 'Fun',
  BILLS = 'Bills',
  OTHER = 'Other',
  FEES = 'Fees',
  SCHOLARSHIP = 'Scholarship',
  ALLOWANCE = 'Allowance'
}

export interface CustomCategory {
  id: string;
  name: string;
  iconName: string; // Key to map to an icon in constants
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category | string;
  method: PaymentMethod;
  date: string; // ISO string
  note: string;
}

export interface FinancialSummary {
  totalBalance: number;
  cashBalance: number;
  cardBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export interface BudgetLimit {
  category: Category | string;
  limit: number;
}

export type AppTheme = 'light' | 'dark' | 'system';
