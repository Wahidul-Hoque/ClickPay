'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api, { transactionAPI, paymentMethodAPI } from '@/lib/api'; // Added paymentMethodAPI
import {
  Wallet,
  Download,
  Upload,
  TrendingUp,
  ArrowUpRight,
  Shield,
  Loader2,
  Trophy,
  History,
  Phone,
  CreditCard,
  Plus, // Added Plus
  Landmark // Added Landmark
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  profile: {
    balance: string;
    city: string;
  };
  todayStats: {
    total_tx: string;
    total_volume: string;
  };
}

export default function AgentDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [linkedCount, setLinkedCount] = useState(0); // Added for linked methods
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, historyRes, methodsRes] = await Promise.all([
        api.get('/agent/dashboard'),
        transactionAPI.getHistory({ page: 1, limit: 5 }),
        paymentMethodAPI.getMyMethods() // Fetch linked methods
      ]);
      
      if (dashRes.data.success) setStats(dashRes.data.data);
      if (historyRes.data.success) setTransactions(historyRes.data.data);
      if (methodsRes.data.success) setLinkedCount(methodsRes.data.data.length);
    } catch (error) {
      console.error('Dashboard Load Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Agent Balance',
      value: `৳${parseFloat(stats?.profile.balance || '0').toFixed(2)}`,
      sub: stats?.profile.city ? `Station: ${stats.profile.city}` : 'Available for operations',
      icon: Wallet,
      color: 'bg-emerald-500',
    },
    {
      label: 'Today\'s Cash In',
      value: `৳${parseFloat(stats?.todayStats.total_volume || '0').toFixed(2)}`,
      sub: `${stats?.todayStats.total_tx || 0} transfers completed`,
      icon: Download,
      color: 'bg-blue-500',
    },
    {
      label: 'Fees Earned',
      value: `৳${(parseFloat(stats?.todayStats.total_volume || '0') * 0.015).toFixed(2)}`,
      sub: 'Estimated commission (1.5%)',
      icon: TrendingUp,
      color: 'bg-amber-500',
    },
    {
      label: 'Linked Methods', // Replaced Rank with Payment Methods info
      value: linkedCount > 0 ? `${linkedCount} Connected` : 'Not Linked',
      sub: linkedCount > 0 ? 'Ready for Float' : 'Link Bank/Card',
      icon: Landmark,
      color: linkedCount > 0 ? 'bg-indigo-500' : 'bg-rose-500',
      link: '/dashboard/payment_methods'
    },
  ];

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome, <span className="text-emerald-600">{user?.name}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your agent station and track daily performance.</p>
        </div>
        <Link 
          href="/agent/rankings"
          className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl border border-yellow-100 hover:bg-yellow-100 transition-colors font-bold text-sm"
        >
          <Trophy className="w-4 h-4" /> notifications  
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link 
            href={card.link || '#'} 
            key={card.label} 
            className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow ${!card.link && 'cursor-default'}`}
          >
            <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{card.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
            <p className="text-slate-400 text-[10px] mt-1 font-medium">{card.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <Link href="/agent/transactions" className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:underline">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.transaction_id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.direction === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {tx.direction === 'credit' ? <Download className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <p className="font-bold text-slate-900">৳{parseFloat(tx.amount).toFixed(2)}</p>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-center text-slate-400 py-4">No recent activity.</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 text-slate-900 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-6">Quick Tools</h2>
            <div className="space-y-3">
              
              {/* INTEGRATED ADD FLOAT ACTION */}
              <Link href="/agent/payment_methods/add-money" className="flex flex-col gap-1 p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-all group">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5" />
                   </div>
                   <span className="font-bold text-emerald-900">Add Float</span>
                </div>
                <p className="text-[10px] text-emerald-600 ml-11">Transfer from Bank to Agent Wallet</p>
              </Link>

              <Link href="/agent/cash-in" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 hover:bg-emerald-500 hover:text-white transition-all font-bold">
                <Download className="w-5 h-5" /> Cash In
              </Link>
              <Link href="/agent/bills" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 hover:bg-rose-500 hover:text-white transition-all font-bold group/recalc">
                <Phone className="w-5 h-5 text-rose-500 group-hover/recalc:text-white transition-colors" /> Mobile Recharge
              </Link>
              <Link href="/agent/bills" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 hover:bg-emerald-600 hover:text-white transition-all font-bold group/bills">
                <CreditCard className="w-5 h-5 text-emerald-600 group-hover/bills:text-white transition-colors" /> Pay Bills
              </Link>
              <Link href="/agent/transactions" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 hover:bg-indigo-600 hover:text-white transition-all font-bold">
                <History className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" /> Transaction History
              </Link>
            </div>
          </div>
          
          <Shield className="absolute -right-8 -bottom-8 w-48 h-48 text-slate-100 opacity-50" />
        </div>
      </div>
    </div>
  );
}