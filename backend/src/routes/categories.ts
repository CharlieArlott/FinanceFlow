import express from 'express';
import { CategoryModel } from '../models/Category';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const type = req.query.type as 'income' | 'expense' | undefined;
    
    let categories;
    if (type && ['income', 'expense'].includes(type)) {
      categories = await CategoryModel.getByType(type);
    } else {
      categories = await CategoryModel.getAll();
    }
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const categoryData = {
      name: req.body.name,
      color: req.body.color,
      icon: req.body.icon,
      type: req.body.type
    };

    // Validation
    if (!categoryData.name || !categoryData.color || !categoryData.icon || !categoryData.type) {
      return res.status(400).json({ error: 'Name, color, icon, and type are required' });
    }

    if (!['income', 'expense'].includes(categoryData.type)) {
      return res.status(400).json({ error: 'Type must be income or expense' });
    }

    const newCategory = await CategoryModel.create(categoryData, userId);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const updateData: any = {};
    
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.color !== undefined) updateData.color = req.body.color;
    if (req.body.icon !== undefined) updateData.icon = req.body.icon;
    if (req.body.type !== undefined) updateData.type = req.body.type;

    // Validate type if provided
    if (updateData.type && !['income', 'expense'].includes(updateData.type)) {
      return res.status(400).json({ error: 'Type must be income or expense' });
    }

    const updatedCategory = await CategoryModel.update(id, updateData, userId);
    
    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

export default router;