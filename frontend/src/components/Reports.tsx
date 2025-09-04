import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { apiService } from '../services/api';
import { Transaction } from '../types';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);

  useEffect(() => {
    fetchReportsData();
  }, [selectedPeriod, selectedYear, selectedMonth]);

  const fetchReportsData = async () => {
    try {
      const fetchedTransactions = await apiService.getTransactions();
      const filteredTransactions = filterTransactionsByPeriod(fetchedTransactions);
      setTransactions(filteredTransactions);
      calculateCategoryBreakdown(filteredTransactions);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    }
  };

  const filterTransactionsByPeriod = (transactions: Transaction[]) => {
    return transactions.filter(transaction => {
      // Use timezone-safe date parsing
      const datePart = transaction.transaction_date.split('T')[0];
      const [year, month, day] = datePart.split('-');
      const transactionYear = parseInt(year);
      const transactionMonth = parseInt(month);
      
      // Filter by year
      if (transactionYear !== selectedYear) {
        return false;
      }
      
      // If monthly period, also filter by month
      if (selectedPeriod === 'monthly') {
        if (transactionMonth !== selectedMonth) {
          return false;
        }
      }
      
      // If yearly period, show all transactions from the selected year
      return true;
    });
  };

  const calculateCategoryBreakdown = (transactions: Transaction[]) => {
    const categoryTotals: { [key: string]: { value: number; color: string; name: string } } = {};
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
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

    const breakdown = Object.values(categoryTotals).map(category => ({
      ...category,
      percentage: totalExpenses > 0 ? (category.value / totalExpenses * 100).toFixed(1) : 0
    }));

    setCategoryBreakdown(breakdown);
  };

  const ReportCard: React.FC<{
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
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className={`text-sm flex items-center ${
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

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome * 100).toFixed(1) : '0.0';

  const getMonthName = (monthNum: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1];
  };

  const getPeriodDisplayName = () => {
    if (selectedPeriod === 'monthly') {
      return `${getMonthName(selectedMonth)} ${selectedYear}`;
    } else {
      return `${selectedYear}`;
    }
  };

  const exportToCsv = () => {
    if (transactions.length === 0) {
      alert('No data to export for the selected period.');
      return;
    }

    // Create CSV content
    const csvHeaders = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Payment Method'];
    const csvRows = transactions.map(transaction => [
      new Date(transaction.transaction_date).toLocaleDateString(),
      transaction.description,
      transaction.category?.name || 'No Category',
      transaction.type === 'income' ? 'Income' : 'Expense',
      formatCurrency(Math.abs(transaction.amount)),
      transaction.payment_method || ''
    ]);

    // Add summary rows
    csvRows.push([]); // Empty row
    csvRows.push(['Summary', '', '', '', '', '']);
    csvRows.push(['Total Income', '', '', '', formatCurrency(totalIncome), '']);
    csvRows.push(['Total Expenses', '', '', '', formatCurrency(totalExpenses), '']);
    csvRows.push(['Net Savings', '', '', '', formatCurrency(totalSavings), '']);
    csvRows.push(['Savings Rate', '', '', '', `${savingsRate}%`, '']);

    // Convert to CSV string
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filename = selectedPeriod === 'monthly' 
      ? `financial-report-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-monthly.csv`
      : `financial-report-${selectedYear}-yearly.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPdf = () => {
    if (transactions.length === 0) {
      alert('No data to export for the selected period.');
      return;
    }
    
    // For now, we'll create a simple HTML-based PDF export
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Report - ${getPeriodDisplayName()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; }
            .summary-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
            .transactions { width: 100%; border-collapse: collapse; }
            .transactions th, .transactions td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .transactions th { background-color: #f5f5f5; }
            .income { color: #059669; }
            .expense { color: #dc2626; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FinanceFlow Financial Report</h1>
            <h2>${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Report for ${getPeriodDisplayName()}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <div class="summary-item">
              <strong>Total Income:</strong>
              <span class="income">${formatCurrency(totalIncome)}</span>
            </div>
            <div class="summary-item">
              <strong>Total Expenses:</strong>
              <span class="expense">${formatCurrency(totalExpenses)}</span>
            </div>
            <div class="summary-item">
              <strong>Net Savings:</strong>
              <span>${formatCurrency(totalSavings)}</span>
            </div>
            <div class="summary-item">
              <strong>Savings Rate:</strong>
              <span>${savingsRate}%</span>
            </div>
          </div>

          <h3>Transactions</h3>
          <table class="transactions">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(transaction => `
                <tr>
                  <td>${new Date(transaction.transaction_date).toLocaleDateString()}</td>
                  <td>${transaction.description}</td>
                  <td>${transaction.category?.name || 'No Category'}</td>
                  <td>${transaction.type === 'income' ? 'Income' : 'Expense'}</td>
                  <td class="${transaction.type}">${formatCurrency(Math.abs(transaction.amount))}</td>
                  <td>${transaction.payment_method || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="monthly">Monthly Report</option>
            <option value="yearly">Yearly Report</option>
          </select>

          {selectedPeriod === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
            </select>
          )}

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
          </select>

          <button 
            onClick={exportToPdf}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            📄 PDF
          </button>
          <button 
            onClick={exportToCsv}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            📊 CSV
          </button>
        </div>
      </div>

      {/* No Data Message */}
      {transactions.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No data for {getPeriodDisplayName()}</h3>
          <p className="text-gray-600">
            No transactions found for the selected period. Try selecting a different {selectedPeriod === 'monthly' ? 'month' : 'year'} or add some transactions.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          change={`Income for ${getPeriodDisplayName()}`}
          changeType="positive"
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
        />
        <ReportCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          change={`Expenses for ${getPeriodDisplayName()}`}
          changeType="negative"
          icon={<TrendingDown className="h-6 w-6 text-blue-600" />}
        />
        <ReportCard
          title="Total Savings"
          value={formatCurrency(totalSavings)}
          change={`Net savings for ${getPeriodDisplayName()}`}
          changeType="positive"
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
        />
        <ReportCard
          title="Savings Rate"
          value={`${savingsRate}%`}
          change={`Savings rate for ${getPeriodDisplayName()}`}
          changeType="positive"
          icon={<Target className="h-6 w-6 text-blue-600" />}
        />
        </div>
      )}

      {/* Charts */}
      {transactions.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-green-800">Total Income</span>
              <span className="text-green-600 font-bold">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="font-medium text-red-800">Total Expenses</span>
              <span className="text-red-600 font-bold">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-blue-800">Net Savings</span>
              <span className="text-blue-600 font-bold">{formatCurrency(totalSavings)}</span>
            </div>
          </div>
        </div>

        {/* Spending by Category */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Add expense transactions to see category breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Category Breakdown Table */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryBreakdown.map((category, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;