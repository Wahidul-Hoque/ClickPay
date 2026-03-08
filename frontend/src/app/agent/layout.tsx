'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Wallet,
  Download,
  Upload,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trophy,
} from 'lucide-react';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (user?.role !== 'agent') {
        router.push(user?.role === 'admin' ? '/admin' : '/dashboard');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading Agent Panel…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'agent') return null;

  const navItems = [
    { name: 'Overview', href: '/agent', icon: Wallet },
    { name: 'Cash In', href: '/agent/cash-in', icon: Download },
    { name: 'Cash Out', href: '/agent/cash-out', icon: Upload },
    { name: 'Transactions', href: '/agent/transactions', icon: FileText },
    { name: 'Ranking', href: '/agent/rankings', icon: Trophy },
    { name: 'Settings', href: '/agent/settings', icon: Settings },
  ];

  const isActive = (href: string) =>
    href === '/agent' ? pathname === '/agent' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-800 ${sidebarExpanded ? 'w-64' : 'w-[72px]'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
          <div className={`flex items-center gap-2.5 overflow-hidden transition-all duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg whitespace-nowrap">
              Click<span className="text-emerald-400">Pay</span>
              <span className="text-[10px] text-slate-500 ml-1 uppercase">Agent</span>
            </span>
          </div>
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10">
            {sidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  } ${!sidebarExpanded ? 'justify-center' : ''}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarExpanded && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`min-h-screen transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-[72px]'}`}>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}