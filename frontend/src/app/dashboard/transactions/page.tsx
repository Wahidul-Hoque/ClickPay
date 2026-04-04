'use client';

import { 
  FileText, ArrowUpRight, Search, TrendingDown, LayoutList, 
  SlidersHorizontal, ChevronRight, ArrowLeft, History, Filter, 
  Loader2, Calendar 
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { transactionAPI } from '@/lib/api';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';
import { DatePickerDialog } from '@/components/DatePickerDialog';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all'
  });
  const [activeFilters, setActiveFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all'
  });
  const [datePickerTarget, setDatePickerTarget] = useState<string | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [activeFilters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let typeParam = activeFilters.type !== 'all' ? activeFilters.type : undefined;
      let directionParam = undefined;

      // Special handling for Sent/Received labels which share 'transfer' type
      if (activeFilters.type === 'sent') {
        typeParam = 'transfer';
        directionParam = 'debit';
      } else if (activeFilters.type === 'received') {
        typeParam = 'transfer';
        directionParam = 'credit';
      }

      const params = {
        page: 1,
        limit: 50,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
        type: typeParam,
        direction: directionParam
      };
      
      const response = await transactionAPI.getHistory(params);
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setActiveFilters(filters);
    setIsTypeDropdownOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = { startDate: '', endDate: '', type: 'all' };
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setSearchQuery('');
  };

  const handleDatePick = (dateStr: string, targetName: string) => {
    setFilters(prev => ({ ...prev, [targetName]: dateStr }));
    setDatePickerTarget(null);
  };

  const transactionTypes = [
    { label: 'All', value: 'all' },
    { label: 'Sent', value: 'sent' }, 
    { label: 'Received', value: 'received' },
    { label: 'Mobile Recharge', value: 'mobile_recharge' },
    { label: 'Bill Pay', value: 'bill_pay' },
  ];

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

  // Client-side filtering by search name/type (additional to API filters)
  const filteredTransactions = transactions.filter((t) => {
    // 1. Search Filtering
    const term = searchQuery.toLowerCase();
    if (!term) return true;

    const directionName = (t.direction === 'credit' ? t.from_name : t.to_name) || '';
    const typeLabel = t.transaction_type.replace(/_/g, ' ');
    return (
      directionName.toLowerCase().includes(term) || 
      typeLabel.toLowerCase().includes(term) || 
      (t.reference && t.reference.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4 max-w-3xl mx-auto rounded-3xl bg-white min-h-[calc(100vh-6rem)] sm:p-4">
        <div className="mb-4 self-start">
          <Link
            href='/dashboard'
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </div>
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

      {/* Date Picker Dialog */}
      <DatePickerDialog
        isOpen={datePickerTarget !== null}
        initDate={datePickerTarget ? (filters as any)[datePickerTarget] : ''}
        targetName={datePickerTarget}
        onCancel={() => setDatePickerTarget(null)}
        onOk={handleDatePick}
      />

      {/* Filter Bar (Agent/Merchant Style) */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">From Date</label>
          <div 
            onClick={() => setDatePickerTarget('startDate')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all font-medium text-sm"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{filters.startDate || "Select"}</span>
          </div>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">To Date</label>
          <div 
            onClick={() => setDatePickerTarget('endDate')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all font-medium text-sm"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{filters.endDate || "Select"}</span>
          </div>
        </div>

        <div className="flex-1 min-w-[140px] relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Type</label>
          <div
            className="flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all font-medium text-sm"
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
          >
            <span className="text-slate-600">
              {transactionTypes.find(t => t.value === filters.type)?.label}
            </span>
            <Filter className="w-3 h-3 text-slate-400" />
          </div>

          {isTypeDropdownOpen && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 animate-slideIn">
              {transactionTypes.map((type) => (
                <div
                  key={type.value}
                  className={`px-4 py-2 rounded-xl cursor-pointer text-sm font-medium transition-colors ${
                    filters.type === type.value ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, type: type.value }));
                    setIsTypeDropdownOpen(false);
                  }}
                >
                  {type.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="px-6 py-2 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-md shadow-primary-200 text-sm whitespace-nowrap"
          >
            Apply
          </button>
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 px-4 pt-2 pb-2">
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
      </div>

      <div className="border-b border-slate-100"></div>

      <div className="px-4 py-2">
        <p className="text-[13px] font-medium text-slate-500">
          Transactions history view
        </p>
      </div>

      <div className="border-b border-slate-100"></div>

      {/* Transactions List */}
      <div className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
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

              const firstLetter = directionName ? directionName.charAt(0).toUpperCase() : 'O';
              const circleBgClass = isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600';

              let displayType = t.transaction_type.replace(/_/g, ' ');
              displayType = displayType.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

              if (t.transaction_type === 'transfer') {
                displayType = isCredit ? 'Received Money' : 'Send Money';
              } else if (t.transaction_type === 'cash_in') {
                displayType = 'Cash In';
              }

              return (
                <div
                  key={t.transaction_id}
                  className="flex items-start justify-between px-4 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedTransaction(t)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center ${circleBgClass}`}>
                      {isCredit ? <ArrowUpRight className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
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
                  <div className="text-right flex flex-col items-end pt-0.5 gap-1.5">
                    <p className={`text-[15px] font-bold tracking-tight ${isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
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