import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { apiService } from '../services/api';
import { Transaction } from '../types';

const Analytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('1month');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [incomeVsExpenseData, setIncomeVsExpenseData] = useState<any[]>([]);
  const [insights, setInsights] = useState<{
    topCategory: { name: string; amount: number } | null;
    avgDailySpending: number;
    totalSaved: number;
  }>({
    topCategory: null,
    avgDailySpending: 0,
    totalSaved: 0
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const fetchedTransactions = await apiService.getTransactions();
      
      // Filter transactions by selected period
      const filteredTransactions = filterTransactionsByPeriod(fetchedTransactions, selectedPeriod);
      setTransactions(filteredTransactions);
      
      // Calculate analytics from filtered data
      calculateCategoryData(filteredTransactions);
      calculateIncomeVsExpenseData(filteredTransactions);
      calculateInsights(filteredTransactions);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setLoading(false);
    }
  };

  const filterTransactionsByPeriod = (transactions: Transaction[], period: string) => {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 6);
    }

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.transaction_date.split('T')[0]);
      return transactionDate >= startDate && transactionDate <= now;
    });
  };

  const calculateCategoryData = (transactions: Transaction[]) => {
    const categoryTotals: { [key: string]: { value: number; color: string; name: string } } = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        if (transaction.category) {
          const categoryName = transaction.category.name;
          if (!categoryTotals[categoryName]) {
            categoryTotals[categoryName] = {
              name: categoryName,
              value: 0,
              color: transaction.category.color
            };
          }
          categoryTotals[categoryName].value += Math.abs(transaction.amount);
        }
      });

    setCategoryData(Object.values(categoryTotals));
  };

  const calculateIncomeVsExpenseData = (transactions: Transaction[]) => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    setIncomeVsExpenseData([
      { name: 'Income', value: totalIncome, color: '#10B981' },
      { name: 'Expenses', value: totalExpenses, color: '#EF4444' },
    ]);
  };

  const calculateInsights = (transactions: Transaction[]) => {
    // Calculate top spending category
    const categoryTotals: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense' && t.category)
      .forEach(transaction => {
        const categoryName = transaction.category!.name;
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Math.abs(transaction.amount);
      });

    const topCategory = Object.entries(categoryTotals).length > 0 
      ? Object.entries(categoryTotals).reduce((max, [name, amount]) => 
          amount > max.amount ? { name, amount } : max
        , { name: '', amount: 0 })
      : null;

    // Calculate average daily spending
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const daysDiff = Math.max(1, getDaysDifference(selectedPeriod));
    const avgDailySpending = totalExpenses / daysDiff;

    // Calculate total saved (income - expenses)
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalSaved = totalIncome - totalExpenses;

    setInsights({
      topCategory,
      avgDailySpending,
      totalSaved
    });
  };

  const getDaysDifference = (period: string): number => {
    switch (period) {
      case '1month': return 30;
      case '3months': return 90;
      case '6months': return 180;
      case '1year': return 365;
      default: return 30;
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
    icon: React.ReactNode;
  }> = ({ title, value, change, changeType, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className={`text-sm flex items-center mt-1 ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'positive' ? 
              <TrendingUp className="h-4 w-4 mr-1" /> : 
              <TrendingDown className="h-4 w-4 mr-1" />
            }
            {change}
          </p>
        </div>
        <div className="p-3 rounded-full bg-blue-100">
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show message when no transactions in selected period
  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
        
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No data for selected period</h3>
          <p className="text-gray-600 mb-4">
            There are no transactions in the selected time period. 
            Try selecting a different period or add some transactions.
          </p>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Income"
          value={formatCurrency(incomeVsExpenseData.find(d => d.name === 'Income')?.value || 0)}
          change="Based on all transactions"
          changeType="positive"
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(incomeVsExpenseData.find(d => d.name === 'Expenses')?.value || 0)}
          change="Based on all transactions"
          changeType="negative"
          icon={<TrendingDown className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Net Savings"
          value={formatCurrency((incomeVsExpenseData.find(d => d.name === 'Income')?.value || 0) - (incomeVsExpenseData.find(d => d.name === 'Expenses')?.value || 0))}
          change="Income minus expenses"
          changeType="positive"
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Total Transactions"
          value={transactions.length.toString()}
          change="All recorded transactions"
          changeType="positive"
          icon={<Calendar className="h-6 w-6 text-blue-600" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incomeVsExpenseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {incomeVsExpenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Net Savings</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency((incomeVsExpenseData.find(d => d.name === 'Income')?.value || 0) - (incomeVsExpenseData.find(d => d.name === 'Expenses')?.value || 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Savings Rate</p>
              <p className="text-xl font-bold text-blue-600">
                {incomeVsExpenseData.find(d => d.name === 'Income')?.value ? 
                  `${(((incomeVsExpenseData.find(d => d.name === 'Income')?.value || 0) - (incomeVsExpenseData.find(d => d.name === 'Expenses')?.value || 0)) / (incomeVsExpenseData.find(d => d.name === 'Income')?.value || 1) * 100).toFixed(1)}%` 
                  : '0%'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Spending by Category */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h3>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Add more transactions to see monthly trends</p>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-green-800">Income Transactions</span>
              <span className="text-green-600 font-bold">{transactions.filter(t => t.type === 'income').length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="font-medium text-red-800">Expense Transactions</span>
              <span className="text-red-600 font-bold">{transactions.filter(t => t.type === 'expense').length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-blue-800">Categories Used</span>
              <span className="text-blue-600 font-bold">{categoryData.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Insights */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Top Spending Category</h4>
            <p className="text-2xl font-bold text-blue-600">
              {insights.topCategory?.name || 'No data'}
            </p>
            <p className="text-sm text-blue-700">
              {insights.topCategory ? formatCurrency(insights.topCategory.amount) : '0.00'} this period
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900">Net Savings</h4>
            <p className={`text-2xl font-bold ${insights.totalSaved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(insights.totalSaved))}
            </p>
            <p className="text-sm text-green-700">
              {insights.totalSaved >= 0 ? 'Saved' : 'Overspent'} this period
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900">Average Daily Spending</h4>
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrency(insights.avgDailySpending)}
            </p>
            <p className="text-sm text-yellow-700">
              Based on selected period
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;