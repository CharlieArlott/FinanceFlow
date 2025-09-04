import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { X, Plus } from 'lucide-react';
import { apiService } from '../services/api';

interface TransactionFormProps {
  transaction?: Transaction;
  onSave: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ transaction, onSave, onCancel }) => {
  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) {
      // Get current date in local timezone without any shifts
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Extract just the date part, no timezone conversion
    return dateString.split('T')[0];
  };

  const [formData, setFormData] = useState({
    amount: transaction?.amount ? Math.abs(transaction.amount).toString() : '',
    description: transaction?.description || '',
    transaction_date: formatDateForInput(transaction?.transaction_date),
    type: transaction?.type || 'expense' as 'income' | 'expense',
    category_id: transaction?.category_id || undefined,
    payment_method: transaction?.payment_method || '',
    tags: transaction?.tags || [],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  useEffect(() => {
    fetchCategories();
    fetchExistingTags();
  }, []);

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await apiService.getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchExistingTags = async () => {
    try {
      const transactions = await apiService.getTransactions();
      const allTags = new Set<string>();
      
      transactions.forEach(transaction => {
        if (transaction.tags && transaction.tags.length > 0) {
          transaction.tags.forEach(tag => allTags.add(tag.trim()));
        }
      });
      
      setExistingTags(Array.from(allTags).sort());
    } catch (error) {
      console.error('Error fetching existing tags:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? value : 
               name === 'category_id' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      console.log('Adding tag:', tag, 'to current tags:', formData.tags);
      setFormData(prev => {
        const newFormData = {
          ...prev,
          tags: [...prev.tags, tag]
        };
        console.log('New formData.tags:', newFormData.tags);
        return newFormData;
      });
      setNewTag('');
      setShowTagSuggestions(false);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTag(value);
    setShowTagSuggestions(value.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showTagSuggestions && filteredTagSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < filteredTagSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : filteredTagSuggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            handleAddTag(filteredTagSuggestions[selectedSuggestionIndex]);
          } else {
            handleAddTag();
          }
          break;
        case 'Escape':
          setShowTagSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const filteredTagSuggestions = existingTags.filter(tag => 
    tag.toLowerCase().includes(newTag.toLowerCase()) && 
    !formData.tags.includes(tag) &&
    tag.toLowerCase() !== newTag.toLowerCase()
  ).slice(0, 8); // Limit to 8 suggestions

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount) || 0;
    onSave({
      ...formData,
      amount: formData.type === 'expense' ? -Math.abs(amount) : Math.abs(amount)
    });
  };

  const filteredCategories = categories
    .filter(cat => cat.type === formData.type)
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Define categories that should be at the bottom
      const bottomCategories = ['others', 'other income'];
      const aIsBottom = bottomCategories.includes(aName);
      const bIsBottom = bottomCategories.includes(bName);
      
      // If both are bottom categories, sort them alphabetically among themselves
      if (aIsBottom && bIsBottom) {
        return a.name.localeCompare(b.name);
      }
      
      // Put bottom categories at the end
      if (aIsBottom) return 1;
      if (bIsBottom) return -1;
      
      // Sort all other categories alphabetically
      return a.name.localeCompare(b.name);
    });

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
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
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              onFocus={(e) => e.target.select()}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category_id"
              value={formData.category_id || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a category</option>
              {filteredCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <input
              type="text"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              placeholder="e.g., Cash, Credit Card, Bank Transfer"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <div className="relative">
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  onFocus={() => setShowTagSuggestions(newTag.length > 0)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                  placeholder="Add a tag"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddTag();
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {/* Tag Suggestions Dropdown */}
              {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredTagSuggestions.map((tag, index) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className={`w-full text-left px-3 py-2 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                        index === selectedSuggestionIndex 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'hover:bg-blue-50 focus:bg-blue-50'
                      }`}
                    >
                      <span className="text-sm">{tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
              {transaction ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;