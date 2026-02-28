'use client';

import { FileText, ArrowUpRight, Search, TrendingDown, LayoutList, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  reference: string;
  direction: 'credit' | 'debit';
}

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Fetch a larger limit for the dedicated page
      const response = await transactionAPI.getHistory({ page: 1, limit: 50 });
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format time similar to the screenshot: 02:48am 28/02/26
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

  // Client-side filtering by tab, then by search name/type
  const filteredTransactions = transactions.filter((t) => {
    // 1. Tab Filtering
    if (activeTab === 'Sent' && t.direction !== 'debit') return false;
    if (activeTab === 'Received' && t.direction !== 'credit') return false;
    if (activeTab === 'Mobile Recharge' && t.transaction_type !== 'mobile_recharge') return false;
    if (activeTab === 'Bill' && t.transaction_type !== 'bill_pay') return false;

    // 2. Search Filtering
    const term = searchQuery.toLowerCase();
    if (!term) return true;

    const directionName = t.direction === 'credit' ? t.from_name : t.to_name;
    const typeLabel = t.transaction_type.replace('_', ' ');
    return directionName.toLowerCase().includes(term) || typeLabel.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-4 max-w-3xl mx-auto rounded-3xl bg-white min-h-[calc(100vh-6rem)] sm:p-4">

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by TrxID or number"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-0 focus:border-primary-400 text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-rose-500 transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="text-sm font-medium">Filter{activeTab !== 'All' ? ` (${activeTab})` : ''}</span>
          </button>

          {/* Dropdown Menu */}
          {showFilters && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-10 py-2">
              {['All', 'Sent', 'Received', 'Mobile Recharge', 'Bill'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setShowFilters(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${activeTab === tab
                    ? 'bg-rose-50 text-rose-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-slate-100"></div>

      <div className="px-4 py-2">
        <p className="text-[13px] font-medium text-slate-500">
          Transactions from the last 90 days
        </p>
      </div>

      <div className="border-b border-slate-100"></div>

      {/* Transactions List */}
      <div className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <LayoutList className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((t) => {
              const directionName = t.direction === 'credit' ? t.from_name : t.to_name;
              const directionPhone = t.direction === 'credit' ? t.from_phone : t.to_phone;
              const isCredit = t.direction === 'credit';

              // Generate circle style (like the screenshot O and T colors)
              const firstLetter = directionName ? directionName.charAt(0).toUpperCase() : 'O';
              const circleBgClass = isCredit ? 'bg-[#98D298] text-white' : 'bg-[#D6A590] text-white';

              let displayType = t.transaction_type.replace(/_/g, ' ');
              displayType = displayType.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

              if (t.transaction_type === 'transfer') {
                displayType = isCredit ? 'Received Money' : 'Send Money';
              } else if (t.transaction_type === 'cash_in') {
                displayType = 'Mobile Recharge';
              }

              return (
                <div key={t.transaction_id} className="flex items-start justify-between px-4 py-4 hover:bg-slate-50 transition-colors cursor-pointer group">

                  {/* Left Icon + Middle Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-full flex shrink-0 items-center justify-center text-xl font-medium ${circleBgClass}`}>
                      {firstLetter}
                    </div>

                    <div className="min-w-0 pt-0.5">
                      <p className="text-[15px] font-medium text-slate-800 tracking-tight truncate">
                        {displayType}
                      </p>

                      <p className="text-[14px] text-slate-500 mt-1.5 truncate">
                        {displayType.includes('Send Money') || displayType.includes('Recharge') ? directionPhone : directionName}
                      </p>

                      <p className="text-[13px] text-slate-500 mt-1.5 truncate flex items-center gap-1">
                        TrxID : {t.reference || `DBR${t.transaction_id}XYZ`}
                      </p>
                    </div>
                  </div>

                  {/* Right Info + Chevron */}
                  <div className="text-right flex flex-col items-end pt-0.5 gap-1.5">
                    <p className={`text-[15px] font-medium tracking-tight ${isCredit ? 'text-[#1D8260]' : 'text-[#A0202F]'}`}>
                      {isCredit ? '+' : '-'} ৳{parseFloat(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[12px] text-slate-500 whitespace-nowrap">
                      {formatTime(t.created_at)}
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}