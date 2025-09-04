import pool from './database';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string; // Optional for return objects (we don't want to send password back)
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface UserLoginData {
  username: string;
  password: string;
}

export class UserModel {
  static async create(userData: UserRegistrationData): Promise<Omit<User, 'password_hash'>> {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Generate username from email if not provided
    const username = userData.username || userData.email.split('@')[0];

    const query = `
      INSERT INTO users (username, email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, first_name, last_name, created_at, updated_at
    `;

    const values = [
      username,
      userData.email.toLowerCase(),
      hashedPassword,
      userData.first_name || null,
      userData.last_name || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  static async findById(id: number): Promise<Omit<User, 'password_hash'> | null> {
    const query = 'SELECT id, username, email, first_name, last_name, created_at, updated_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  static async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updateProfile(id: number, updateData: Partial<UserRegistrationData>): Promise<Omit<User, 'password_hash'> | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.first_name !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(updateData.first_name);
    }

    if (updateData.last_name !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(updateData.last_name);
    }

    if (updateData.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updateData.email.toLowerCase());
    }

    if (updateData.username !== undefined) {
      fields.push(`username = $${paramCount++}`);
      values.push(updateData.username);
    }

    if (updateData.password !== undefined) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      fields.push(`password_hash = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  static async emailExists(email: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE email = $1';
    const result = await pool.query(query, [email.toLowerCase()]);
    return result.rows.length > 0;
  }
}