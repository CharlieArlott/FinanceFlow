import express from 'express';
import { BudgetModel } from '../models/Budget';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all budgets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const budgets = await BudgetModel.getAll(userId);
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Get budget by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid budget ID' });
    }
    
    const budget = await BudgetModel.getById(id, userId);
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// Create new budget
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const budgetData = {
      category_id: req.body.category_id,
      amount: parseFloat(req.body.amount),
      period: req.body.period || 'monthly'
    };

    // Validation
    if (!budgetData.category_id || !budgetData.amount) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    if (isNaN(budgetData.amount) || budgetData.amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!['weekly', 'monthly', 'yearly'].includes(budgetData.period)) {
      return res.status(400).json({ error: 'Period must be weekly, monthly, or yearly' });
    }

    // Check for duplicate budget (same category and period)
    const existingBudgets = await BudgetModel.getBudgetsByCategory(budgetData.category_id, userId);
    const hasConflict = existingBudgets.some(budget => budget.period === budgetData.period);

    if (hasConflict) {
      return res.status(400).json({ error: `A ${budgetData.period} budget already exists for this category` });
    }

    const newBudget = await BudgetModel.create(budgetData, userId);
    res.status(201).json(newBudget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// Update budget
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid budget ID' });
    }

    const updateData: any = {};
    
    if (req.body.category_id !== undefined) updateData.category_id = req.body.category_id;
    if (req.body.amount !== undefined) updateData.amount = parseFloat(req.body.amount);
    if (req.body.period !== undefined) updateData.period = req.body.period;

    // Validate amount if provided
    if (updateData.amount !== undefined && (isNaN(updateData.amount) || updateData.amount <= 0)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Validate period if provided
    if (updateData.period !== undefined && !['weekly', 'monthly', 'yearly'].includes(updateData.period)) {
      return res.status(400).json({ error: 'Period must be weekly, monthly, or yearly' });
    }

    const updatedBudget = await BudgetModel.update(id, updateData, userId);
    
    if (!updatedBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(updatedBudget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// Delete budget
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid budget ID' });
    }
    
    const deleted = await BudgetModel.delete(id, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// Get budgets by category
router.get('/category/:categoryId', authenticateToken, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const userId = req.user!.id;
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    
    const budgets = await BudgetModel.getBudgetsByCategory(categoryId, userId);
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets by category:', error);
    res.status(500).json({ error: 'Failed to fetch budgets by category' });
  }
});

export default router;