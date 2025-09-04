import pool from './database';

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
  user_id?: number;
}

export class CategoryModel {
  static async getAll(): Promise<Category[]> {
    const query = `
      SELECT * FROM categories 
      ORDER BY type, name
    `;
    
    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      type: row.type
    }));
  }

  static async getByType(type: 'income' | 'expense'): Promise<Category[]> {
    const query = `
      SELECT * FROM categories 
      WHERE type = $1
      ORDER BY 
        CASE 
          WHEN name IN ('Other Expenses', 'Other Income') THEN 1 
          ELSE 0 
        END,
        name
    `;
    
    const result = await pool.query(query, [type]);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      type: row.type
    }));
  }

  static async create(category: Omit<Category, 'id'>, userId: number = 1): Promise<Category> {
    const query = `
      INSERT INTO categories (user_id, name, color, icon, type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [userId, category.name, category.color, category.icon, category.type];
    const result = await pool.query(query, values);
    
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      color: result.rows[0].color,
      icon: result.rows[0].icon,
      type: result.rows[0].type,
      user_id: result.rows[0].user_id
    };
  }

  static async update(id: number, categoryData: Partial<Omit<Category, 'id'>>, userId: number = 1): Promise<Category | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (categoryData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(categoryData.name);
    }
    
    if (categoryData.color !== undefined) {
      fields.push(`color = $${paramCount++}`);
      values.push(categoryData.color);
    }
    
    if (categoryData.icon !== undefined) {
      fields.push(`icon = $${paramCount++}`);
      values.push(categoryData.icon);
    }
    
    if (categoryData.type !== undefined) {
      fields.push(`type = $${paramCount++}`);
      values.push(categoryData.type);
    }
    
    if (fields.length === 0) {
      // No fields to update, just return the existing category
      const selectQuery = 'SELECT * FROM categories WHERE id = $1 AND (user_id IS NULL OR user_id = $2)';
      const selectResult = await pool.query(selectQuery, [id, userId]);
      return selectResult.rows.length > 0 ? selectResult.rows[0] : null;
    }
    
    // fields.push(`updated_at = CURRENT_TIMESTAMP`); // Remove this line as categories table might not have updated_at column
    values.push(id, userId);
    
    const query = `
      UPDATE categories 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount++} AND (user_id IS NULL OR user_id = $${paramCount++})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      color: result.rows[0].color,
      icon: result.rows[0].icon,
      type: result.rows[0].type,
      user_id: result.rows[0].user_id
    };
  }
}