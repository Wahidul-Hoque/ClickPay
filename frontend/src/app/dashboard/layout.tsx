'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import NotificationBell from '@/components/NotificationBell';
import {
  Wallet,
  Send,
  Download,
  QrCode,
  CreditCard,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  
  // Sidebar is expanded by default on desktop
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!isAuthenticated) {
        router.push('/auth/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: Wallet },
    { name: 'Send Money', href: '/dashboard/send', icon: Send },
    { name: 'Transactions', href: '/dashboard/transactions', icon: FileText },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { name: 'QR Code', href: '/dashboard/qr', icon: QrCode },
    { name: 'Bills', href: '/dashboard/bills', icon: CreditCard },
    { name: 'Loans', href: '/dashboard/loans', icon: Download },
    { name: 'Savings', href: '/dashboard/savings', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white shadow-lg transition-all duration-300 ${
          sidebarExpanded ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between p-4 border-b h-16">
            <div className={`flex items-center space-x-2 overflow-hidden transition-all duration-300 ${
              sidebarExpanded ? 'w-auto' : 'w-0'
            }`}>
              <Wallet className="w-8 h-8 text-primary-600 flex-shrink-0" />
              <span className="text-xl font-bold text-primary-600 whitespace-nowrap">
                ClickPay
              </span>
            </div>
            
            {!sidebarExpanded && (
              <Wallet className="w-8 h-8 text-primary-600 mx-auto" />
            )}
            
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Toggle Sidebar"
            >
              {sidebarExpanded ? (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* User info */}
          <div className={`p-4 border-b transition-all duration-300 ${
            sidebarExpanded ? 'opacity-100' : 'opacity-0 h-0 p-0 border-0'
          }`}>
            {sidebarExpanded && (
              <>
                <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                <p className="text-sm text-gray-600 truncate">{user.phone}</p>
                <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors group ${
                  !sidebarExpanded && 'justify-center'
                }`}
                title={!sidebarExpanded ? item.name : ''}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={`whitespace-nowrap transition-all duration-300 ${
                  sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                }`}>
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="p-2 border-t space-y-1">
            <Link
              href="/dashboard/settings"
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                !sidebarExpanded && 'justify-center'
              }`}
              title={!sidebarExpanded ? 'Settings' : ''}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
              }`}>
                Settings
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
                !sidebarExpanded && 'justify-center'
              }`}
              title={!sidebarExpanded ? 'Logout' : ''}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
              }`}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content with top bar */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarExpanded ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top Bar with Notification Bell */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* You can add breadcrumbs or page title here */}
            </div>
            
            {/* Notification Bell */}
            <div className="flex items-center space-x-4">
              <NotificationBell />
              
              {/* User Avatar/Menu (Optional) */}
              <div className="flex items-center space-x-3 pl-4 border-l">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}