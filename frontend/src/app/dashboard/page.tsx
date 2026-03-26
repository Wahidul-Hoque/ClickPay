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
  QrCode,
  CreditCard,
  Zap,
  Download,
  Phone,
} from 'lucide-react';
import { transactionAPI, walletAPI } from '@/lib/api';
import Link from 'next/link';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';

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
  reference?: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnStats, setTxnStats] = useState({ total: 0, types: {} as Record<string, number> });
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [balance, setBalance] = useState<number>(user?.wallet?.balance || 0);
  const [expenses, setExpenses] = useState<number>(0);

  useEffect(() => {
    fetchRecentTransactions();
    fetchBalance();
    fetchCurrentMonthExpense();
  }, []);

  const fetchCurrentMonthExpense = async ()=> {
    try{
      const response = await walletAPI.getCurrentMonthExpenses();
      if( response.data.success){
        setExpenses(response.data.data);
      }
    } catch(error) {
      console.error('Failed to fetch current month expense:',error);
    }

  };

  const fetchBalance = async () => {
    try {
      const response = await walletAPI.getBalance();
      if (response.data.success) {
        setBalance(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await transactionAPI.getHistory({ page: 1, limit: 100 });
      if (response.data.success) {
        const allTxns = response.data.data;
        setTransactions(allTxns.slice(0, 5));

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        let total = 0;
        const types: Record<string, number> = {};

        allTxns.forEach((t: Transaction) => {
          const d = new Date(t.created_at);
          if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
            total++;
            const typeLabel = t.transaction_type.replace('_', ' ');
            // capitalize the first letter
            const capType = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
            types[capType] = (types[capType] || 0) + 1;
          }
        });

        setTxnStats({ total, types });
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };



  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  const formatCurrency = (val: any) => `৳${(Number(val) || 0).toFixed(2)}`;

  const statCards = [
    {
      label: 'Total Balance',
      value: formatCurrency(balance),
      sub: 'Available balance',
      icon: Wallet,
      gradient: 'gradient-indigo',
      glow: 'shadow-glow-indigo',
      iconBg: 'bg-white/20',
    },
    {
      label: 'This Months',
      value: formatCurrency(expenses),
      sub: '+0% from last month',
      icon: TrendingUp,
      gradient: 'gradient-emerald',
      glow: 'shadow-glow-emerald',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Expenses',
      value: formatCurrency(expenses),
      sub: '-0% from last month',
      icon: TrendingDown,
      gradient: 'gradient-rose',
      glow: '',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Transactions',
      value: txnStats.total.toString(),
      sub: Object.entries(txnStats.types)
        .map(([type, count]) => `${type}: ${count}`)
        .join(' • ') || 'No transactions this month',
      icon: Send,
      gradient: 'gradient-violet',
      glow: 'shadow-glow-violet',
      iconBg: 'bg-white/20',
    },
  ];

  const quickActions = [
    { label: 'Send Money', href: '/dashboard/send', icon: Send, gradient: 'gradient-indigo' },
    { label: 'Mobile Recharge', href: '/dashboard/bills', icon: Phone, gradient: 'gradient-rose' },
    { label: 'QR Payment', href: '/dashboard/qr', icon: QrCode, gradient: 'gradient-violet' },
    { label: 'Pay Bills', href: '/dashboard/bills', icon: CreditCard, gradient: 'gradient-emerald' },
    { label: 'History', href: '/dashboard/transactions', icon: Wallet, gradient: 'gradient-amber' },
  ];

  return (


    <div className="space-y-8 animate-fadeIn">

      {/* Transaction Summary Modal */}
      {selectedTransaction && (
        <TransactionSummaryModal
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          title="Transaction Details"
          accountLabel={selectedTransaction.direction === 'credit' ? 'From' : 'To'}
          account={selectedTransaction.direction === 'credit'
            ? (selectedTransaction.from_name || selectedTransaction.from_phone)
            : (selectedTransaction.to_name || selectedTransaction.to_phone)}
          amount={selectedTransaction.amount}
          charge="0.00"
          transactionId={selectedTransaction.reference || ''}
          reference=""
          time={selectedTransaction.created_at ? new Date(selectedTransaction.created_at).toLocaleString('en-GB') : undefined}
        />
      )}

      {/* ── Welcome ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600 mb-1 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Good day
          </p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, <span className="text-primary-600">{user?.name}</span>!
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            Here&apos;s what&apos;s happening with your wallet today.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-sm text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          All systems normal
        </div>
      </div>



      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
        {statCards.map(({ label, value, sub, icon: Icon, gradient, glow, iconBg }) => (
          <div key={label} className={`stat-card ${gradient} ${glow} animate-slideUp`}>
            <div className="flex items-start justify-between mb-4">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{label}</p>
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className="text-white/60 text-xs">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Two Column ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Transactions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your latest activity</p>
            </div>
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-semibold
                         px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Send className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No transactions yet</p>
              <p className="text-sm text-slate-400 mt-1">Start by sending money to someone</p>
              <Link
                href="/dashboard/send"
                className="btn btn-primary mt-5 text-xs"
              >
                <Send className="w-3.5 h-3.5" /> Send Money
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => {
                const isCredit = t.direction === 'credit';

                let displayType = t.transaction_type.replace(/_/g, ' ');
                displayType = displayType.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                if (t.transaction_type === 'transfer') {
                  displayType = isCredit ? 'Received Money' : 'Send Money';
                } else if (t.transaction_type === 'cash_in') {
                  displayType = 'Cash In';
                }

                return (
                  <div
                    key={`txn-${t.transaction_id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setSelectedTransaction(t)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                        {isCredit ? <ArrowUpRight className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {isCredit ? t.from_name : t.to_name}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{displayType} • {formatTime(t.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {isCredit ? '+' : '-'}৳{parseFloat(t.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-500 mt-0.5">Recent alerts</p>
            </div>
            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-semibold
                         px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => {
                const isCredit = t.direction === 'credit';

                let displayType = t.transaction_type.replace(/_/g, ' ');
                displayType = displayType.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                if (t.transaction_type === 'transfer') {
                  displayType = isCredit ? 'Received Money' : 'Send Money';
                } else if (t.transaction_type === 'cash_in') {
                  displayType = 'Cash In';
                }

                return (
                  <div
                    key={`notif-${t.transaction_id}`}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-primary-50 transition-colors group cursor-default"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary-200 transition-colors">
                      <Bell className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {displayType}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isCredit ? t.from_name : `To: ${t.to_name}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className={`text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {isCredit ? '+' : '-'}৳{parseFloat(t.amount).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatTime(t.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Frequently used features</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(({ label, href, icon: Icon, gradient }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-slate-100
                         hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200
                         hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center
                              shadow-md group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-primary-700 transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}