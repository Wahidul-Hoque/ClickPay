'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { walletAPI, transactionAPI } from '@/lib/api';
import {
  Wallet,
  Download,
  Upload,
  TrendingUp,
  ArrowUpRight,
  Zap,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  transaction_id: string;
  amount: string;
  transaction_type: string;
  status: string;
  created_at: string;
  from_name: string;
  from_phone: string;
  to_name: string;
  to_phone: string;
  direction: 'credit' | 'debit';
}

export default function AgentDashboard() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<number>(user?.wallet?.balance || 0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
    fetchRecentTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await walletAPI.getBalance();
      if (response.data.success) setBalance(response.data.data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await transactionAPI.getHistory({ page: 1, limit: 5 });
      if (response.data.success) setTransactions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  };

  const statCards = [
    {
      label: 'Agent Balance',
      value: `৳${balance.toFixed(2)}`,
      sub: 'Available for cash-in operations',
      icon: Wallet,
      gradient: 'gradient-emerald',
      glow: 'shadow-glow-emerald',
    },
    {
      label: 'Today\'s Cash In',
      value: '৳0.00',
      sub: 'Deposits to users',
      icon: Download,
      gradient: 'gradient-indigo',
      glow: 'shadow-glow-indigo',
    },
    {
      label: 'Today\'s Cash Out',
      value: '৳0.00',
      sub: 'Withdrawals by users',
      icon: Upload,
      gradient: 'gradient-violet',
      glow: 'shadow-glow-violet',
    },
    {
      label: 'Fees Earned',
      value: '৳0.00',
      sub: '1.5% commission on cash-outs',
      icon: TrendingUp,
      gradient: 'gradient-amber',
      glow: '',
    },
  ];

  const quickActions = [
    { label: 'Cash In', href: '/agent/cash-in', icon: Download, gradient: 'gradient-emerald' },
    { label: 'Cash Out', href: '/agent/cash-out', icon: Upload, gradient: 'gradient-violet' },
    { label: 'History', href: '/agent/transactions', icon: Wallet, gradient: 'gradient-amber' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600 mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Agent Panel
          </p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome, <span className="text-emerald-600">{user?.name}</span>!
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            Manage cash-in and cash-out operations for your customers.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-sm text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Agent Active
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map(({ label, value, sub, icon: Icon, gradient, glow }) => (
          <div key={label} className={`stat-card ${gradient} ${glow} animate-slideUp`}>
            <div className="flex items-start justify-between mb-4">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{label}</p>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className="text-white/60 text-xs">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your latest agent activity</p>
            </div>
            <Link
              href="/agent/transactions"
              className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Download className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No transactions yet</p>
              <p className="text-sm text-slate-400 mt-1">Start by performing a cash-in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => {
                const isCredit = t.direction === 'credit';
                let displayType = t.transaction_type.replace(/_/g, ' ');
                displayType = displayType.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                return (
                  <div key={t.transaction_id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {isCredit ? <Download className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {isCredit ? t.from_name : t.to_name}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{displayType} • {formatTime(t.created_at)}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {isCredit ? '+' : '-'}৳{parseFloat(t.amount).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Quick Actions</h2>
          <p className="text-xs text-slate-500 mb-6">Agent operations</p>
          <div className="space-y-3">
            {quickActions.map(({ label, href, icon: Icon, gradient }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}