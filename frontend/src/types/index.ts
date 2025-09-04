export interface Transaction {
  id: number;
  amount: number;
  description: string;
  transaction_date: string;
  type: 'income' | 'expense';
  category_id?: number;
  category?: Category;
  payment_method?: string;
  receipt_url?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
}

export interface Budget {
  id: number;
  category_id: number;
  category?: Category;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  spent?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
}