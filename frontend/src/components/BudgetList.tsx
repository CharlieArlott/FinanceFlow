import React, { useState, useEffect } from 'react';
import { Budget, Category } from '../types';
import { Plus, Edit2, Trash2, Target, AlertTriangle, Utensils, Car, ShoppingBag, Film, FileText, Heart, Book, Plane, Minus, DollarSign, TrendingUp } from 'lucide-react';
import BudgetForm from './BudgetForm';
import { formatCurrency } from '../utils/currency';
import { apiService } from '../services/api';

const BudgetList: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'utensils': <Utensils className="h-5 w-5" />,
      'car': <Car className="h-5 w-5" />,
      'shopping-bag': <ShoppingBag className="h-5 w-5" />,
      'film': <Film className="h-5 w-5" />,
      'file-text': <FileText className="h-5 w-5" />,
      'heart': <Heart className="h-5 w-5" />,
      'book': <Book className="h-5 w-5" />,
      'plane': <Plane className="h-5 w-5" />,
      'minus': <Minus className="h-5 w-5" />,
      'dollar-sign': <DollarSign className="h-5 w-5" />,
      'trending-up': <TrendingUp className="h-5 w-5" />,
      'plus': <Plus className="h-5 w-5" />
    };
    
    return iconMap[iconName] || <Target className="h-5 w-5" />;
  };

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const fetchBudgets = async () => {
    try {
      const fetchedBudgets = await apiService.getBudgets();
      setBudgets(fetchedBudgets);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await apiService.getCategories('expense');
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSaveBudget = async (budgetData: Omit<Budget, 'id' | 'spent'>) => {
    try {
      if (editingBudget) {
        // Update existing budget
        const updated = await apiService.updateBudget(editingBudget.id, budgetData);
        setBudgets(prev => prev.map(b => b.id === editingBudget.id ? updated : b));
      } else {
        // Add new budget
        const newBudget = await apiService.createBudget(budgetData);
        setBudgets(prev => [...prev, newBudget]);
      }

      setShowForm(false);
      setEditingBudget(undefined);
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget. Please try again.');
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDeleteBudget = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await apiService.deleteBudget(id);
        setBudgets(prev => prev.filter(b => b.id !== id));
      } catch (error) {
        console.error('Error deleting budget:', error);
        alert('Failed to delete budget. Please try again.');
      }
    }
  };

  const getProgressPercentage = (spent: number = 0, amount: number) => {
    return Math.min((spent / amount) * 100, 100);
  };

  const getProgressColor = (spent: number = 0, amount: number) => {
    const percentage = getProgressPercentage(spent, amount);
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (spent: number = 0, amount: number) => {
    const percentage = getProgressPercentage(spent, amount);
    if (percentage >= 100) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    if (percentage >= 80) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <Target className="h-5 w-5 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Budget
        </button>
      </div>

      {/* Budget Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budgeted</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(budgets.reduce((sum, budget) => sum + (Number(budget.amount) || 0), 0))}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(budgets.reduce((sum, budget) => sum + (Number(budget.spent) || 0), 0))}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(budgets.reduce((sum, budget) => sum + ((Number(budget.amount) || 0) - (Number(budget.spent) || 0)), 0))}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No budgets</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new budget.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Budget
              </button>
            </div>
          </div>
        ) : (
          budgets.map((budget) => (
            <div key={budget.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {budget.category && (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: budget.category.color + '20' }}
                      >
                        <span style={{ color: budget.category.color }}>
                          {getIconComponent(budget.category.icon)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {budget.category?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} budget
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(Number(budget.spent) || 0, Number(budget.amount) || 0)}
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spent</span>
                    <span className="font-medium">
                      {formatCurrency(Number(budget.spent) || 0)} / {formatCurrency(Number(budget.amount) || 0)}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(Number(budget.spent) || 0, Number(budget.amount) || 0)}`}
                      style={{ width: `${getProgressPercentage(Number(budget.spent) || 0, Number(budget.amount) || 0)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {getProgressPercentage(Number(budget.spent) || 0, Number(budget.amount) || 0).toFixed(1)}% used
                    </span>
                    <span className={`font-medium ${
                      ((Number(budget.amount) || 0) - (Number(budget.spent) || 0)) < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(Math.abs((Number(budget.amount) || 0) - (Number(budget.spent) || 0)))} 
                      {((Number(budget.amount) || 0) - (Number(budget.spent) || 0)) < 0 ? ' over' : ' left'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Budget Form Modal */}
      {showForm && (
        <BudgetForm
          budget={editingBudget}
          categories={categories}
          onSave={handleSaveBudget}
          onCancel={() => {
            setShowForm(false);
            setEditingBudget(undefined);
          }}
        />
      )}
    </div>
  );
};

export default BudgetList;