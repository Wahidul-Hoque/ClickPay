'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { 
  Wallet, 
  Send, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  Bell,
} from 'lucide-react';
import { notificationAPI } from '@/lib/api';
import Link from 'next/link';

interface Notification {
  notification_id: string;
  message: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentNotifications();
  }, []);

  const fetchRecentNotifications = async () => {
    try {
      const response = await notificationAPI.getRecent();
      setNotifications(response.data.data.slice(0, 5)); // Show only 5
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your wallet today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Balance Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Balance</h3>
            <Wallet className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">৳0.00</p>
          <p className="text-xs text-gray-500 mt-2">Available balance</p>
        </div>

        {/* Income Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">This Month</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">৳0.00</p>
          <p className="text-xs text-green-600 mt-2">+0% from last month</p>
        </div>

        {/* Expenses Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Expenses</h3>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">৳0.00</p>
          <p className="text-xs text-red-600 mt-2">-0% from last month</p>
        </div>

        {/* Transactions Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Transactions</h3>
            <Send className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            <Link 
              href="/dashboard/transactions"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="text-center py-12 text-gray-500">
            <Send className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No transactions yet</p>
            <p className="text-sm mt-2">Start by sending money to someone</p>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <Link 
              href="/dashboard/notifications"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(notification.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/send"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-600 transition-colors">
              <Send className="w-6 h-6 text-primary-600 group-hover:text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">Send Money</span>
          </Link>

          <Link
            href="/dashboard/qr"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-600 transition-colors">
              <ArrowUpRight className="w-6 h-6 text-primary-600 group-hover:text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">QR Payment</span>
          </Link>

          <Link
            href="/dashboard/bills"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-600 transition-colors">
              <TrendingUp className="w-6 h-6 text-primary-600 group-hover:text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">Pay Bills</span>
          </Link>

          <Link
            href="/dashboard/transactions"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-600 transition-colors">
              <Wallet className="w-6 h-6 text-primary-600 group-hover:text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">History</span>
          </Link>
        </div>
      </div>
    </div>
  );
}