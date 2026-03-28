'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DatePickerDialog } from '@/components/DatePickerDialog';
import { Search, MapPin, Calendar, ChevronDown, Trophy, ArrowLeft, ArrowUpRight, ArrowDownLeft, Send, Download, History, ArrowRightLeft } from 'lucide-react';

function useOnClickOutside(ref: any, handler: any) {
  useEffect(() => {
    const listener = (event: any) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => { document.removeEventListener("mousedown", listener); document.removeEventListener("touchstart", listener); };
  }, [ref, handler]);
}

export default function UserHistoryPage() {
    const { id } = useParams();
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        transactionTypes: [] as string[]
    });
    const [activeFilters, setActiveFilters] = useState(filters);
    const [datePickerTarget, setDatePickerTarget] = useState<string | null>(null);

    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const typeDropdownRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(typeDropdownRef, () => setIsTypeDropdownOpen(false));

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                
                const params = new URLSearchParams();
                if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
                if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);
                if (activeFilters.transactionTypes.length > 0) {
                    params.append('types', activeFilters.transactionTypes.join(','));
                }
                
                const res = await fetch(`http://localhost:5000/api/v1/admin/users/transactions?${params.toString()}`, { headers });
                const json = await res.json();
                if (json.success) {
                    setTransactions(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch transactions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [id, activeFilters]);

    const handleCheckboxChange = (type: string) => {
        setFilters(prev => {
            const types = prev.transactionTypes.includes(type)
                ? prev.transactionTypes.filter(t => t !== type)
                : [...prev.transactionTypes, type];
            return { ...prev, transactionTypes: types };
        });
    };

    const applyFilters = () => {
        setActiveFilters(filters);
        setIsTypeDropdownOpen(false);
    };

    const clearFilters = () => {
        const emptyFilters = { startDate: '', endDate: '', transactionTypes: [] };
        setFilters(emptyFilters);
        setActiveFilters(emptyFilters);
        setIsTypeDropdownOpen(false);
    };

    const handleDatePick = (dateStr: string, targetName: string) => {
        setFilters(prev => ({ ...prev, [targetName]: dateStr }));
        setDatePickerTarget(null);
    };

    const txTypeLabels: any = {
        cash_in: 'Cash In',
        cash_out: 'Cash Out',
        send_money: 'Send Money',
        add_money: 'Add Money',
        request_payment: 'Request Money',
        agent_fee: 'Agent Fee',
        platform_fee: 'Platform Fee'
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <DatePickerDialog
                isOpen={datePickerTarget !== null}
                initDate={datePickerTarget ? (filters as any)[datePickerTarget] : ''}
                targetName={datePickerTarget || ''}
                onCancel={() => setDatePickerTarget(null)}
                onOk={handleDatePick}
                theme="indigo"
            />
            
            {/* Nav */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-3xl border-b border-slate-200 supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button onClick={() => router.push('/admin')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-colors font-bold text-sm shadow-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-slate-100 text-slate-500 font-bold uppercase tracking-widest text-[10px] rounded-xl">User ID #{id}</div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-2xl">
                            <History className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Transaction Ledger</h1>
                            <p className="text-slate-500 font-medium text-sm">Reviewing financial logs and activity for this user</p>
                        </div>
                    </div>
                </div>

                {/* Filter Block matching AgentRankingList */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px] relative" ref={typeDropdownRef}>
                        <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Transaction Type</label>
                        <div 
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer flex justify-between items-center hover:bg-slate-100 transition-all font-bold text-sm text-slate-700 h-[46px]"
                            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                        >
                            <span className="truncate">
                                {filters.transactionTypes.length === 0 
                                    ? "All Types" 
                                    : filters.transactionTypes.map(t => txTypeLabels[t] || t).join(', ')}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
                        {isTypeDropdownOpen && (
                            <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden p-2">
                                <div className="max-h-64 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                    {['cash_in', 'cash_out', 'send_money', 'add_money', 'request_payment', 'agent_fee', 'platform_fee'].map(type => (
                                        <label key={type} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                                            <div className="relative flex items-center justify-center w-5 h-5 rounded-md border border-slate-300 group-hover:border-indigo-400">
                                                <input 
                                                    type="checkbox" 
                                                    className="peer opacity-0 absolute w-full h-full cursor-pointer"
                                                    checked={filters.transactionTypes.includes(type)}
                                                    onChange={() => handleCheckboxChange(type)}
                                                />
                                                <div className="pointer-events-none absolute scale-50 opacity-0 peer-checked:scale-100 peer-checked:opacity-100 transition-all text-indigo-600">✓</div>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-widest text-[10px]">{txTypeLabels[type]}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">From Date</label>
                        <input
                            type="text"
                            readOnly
                            name="startDate"
                            placeholder="Select Date"
                            value={filters.startDate}
                            onClick={() => setDatePickerTarget('startDate')}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer font-bold text-sm text-slate-700 h-[46px]"
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">To Date</label>
                        <input
                            type="text"
                            readOnly
                            name="endDate"
                            placeholder="Select Date"
                            value={filters.endDate}
                            onClick={() => setDatePickerTarget('endDate')}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer font-bold text-sm text-slate-700 h-[46px]"
                        />
                    </div>
                    <div className="flex gap-2 min-w-[200px] items-center">
                        <button 
                            onClick={clearFilters}
                            className="px-6 py-3 h-[46px] font-black text-xs text-slate-500 hover:bg-slate-100 bg-white border border-slate-200 rounded-xl transition-all"
                        >
                            Reset
                        </button>
                        <button 
                            onClick={applyFilters}
                            className="flex-1 px-6 py-3 h-[46px] font-black text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-xl transition-all"
                        >
                            Execute
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-5">Date & Time</th>
                                <th className="px-8 py-5">Type</th>
                                <th className="px-8 py-5">Entity Flow</th>
                                <th className="px-8 py-5 text-right">Amount</th>
                                <th className="px-8 py-5">Ref / Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold animate-pulse">Scanning ledgers...</td></tr>
                            ) : transactions.length > 0 ? (
                                transactions.map((t, idx) => {
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-all font-medium group">
                                            <td className="px-8 py-5 text-xs font-bold text-slate-500 whitespace-nowrap">
                                                {new Date(t.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year:'numeric', hour: '2-digit', minute:'2-digit' })}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                                    {txTypeLabels[t.transaction_type] || t.transaction_type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 flex items-center gap-2">
                                                        {t.sender_name || 'System'} <ArrowRightLeft className="w-3 h-3 text-slate-300"/> {t.receiver_name || 'System'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.sender_phone || 'N/A'} ➔ {t.receiver_phone || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 font-black text-slate-800 text-right">
                                                ৳{parseFloat(t.amount).toFixed(2)}
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Charge: ৳{parseFloat(t.charge_amount || 0).toFixed(2)}</div>
                                            </td>
                                            <td className="px-8 py-5 text-xs text-slate-400 font-bold max-w-[150px] truncate">
                                                {t.reference || '-'}
                                                <div className="text-[9px] uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-all text-slate-300">TXN ID: {t.transaction_id}</div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No transaction history found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
