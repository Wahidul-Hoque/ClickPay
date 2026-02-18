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
      setNotifications(response.data.data.slice(0, 5));
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

  const statCards = [
    {
      label: 'Total Balance',
      value: '৳0.00',
      sub: 'Available balance',
      icon: Wallet,
      gradient: 'gradient-indigo',
      glow: 'shadow-glow-indigo',
      iconBg: 'bg-white/20',
    },
    {
      label: 'This Month',
      value: '৳0.00',
      sub: '+0% from last month',
      icon: TrendingUp,
      gradient: 'gradient-emerald',
      glow: 'shadow-glow-emerald',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Expenses',
      value: '৳0.00',
      sub: '-0% from last month',
      icon: TrendingDown,
      gradient: 'gradient-rose',
      glow: '',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Transactions',
      value: '0',
      sub: 'This month',
      icon: Send,
      gradient: 'gradient-violet',
      glow: 'shadow-glow-violet',
      iconBg: 'bg-white/20',
    },
  ];

  const quickActions = [
    { label: 'Send Money', href: '/dashboard/send', icon: Send, gradient: 'gradient-indigo' },
    { label: 'QR Payment', href: '/dashboard/qr', icon: QrCode, gradient: 'gradient-violet' },
    { label: 'Pay Bills', href: '/dashboard/bills', icon: CreditCard, gradient: 'gradient-emerald' },
    { label: 'History', href: '/dashboard/transactions', icon: Wallet, gradient: 'gradient-amber' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">

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
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.notification_id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-primary-50 transition-colors group cursor-default"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary-200 transition-colors">
                    <Bell className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 leading-snug">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatTime(n.created_at)}</p>
                  </div>
                </div>
              ))}
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