import pool from './database';

export interface Transaction {
  id?: number;
  user_id?: number;
  category_id?: number;
  amount: number;
  description: string;
  transaction_date: string;
  type: 'income' | 'expense';
  payment_method?: string;
  location?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface TransactionWithCategory extends Transaction {
  category?: {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: 'income' | 'expense';
  };
}

export class TransactionModel {
  static async getAll(userId: number = 1): Promise<TransactionWithCategory[]> {
    const query = `
      SELECT 
        t.id, t.user_id, t.category_id, t.amount, t.description,
        t.date::text as transaction_date,
        t.type, t.payment_method, t.location, t.tags, t.created_at, t.updated_at,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.type as category_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      ORDER BY t.date DESC, t.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      category_id: row.category_id,
      amount: parseFloat(row.amount),
      description: row.description,
      transaction_date: row.transaction_date,
      type: row.type,
      payment_method: row.payment_method,
      location: row.location,
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
      category: row.category_name ? {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon,
        type: row.category_type
      } : undefined
    }));
  }

  static async getById(id: number, userId: number = 1): Promise<TransactionWithCategory | null> {
    const query = `
      SELECT 
        t.id, t.user_id, t.category_id, t.amount, t.description,
        t.date::text as transaction_date,
        t.type, t.payment_method, t.location, t.tags, t.created_at, t.updated_at,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.type as category_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1 AND t.user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      category_id: row.category_id,
      amount: parseFloat(row.amount),
      description: row.description,
      transaction_date: row.transaction_date,
      type: row.type,
      payment_method: row.payment_method,
      location: row.location,
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
      category: row.category_name ? {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon,
        type: row.category_type
      } : undefined
    };
  }

  static async create(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>, userId: number = 1): Promise<TransactionWithCategory> {
    
    const query = `
      INSERT INTO transactions (
        user_id, category_id, amount, description, date, 
        type, payment_method, location, tags
      ) VALUES ($1, $2, $3, $4, ($5::text)::date, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      userId,
      transaction.category_id || null,
      transaction.amount,
      transaction.description,
      transaction.transaction_date,
      transaction.type,
      transaction.payment_method || null,
      null, // location field (not used in current UI)
      transaction.tags || []
    ];
    
    const result = await pool.query(query, values);
    const newTransaction = result.rows[0];
    
    // Get the full transaction with category info
    return await this.getById(newTransaction.id, userId) as TransactionWithCategory;
  }

  static async update(id: number, transaction: Partial<Transaction>, userId: number = 1): Promise<TransactionWithCategory | null> {
    
    const query = `
      UPDATE transactions SET
        category_id = COALESCE($2, category_id),
        amount = COALESCE($3, amount),
        description = COALESCE($4, description),
        date = COALESCE(($5::text)::date, date),
        type = COALESCE($6, type),
        payment_method = COALESCE($7, payment_method),
        location = COALESCE($8, location),
        tags = COALESCE($9, tags),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $10
      RETURNING *
    `;
    
    const values = [
      id,
      transaction.category_id,
      transaction.amount,
      transaction.description,
      transaction.transaction_date,
      transaction.type,
      transaction.payment_method,
      null, // location field (not used in current UI)
      transaction.tags,
      userId
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return await this.getById(id, userId);
  }

  static async delete(id: number, userId: number = 1): Promise<boolean> {
    const query = 'DELETE FROM transactions WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}