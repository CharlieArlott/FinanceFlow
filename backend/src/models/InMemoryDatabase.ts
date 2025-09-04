// Temporary in-memory database for quick testing
export interface Transaction {
  id: number;
  user_id: number;
  category_id?: number;
  amount: number;
  description: string;
  transaction_date: string;
  type: 'income' | 'expense';
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
  user_id?: number;
}

class InMemoryDB {
  private transactions: Transaction[] = [];
  private categories: Category[] = [
    { id: 1, name: 'Food & Dining', color: '#FF6B6B', icon: 'utensils', type: 'expense' },
    { id: 2, name: 'Transportation', color: '#4ECDC4', icon: 'car', type: 'expense' },
    { id: 3, name: 'Shopping', color: '#45B7D1', icon: 'shopping-bag', type: 'expense' },
    { id: 4, name: 'Entertainment', color: '#96CEB4', icon: 'film', type: 'expense' },
    { id: 5, name: 'Bills & Utilities', color: '#FFEAA7', icon: 'file-text', type: 'expense' },
    { id: 6, name: 'Healthcare', color: '#DDA0DD', icon: 'heart', type: 'expense' },
    { id: 7, name: 'Education', color: '#FFB6C1', icon: 'book', type: 'expense' },
    { id: 8, name: 'Travel', color: '#87CEEB', icon: 'plane', type: 'expense' },
    { id: 9, name: 'Salary', color: '#98FB98', icon: 'dollar-sign', type: 'income' },
    { id: 10, name: 'Investment', color: '#F0E68C', icon: 'trending-up', type: 'income' },
    { id: 11, name: 'Other Income', color: '#D3D3D3', icon: 'plus', type: 'income' },
    { id: 12, name: 'Other Expense', color: '#D3D3D3', icon: 'minus', type: 'expense' },
  ];
  private nextTransactionId = 1;

  // Transaction methods
  getAllTransactions(userId: number = 1): Transaction[] {
    return this.transactions
      .filter(t => t.user_id === userId)
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }

  getTransactionById(id: number, userId: number = 1): Transaction | undefined {
    return this.transactions.find(t => t.id === id && t.user_id === userId);
  }

  createTransaction(data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>, userId: number = 1): Transaction {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id: this.nextTransactionId++,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };
    this.transactions.push(transaction);
    return transaction;
  }

  updateTransaction(id: number, data: Partial<Transaction>, userId: number = 1): Transaction | null {
    const index = this.transactions.findIndex(t => t.id === id && t.user_id === userId);
    if (index === -1) return null;

    this.transactions[index] = {
      ...this.transactions[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.transactions[index];
  }

  deleteTransaction(id: number, userId: number = 1): boolean {
    const index = this.transactions.findIndex(t => t.id === id && t.user_id === userId);
    if (index === -1) return false;

    this.transactions.splice(index, 1);
    return true;
  }

  // Category methods
  getAllCategories(userId: number = 1): Category[] {
    return this.categories.filter(c => !c.user_id || c.user_id === userId);
  }

  getCategoriesByType(type: 'income' | 'expense', userId: number = 1): Category[] {
    return this.categories.filter(c => c.type === type && (!c.user_id || c.user_id === userId));
  }

  createCategory(data: Omit<Category, 'id'>, userId: number = 1): Category {
    const category: Category = {
      ...data,
      id: Math.max(...this.categories.map(c => c.id)) + 1,
      user_id: userId,
    };
    this.categories.push(category);
    return category;
  }

  // Get transaction with category info
  getTransactionWithCategory(id: number, userId: number = 1): (Transaction & { category?: Category }) | null {
    const transaction = this.getTransactionById(id, userId);
    if (!transaction) return null;

    const category = transaction.category_id 
      ? this.categories.find(c => c.id === transaction.category_id)
      : undefined;

    return { ...transaction, category };
  }

  getAllTransactionsWithCategories(userId: number = 1): (Transaction & { category?: Category })[] {
    return this.getAllTransactions(userId).map(transaction => {
      const category = transaction.category_id 
        ? this.categories.find(c => c.id === transaction.category_id)
        : undefined;
      return { ...transaction, category };
    });
  }
}

export const inMemoryDB = new InMemoryDB();