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
  Sparkles,
  Shield,
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
        // Not an agent — redirect to appropriate dashboard
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
          <div className="w-16 h-16 rounded-2xl gradient-emerald flex items-center justify-center mx-auto mb-4 shadow-glow-emerald">
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
  ];

  const isActive = (href: string) =>
    href === '/agent' ? pathname === '/agent' : pathname.startsWith(href);

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarExpanded ? 'w-64' : 'w-[72px]'
        }`}
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-4 h-16 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <div
            className={`flex items-center gap-2.5 overflow-hidden transition-all duration-300 ${
              sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            }`}
          >
            <div className="w-8 h-8 rounded-xl gradient-emerald flex items-center justify-center shadow-glow-emerald flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg whitespace-nowrap tracking-tight">
              Click<span className="text-emerald-400">Pay</span>
              <span className="text-xs text-slate-500 ml-1">Agent</span>
            </span>
          </div>

          {!sidebarExpanded && (
            <div className="w-8 h-8 rounded-xl gradient-emerald flex items-center justify-center mx-auto shadow-glow-emerald">
              <Shield className="w-4 h-4 text-white" />
            </div>
          )}

          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 ml-1"
            aria-label="Toggle Sidebar"
          >
            {sidebarExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Agent info */}
        {sidebarExpanded && (
          <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-emerald flex items-center justify-center shadow-glow-emerald flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="overflow-hidden">
                <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                <p className="text-slate-500 text-xs truncate">{user.phone}</p>
              </div>
            </div>
            <span className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
              Agent
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!sidebarExpanded ? item.name : ''}
                className={`nav-link ${active ? 'active' : ''} ${!sidebarExpanded ? 'justify-center' : ''}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`whitespace-nowrap transition-all duration-300 ${
                    sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                  }`}
                >
                  {item.name}
                </span>
                {active && sidebarExpanded && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-3 space-y-0.5 flex-shrink-0" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <Link
            href="/agent/settings"
            title={!sidebarExpanded ? 'Settings' : ''}
            className={`nav-link ${!sidebarExpanded ? 'justify-center' : ''}`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span
              className={`whitespace-nowrap transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
              }`}
            >
              Settings
            </span>
          </Link>

          <button
            onClick={handleLogout}
            title={!sidebarExpanded ? 'Logout' : ''}
            className={`nav-link w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 ${
              !sidebarExpanded ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span
              className={`whitespace-nowrap transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          sidebarExpanded ? 'ml-64' : 'ml-[72px]'
        }`}
      >
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 px-6 lg:px-8 py-3 flex items-center justify-between"
          style={{ background: 'var(--topbar-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">Agent Panel</span>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">{user.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{user.phone}</p>
            </div>
            <div className="w-9 h-9 rounded-xl gradient-emerald flex items-center justify-center shadow-glow-emerald">
              <span className="text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}