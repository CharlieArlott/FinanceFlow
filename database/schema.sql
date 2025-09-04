-- FinanceFlow Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS financeflow;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7), -- HEX color code
    icon VARCHAR(50),
    type VARCHAR(20) CHECK (type IN ('income', 'expense')) DEFAULT 'expense',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    period VARCHAR(20) CHECK (period IN ('monthly', 'yearly')) DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense')) NOT NULL,
    payment_method VARCHAR(50),
    receipt_url VARCHAR(255),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipts table
CREATE TABLE receipts (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default categories
INSERT INTO categories (user_id, name, color, icon, type) VALUES
(NULL, 'Food & Dining', '#FF6B6B', 'utensils', 'expense'),
(NULL, 'Transportation', '#4ECDC4', 'car', 'expense'),
(NULL, 'Shopping', '#45B7D1', 'shopping-bag', 'expense'),
(NULL, 'Entertainment', '#96CEB4', 'film', 'expense'),
(NULL, 'Bills & Utilities', '#FFEAA7', 'file-text', 'expense'),
(NULL, 'Healthcare', '#DDA0DD', 'heart', 'expense'),
(NULL, 'Education', '#FFB6C1', 'book', 'expense'),
(NULL, 'Travel', '#87CEEB', 'plane', 'expense'),
(NULL, 'Salary', '#98FB98', 'dollar-sign', 'income'),
(NULL, 'Investment', '#F0E68C', 'trending-up', 'income'),
(NULL, 'Other Income', '#D3D3D3', 'plus', 'income'),
(NULL, 'Other Expense', '#D3D3D3', 'minus', 'expense');

-- Indexes for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);