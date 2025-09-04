import express from 'express';
import { TransactionModel } from '../models/Transaction';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const transactions = await TransactionModel.getAll(userId);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    
    const transaction = await TransactionModel.getById(id, userId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create new transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const transactionData = {
      category_id: req.body.category_id || undefined,
      amount: parseFloat(req.body.amount),
      description: req.body.description,
      transaction_date: req.body.transaction_date,
      type: req.body.type,
      payment_method: req.body.payment_method || undefined,
      receipt_url: req.body.receipt_url || undefined,
      tags: req.body.tags || []
    };

    // Validation
    if (!transactionData.description || !transactionData.transaction_date || !transactionData.type) {
      return res.status(400).json({ error: 'Description, date, and type are required' });
    }

    if (isNaN(transactionData.amount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!['income', 'expense'].includes(transactionData.type)) {
      return res.status(400).json({ error: 'Type must be income or expense' });
    }

    const newTransaction = await TransactionModel.create(transactionData, userId);
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const updateData: any = {};
    
    if (req.body.category_id !== undefined) updateData.category_id = req.body.category_id;
    if (req.body.amount !== undefined) updateData.amount = parseFloat(req.body.amount);
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.transaction_date !== undefined) updateData.transaction_date = req.body.transaction_date;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.payment_method !== undefined) updateData.payment_method = req.body.payment_method;
    if (req.body.receipt_url !== undefined) updateData.receipt_url = req.body.receipt_url;
    if (req.body.tags !== undefined) updateData.tags = req.body.tags;

    const updatedTransaction = await TransactionModel.update(id, updateData, userId);
    
    if (!updatedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    
    const deleted = await TransactionModel.delete(id, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;