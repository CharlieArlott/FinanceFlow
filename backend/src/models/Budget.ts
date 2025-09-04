import pool from './database';

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  category?: any;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  spent?: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreateData {
  category_id: number;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
}

export class BudgetModel {
  static async getAll(userId: number): Promise<Budget[]> {
    const query = `
      SELECT 
        b.id, b.user_id, b.category_id, b.amount, b.period,
        b.created_at, b.updated_at,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.type as category_type,
        COALESCE(
          (SELECT SUM(ABS(t.amount)) 
           FROM transactions t 
           WHERE t.category_id = b.category_id 
           AND t.user_id = b.user_id
           AND t.type = 'expense'
           AND CASE 
             WHEN b.period = 'weekly' THEN t.date >= CURRENT_DATE - INTERVAL '7 days'
             WHEN b.period = 'monthly' THEN t.date >= DATE_TRUNC('month', CURRENT_DATE)
             WHEN b.period = 'yearly' THEN t.date >= DATE_TRUNC('year', CURRENT_DATE)
           END
          ), 0
        ) as spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      ...row,
      category: row.category_name ? {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon,
        type: row.category_type
      } : null
    }));
  }

  static async getById(id: number, userId: number): Promise<Budget | null> {
    const query = `
      SELECT 
        b.id, b.user_id, b.category_id, b.amount, b.period,
        b.created_at, b.updated_at,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.type as category_type,
        COALESCE(
          (SELECT SUM(ABS(t.amount)) 
           FROM transactions t 
           WHERE t.category_id = b.category_id 
           AND t.user_id = b.user_id
           AND t.type = 'expense'
           AND CASE 
             WHEN b.period = 'weekly' THEN t.date >= CURRENT_DATE - INTERVAL '7 days'
             WHEN b.period = 'monthly' THEN t.date >= DATE_TRUNC('month', CURRENT_DATE)
             WHEN b.period = 'yearly' THEN t.date >= DATE_TRUNC('year', CURRENT_DATE)
           END
          ), 0
        ) as spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = $1 AND b.user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      ...row,
      category: row.category_name ? {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon,
        type: row.category_type
      } : null
    };
  }

  static async create(budgetData: BudgetCreateData, userId: number): Promise<Budget> {
    const query = `
      INSERT INTO budgets (user_id, category_id, amount, period)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      userId,
      budgetData.category_id,
      budgetData.amount,
      budgetData.period
    ];
    
    const result = await pool.query(query, values);
    const createdBudget = result.rows[0];
    
    // Return the budget with category info and spent amount
    return await BudgetModel.getById(createdBudget.id, userId) as Budget;
  }

  static async update(id: number, budgetData: Partial<BudgetCreateData>, userId: number): Promise<Budget | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (budgetData.category_id !== undefined) {
      fields.push(`category_id = $${paramCount++}`);
      values.push(budgetData.category_id);
    }
    
    if (budgetData.amount !== undefined) {
      fields.push(`amount = $${paramCount++}`);
      values.push(budgetData.amount);
    }
    
    if (budgetData.period !== undefined) {
      fields.push(`period = $${paramCount++}`);
      values.push(budgetData.period);
    }
    
    if (fields.length === 0) {
      return await BudgetModel.getById(id, userId);
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);
    
    const query = `
      UPDATE budgets 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING id
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return await BudgetModel.getById(id, userId);
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    const query = 'DELETE FROM budgets WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount || 0) > 0;
  }

  static async getBudgetsByCategory(categoryId: number, userId: number): Promise<Budget[]> {
    const query = `
      SELECT 
        b.id, b.user_id, b.category_id, b.amount, b.period,
        b.created_at, b.updated_at,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.type as category_type,
        COALESCE(
          (SELECT SUM(ABS(t.amount)) 
           FROM transactions t 
           WHERE t.category_id = b.category_id 
           AND t.user_id = b.user_id
           AND t.type = 'expense'
           AND CASE 
             WHEN b.period = 'weekly' THEN t.date >= CURRENT_DATE - INTERVAL '7 days'
             WHEN b.period = 'monthly' THEN t.date >= DATE_TRUNC('month', CURRENT_DATE)
             WHEN b.period = 'yearly' THEN t.date >= DATE_TRUNC('year', CURRENT_DATE)
           END
          ), 0
        ) as spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.category_id = $1 AND b.user_id = $2
      ORDER BY b.created_at DESC
    `;
    
    const result = await pool.query(query, [categoryId, userId]);
    
    return result.rows.map(row => ({
      ...row,
      category: row.category_name ? {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon,
        type: row.category_type
      } : null
    }));
  }
}