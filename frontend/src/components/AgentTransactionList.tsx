'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { History, Search, Filter, Loader2, ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';
import { DatePickerDialog } from '@/components/DatePickerDialog';

interface Transaction {
  transaction_id: string;
  amount: string | number;
  transaction_type: string;
  status: string;
  reference: string;
  created_at: string;
  from_name: string;
  from_phone: string;
  to_name: string;
  to_phone: string;
  direction: 'debit' | 'credit';
}

function useOutsideClick(ref: any, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

export default function AgentTransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
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
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(typeDropdownRef, () => setIsTypeDropdownOpen(false));

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('limit', '10');
        if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
        if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);
        if (activeFilters.type !== 'all') params.append('type', activeFilters.type);

        const res = await api.get(`/transactions/history?${params.toString()}`);
        setTransactions(res.data.data);
      } catch (err) {
        console.error("Failed to fetch transaction history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [activeFilters]);

  const applyFilters = () => {
    setActiveFilters(filters);
    setIsTypeDropdownOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = { startDate: '', endDate: '', type: 'all' };
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
  };

  const handleDatePick = (dateStr: string, targetName: string) => {
    setFilters(prev => ({ ...prev, [targetName]: dateStr }));
    setDatePickerTarget(null);
  };

  const transactionTypes = [
    { label: 'All', value: 'all' },
    { label: 'Cash In', value: 'cash_in' },
    { label: 'Cash Out', value: 'cash_out' },
    { label: 'Send Money', value: 'send_money' },
    { label: 'Payment', value: 'payment' },
    { label: 'Mobile Recharge', value: 'mobile_recharge' }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fadeIn">
      <DatePickerDialog
        isOpen={datePickerTarget !== null}
        initDate={datePickerTarget ? (filters as any)[datePickerTarget] : ''}
        targetName={datePickerTarget}
        onCancel={() => setDatePickerTarget(null)}
        onOk={handleDatePick}
      />

      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 rounded-2xl">
          <History className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-500 text-sm">Review all your processed transactions</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">From Date</label>
          <div 
            onClick={() => setDatePickerTarget('startDate')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">{filters.startDate || "Select Date"}</span>
          </div>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">To Date</label>
          <div 
            onClick={() => setDatePickerTarget('endDate')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">{filters.endDate || "Select Date"}</span>
          </div>
        </div>

        <div className="flex-1 min-w-[180px] relative" ref={typeDropdownRef}>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Type</label>
          <div
            className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all"
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
          >
            <span className="text-sm text-slate-600">
              {transactionTypes.find(t => t.value === filters.type)?.label}
            </span>
            <Filter className="w-3 h-3 text-slate-400" />
          </div>

          {isTypeDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 animate-slideIn">
              {transactionTypes.map((type) => (
                <div
                  key={type.value}
                  className={`px-4 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-colors ${
                    filters.type === type.value ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
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
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm whitespace-nowrap"
          >
            Show Results
          </button>
          <button
            onClick={clearFilters}
            className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Gathering records...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Dir</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient/Source</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110 ${
                        tx.direction === 'credit' ? 'bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100' : 'bg-rose-100 text-rose-600 shadow-sm shadow-rose-100'
                      }`}>
                        {tx.direction === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900 capitalize text-sm mb-0.5">
                        {tx.transaction_type.replace('_', ' ')}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">#{tx.transaction_id} • {new Date(tx.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-700 text-sm">
                        {tx.direction === 'credit' ? (tx.from_name || 'System') : (tx.to_name || 'System')}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium font-mono tracking-tighter">
                        {tx.direction === 'credit' ? tx.from_phone : tx.to_phone}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className={`text-lg font-black font-mono ${
                        tx.direction === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {tx.direction === 'credit' ? '+' : '-'}৳{Number(tx.amount).toLocaleString()}
                      </p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-slate-900 font-bold text-lg">No records found</h3>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or checking a different date range.</p>
          </div>
        )}
      </div>
    </div>
  );
}
