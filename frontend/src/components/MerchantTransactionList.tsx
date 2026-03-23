'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { History, Filter, Loader2, ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';
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

export default function MerchantTransactionList() {
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
        params.append('limit', '20');
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
    { label: 'Customer Payments', value: 'merchant_payment' },
    { label: 'Received Payments', value: 'payment' },
    { label: 'Subscription Fee', value: 'merchant_subscription' },
    { label: 'Send Money', value: 'send_money' }
  ];

  return (
    <div className="animate-fadeIn">
      <DatePickerDialog
        isOpen={datePickerTarget !== null}
        initDate={datePickerTarget ? (filters as any)[datePickerTarget] : ''}
        targetName={datePickerTarget}
        onCancel={() => setDatePickerTarget(null)}
        onOk={handleDatePick}
      />

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">From Date</label>
          <div 
            onClick={() => setDatePickerTarget('startDate')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all font-medium text-sm"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{filters.startDate || "Select"}</span>
          </div>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">To Date</label>
          <div 
            onClick={() => setDatePickerTarget('endDate')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all font-medium text-sm"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{filters.endDate || "Select"}</span>
          </div>
        </div>

        <div className="flex-1 min-w-[180px] relative" ref={typeDropdownRef}>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tx Type</label>
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
            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 animate-slideIn">
              {transactionTypes.map((type) => (
                <div
                  key={type.value}
                  className={`px-4 py-2 rounded-xl cursor-pointer text-sm font-medium transition-colors ${
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
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 text-sm whitespace-nowrap"
          >
            Filter
          </button>
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-400 font-medium">Loading ledger...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Counterparty</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto ${
                        tx.direction === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {tx.direction === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 capitalize text-sm mb-0.5">
                        {tx.transaction_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">#{tx.transaction_id.substring(0,8)} • {new Date(tx.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700 text-sm">
                        {tx.direction === 'credit' ? (tx.from_name || 'Customer') : (tx.to_name || 'System')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium tracking-tighter">
                        {tx.direction === 'credit' ? tx.from_phone : tx.to_phone}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className={`text-base font-black ${
                        tx.direction === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {tx.direction === 'credit' ? '+' : '-'}৳{parseFloat(tx.amount as any).toLocaleString()}
                      </p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
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
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-slate-900 font-bold">No results found</h3>
            <p className="text-slate-400 text-xs mt-1">Try changing your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
