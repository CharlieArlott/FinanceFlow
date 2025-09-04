import React, { useState, useEffect } from 'react';
import { Budget, Category } from '../types';
import { X } from 'lucide-react';
import { useNotification } from './NotificationSystem';

interface BudgetFormProps {
  budget?: Budget;
  categories: Category[];
  onSave: (budget: Omit<Budget, 'id' | 'spent'>) => void;
  onCancel: () => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ budget, categories, onSave, onCancel }) => {
  const { showError } = useNotification();

  const [formData, setFormData] = useState(() => {
    return {
      category_id: budget?.category_id || 0,
      amount: budget?.amount || '',
      period: budget?.period || 'monthly',
    };
  });

  // Add useEffect to handle budget changes and reset form properly
  useEffect(() => {
    setFormData({
      category_id: budget?.category_id || 0,
      amount: budget?.amount || '',
      period: budget?.period || 'monthly',
    });
  }, [budget?.id]); // Only trigger when budget ID changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? value : 
               name === 'category_id' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.category_id === 0) {
      showError('Category required', 'Please select a category');
      return;
    }

    const amount = parseFloat(formData.amount as string);
    if (isNaN(amount) || amount <= 0) {
      showError('Invalid amount', 'Please enter a valid amount greater than 0');
      return;
    }

    const budgetData = {
      ...formData,
      amount: parseFloat(formData.amount as string),
    };
    
    onSave(budgetData);
  };

  // Filter out categories that already have budgets (except current one being edited)
  const availableCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {budget ? 'Edit Budget' : 'Create Budget'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={0}>Select a category</option>
              {availableCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Budget Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              placeholder="Enter budget amount"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Budget Period</label>
            <select
              name="period"
              value={formData.period}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              How often this budget resets
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              {budget ? 'Update' : 'Create'} Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;