import React from 'react';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatCurrencyWithSign } from '../utils/currency';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, onViewAll }) => {
  const formatDate = (dateString: string) => {
    // Extract just the date part to avoid timezone issues
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    // Create date in local timezone to avoid shifts
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions found</p>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'income' 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {transaction.type === 'income' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">
                    {transaction.category?.name} • {formatDate(transaction.transaction_date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'income' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrencyWithSign(transaction.amount)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      {transactions.length > 0 && (
        <button 
          onClick={onViewAll}
          className="w-full mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Transactions
        </button>
      )}
    </div>
  );
};

export default RecentTransactions;