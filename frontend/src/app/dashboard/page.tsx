'use client';

import { useAuthStore } from '@/lib/store';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, Send, Download } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const balance = user?.wallet?.balance || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your wallet today</p>
      </div>

      {/* Balance Card */}
      <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium opacity-90">Total Balance</h2>
          <Wallet className="w-6 h-6 opacity-90" />
        </div>
        <div className="text-4xl font-bold mb-6">৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</div>
        <div className="flex space-x-4">
          <button className="flex-1 bg-white text-primary-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all flex items-center justify-center space-x-2">
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
          <button className="flex-1 bg-white bg-opacity-20 backdrop-blur-sm py-2 rounded-lg font-medium hover:bg-opacity-30 transition-all flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Add Money</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">This Month</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">৳ 0.00</div>
          <p className="text-sm text-green-600 mt-1">+0% from last month</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Spent</span>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">৳ 0.00</div>
          <p className="text-sm text-red-600 mt-1">+0% from last month</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Transactions</span>
            <ArrowUpRight className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <p className="text-sm text-gray-600 mt-1">This month</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton icon="💸" label="Send Money" />
          <QuickActionButton icon="📱" label="Mobile Recharge" />
          <QuickActionButton icon="💡" label="Pay Bills" />
          <QuickActionButton icon="📊" label="View Reports" />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="text-center py-12 text-gray-500">
          <p>No transactions yet</p>
          <p className="text-sm mt-2">Your transaction history will appear here</p>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all">
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}
