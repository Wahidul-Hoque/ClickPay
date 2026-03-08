'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Trash2 } from 'lucide-react';
import { transactionAPI } from '@/lib/api';
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

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getHistory({ page: 1, limit: 5 });
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours || 12; // the hour '0' should be '12'
    const strHours = String(hours).padStart(2, '0');

    return `${strHours}:${minutes}${ampm} ${day}/${month}/${year}`;
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-slate-700" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-[500px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.map((t) => {
                    const directionName = t.direction === 'credit' ? t.from_name : t.to_name;
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
                        key={`drop-${t.transaction_id}`}
                        className="p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {displayType}
                            </p>
                            <p className="text-[13px] text-slate-500 mt-0.5 truncate">
                              {isCredit ? ` ${directionName}` : `To: ${directionName}`}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {formatTime(t.created_at)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${isCredit ? 'text-[#1D8260]' : 'text-[#A0202F]'}`}>
                              {isCredit ? '+' : '-'}৳{parseFloat(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-3 bg-slate-50/50">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full py-2 text-center text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-semibold"
              >
                View All Activity
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}