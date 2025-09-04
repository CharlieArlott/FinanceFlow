import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { DashboardStats, Transaction } from '../types';
import TransactionChart from './TransactionChart';
import RecentTransactions from './RecentTransactions';
import { formatCurrency } from '../utils/currency';
import { apiService } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    transactionCount: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const transactions = await apiService.getTransactions();
      
      // Calculate stats from real transaction data
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const netIncome = totalIncome - totalExpenses;
      
      const calculatedStats: DashboardStats = {
        totalIncome,
        totalExpenses,
        netIncome,
        transactionCount: transactions.length
      };

      // Get recent transactions (last 3)
      const recent = transactions.slice(0, 3);

      setStats(calculatedStats);
      setAllTransactions(transactions);
      setRecentTransactions(recent);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    amount: number;
    icon: React.ReactNode;
    color: string;
    isCount?: boolean;
  }> = ({ title, amount, icon, color, isCount = false }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {isCount ? amount.toString() : formatCurrency(amount)}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')}`}>
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Income"
          amount={stats.totalIncome}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          color="text-green-600"
        />
        <StatCard
          title="Total Expenses"
          amount={stats.totalExpenses}
          icon={<TrendingDown className="h-6 w-6 text-red-600" />}
          color="text-red-600"
        />
        <StatCard
          title="Net Income"
          amount={stats.netIncome}
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          color={stats.netIncome >= 0 ? "text-green-600" : "text-red-600"}
        />
        <StatCard
          title="Transactions"
          amount={stats.transactionCount}
          icon={<Activity className="h-6 w-6 text-purple-600" />}
          color="text-purple-600"
          isCount={true}
        />
      </div>

      {/* Charts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionChart transactions={allTransactions} />
        <RecentTransactions 
          transactions={recentTransactions} 
          onViewAll={() => navigate('/transactions')}
        />
      </div>
    </div>
  );
};

export default Dashboard;