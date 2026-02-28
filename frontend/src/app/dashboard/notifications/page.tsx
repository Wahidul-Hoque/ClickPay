'use client';

import { useState, useEffect } from 'react';
import { Bell, Trash2, RefreshCw } from 'lucide-react';
import { transactionAPI } from '@/lib/api';

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

export default function NotificationsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getHistory({ page, limit: 10 });
      setTransactions(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
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
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">All your activity notifications</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No recent notifications</p>
            <p className="text-sm text-slate-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((t) => {
              const isCredit = t.direction === 'credit';
              const directionName = isCredit ? t.from_name : t.to_name;

              let displayType = t.transaction_type.replace(/_/g, ' ');
              displayType = displayType.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

              if (t.transaction_type === 'transfer') {
                displayType = isCredit ? 'Received Money' : 'Send Money';
              } else if (t.transaction_type === 'cash_in') {
                displayType = 'Mobile Recharge';
              }

              return (
                <div
                  key={`notif-${t.transaction_id}`}
                  className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors group cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary-200 transition-colors">
                    <Bell className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-800 truncate">
                          {displayType}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {isCredit ? directionName : `To: ${directionName}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className={`font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {isCredit ? '+' : '-'}৳{parseFloat(t.amount).toFixed(2)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">{formatTime(t.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 p-4 border-t">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}