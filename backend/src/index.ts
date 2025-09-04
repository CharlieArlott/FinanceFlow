import express from 'express';
import cors from 'cors';
import path from 'path';
import authRouter from './routes/auth';
import categoriesRouter from './routes/categories';
import transactionsRouter from './routes/transactions';
import budgetsRouter from './routes/budgets';
import receiptsRouter from './routes/receipts';

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/receipts', receiptsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Handle React Router routes - serve index.html for non-API routes
app.get(['/', '/dashboard', '/transactions', '/analytics', '/budgets', '/reports', '/settings'], (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;