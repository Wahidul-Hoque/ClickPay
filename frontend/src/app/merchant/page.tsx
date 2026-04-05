'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api, { transactionAPI, merchantAPI } from '@/lib/api';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Loader2,
  Trophy,
  Store,
  CreditCard,
  FileText,
  History,
  Download,
  Zap,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/toastcontext';

interface DashboardStats {
  profile: {
    balance: string;
    city: string;
    merchant_name?: string;
    subscription_expiry?: string;
  };
  todayStats: {
    total_tx: string;
    total_volume: string;
  };
  rank?: string | number;
}

export default function MerchantDashboard() {
  const toast = useToast();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, historyRes] = await Promise.all([
        merchantAPI.getDashboard(),
        transactionAPI.getHistory({ page: 1, limit: 5 })
      ]);
      
      if (dashRes.data.success) setStats(dashRes.data.data);
      if (historyRes.data.success) setTransactions(historyRes.data.data);
    } catch (err: any) {
      console.error('Merchant Dashboard Load Error:', err);
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Available Balance',
      value: `৳${parseFloat(stats?.profile?.balance || '0').toFixed(2)}`,
      sub: stats?.profile?.city ? `Main Terminal: ${stats.profile.city}` : 'Instant Settlements',
      icon: Wallet,
      color: 'bg-blue-600',
    },
    {
      label: 'Today\'s Sales',
      value: `৳${parseFloat(stats?.todayStats?.total_volume || '0').toFixed(2)}`,
      sub: `${stats?.todayStats?.total_tx || 0} customer payments`,
      icon: CreditCard,
      color: 'bg-indigo-600',
    },
    {
      label: 'Monthly Standings',
      value: stats?.rank ? `#${stats.rank}` : '#--',
      sub: stats?.rank ? 'Your performance rank' : 'Calculating rank...',
      icon: Trophy,
      color: 'bg-amber-600',
      link: '/merchant/profile'
    },
    
  ];

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome,  <span className="text-blue-600">{stats?.profile?.merchant_name || user?.name}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your merchant terminal and monitor sales velocity.</p>
        </div>
        <div className="flex items-center gap-2">
            {stats?.profile?.subscription_expiry && (
              <Link href="/merchant/subscription" className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-black text-sm transition-all hover:scale-105 ${
                new Date(stats.profile.subscription_expiry) > new Date() 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
              }`}>
                <Shield className="w-4 h-4" />
                Expiry: {new Date(stats.profile.subscription_expiry).toLocaleDateString()}
              </Link>
            )}
            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100 flex items-center gap-2 font-black text-sm">
                <Trophy className="w-4 h-4" />
                Current Rank: {stats?.rank ? `#${stats.rank}` : stats?.profile?.subscription_expiry ? '--' : 'Awaiting Activation'}
            </div>
        </div>
      </div>

      {/* Activation Alert / Upsell for New/Expired Merchants */}
      {!stats?.profile?.subscription_expiry ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-1 rounded-[2.5rem] shadow-xl animate-slideInSmall mb-8 overflow-hidden relative group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                <Store size={200} className="-rotate-12" />
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-[2.3rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/20 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 backdrop-blur-xl shadow-inner">
                        <Zap className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase italic leading-none">Activate Your Terminal</h2>
                        <p className="text-blue-100 font-bold max-w-lg leading-relaxed text-sm opacity-90">
                            Your merchant portal is ready, but your terminal is currently offline. 
                            Select a plan to start accepting customer payments today.
                        </p>
                    </div>
                </div>
                <Link 
                    href="/merchant/subscription" 
                    className="bg-white text-blue-700 px-12 py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:shadow-blue-900/40 hover:bg-blue-50 transition-all active:scale-95 shrink-0 flex items-center gap-3"
                >
                    Activate Plan <ArrowUpRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
      ) : (
        new Date(stats.profile.subscription_expiry) < new Date() && (
          <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[2.5rem] flex items-center justify-between mb-8 animate-slideInSmall shadow-sm">
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                   <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-rose-900 uppercase italic tracking-tight">Subscription Expired</h3>
                   <p className="text-rose-700 font-bold text-sm">Your sending privileges are restricted. Please renew to resume full operations.</p>
                </div>
             </div>
             <Link href="/merchant/subscription" className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-200">
                Renew Account
             </Link>
          </div>
        )
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{card.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
            <p className="text-slate-400 text-[10px] mt-1 font-medium">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Transactions</h2>
            </div>
            <Link href="/merchant/transactions" className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {transactions.length > 0 ? transactions.map((tx) => (
              <div key={tx.transaction_id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-hover hover:bg-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.direction === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {tx.direction === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm capitalize">{tx.transaction_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleTimeString()} • {tx.from_name || (tx.direction === 'credit' ? 'Customer' : 'System')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${tx.direction === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {tx.direction === 'credit' ? '+' : '-'}৳{parseFloat(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">{tx.status}</p>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-slate-400 font-medium italic">No recent transactions found.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 text-slate-900 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-6">Quick Options</h2>
            <div className="space-y-3">
              <Link href="/merchant/payment_methods" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 hover:bg-blue-600 hover:text-white transition-all font-bold">
                <TrendingUp className="w-5 h-5" /> Add Money
              </Link>
              <Link href="/merchant/transactions" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 hover:bg-indigo-600 hover:text-white transition-all font-bold">
                <FileText className="w-5 h-5" /> Transactions
              </Link>
              <Link href="/merchant/send" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 hover:bg-emerald-600 hover:text-white transition-all font-bold">
                <ArrowUpRight className="w-5 h-5" /> Send Money
              </Link>
              <Link href="/merchant/cashout" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 hover:bg-amber-600 hover:text-white transition-all font-bold">
                <Download className="w-5 h-5" /> Cash Out
              </Link>
            </div>
          </div>
          
          <Store className="absolute -right-8 -bottom-8 w-48 h-48 text-slate-100 -rotate-12" />
        </div>
      </div>
    </div>
  );
}
