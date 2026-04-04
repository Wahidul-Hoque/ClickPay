'use client';

import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, 
    History, 
    Calendar, 
    ChevronLeft, 
    ChevronRight,
    Loader2,
    Filter,
    RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';
import { DatePickerDialog } from '@/components/DatePickerDialog';

export default function AdminAuditLogsPage() {
    const toast = useToast();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [datePickerTarget, setDatePickerTarget] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const result = await adminApi.getAuditLogs({
                startDate,
                endDate,
                page,
                limit
            });
            if (result.success) {
                setLogs(result.data);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, startDate, endDate]);

    const handleDatePick = (dateStr: string, targetName: string) => {
        if (targetName === 'startDate') setStartDate(dateStr);
        else if (targetName === 'endDate') setEndDate(dateStr);
        setDatePickerTarget(null);
        setPage(1); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-24 lg:p-12 lg:pt-32">
            <DatePickerDialog 
                isOpen={datePickerTarget !== null}
                onCancel={() => setDatePickerTarget(null)}
                onOk={handleDatePick}
                targetName={datePickerTarget}
                initDate={datePickerTarget === 'startDate' ? startDate : endDate}
            />

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-10 gap-6">
                    <div className="flex items-center gap-6">
                        <Link 
                            href="/admin" 
                            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                        >
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <History className="text-indigo-600 w-4 h-4" />
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">System Audit History</h1>
                            </div>
                            <p className="text-slate-500 font-medium">Trace administrative actions and system modifications</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div 
                            onClick={() => setDatePickerTarget('startDate')}
                            className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:border-indigo-200 transition-all shadow-sm group"
                        >
                            <Calendar size={16} className="text-slate-400 group-hover:text-indigo-500" />
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">From</p>
                                <p className="text-xs font-black text-slate-700">{startDate || 'Any Time'}</p>
                            </div>
                        </div>

                        <div 
                            onClick={() => setDatePickerTarget('endDate')}
                            className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:border-indigo-200 transition-all shadow-sm group"
                        >
                            <Calendar size={16} className="text-slate-400 group-hover:text-indigo-500" />
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">To</p>
                                <p className="text-xs font-black text-slate-700">{endDate || 'Present'}</p>
                            </div>
                        </div>

                        {(startDate || endDate) && (
                            <button 
                                onClick={clearFilters}
                                className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                title="Clear Filters"
                            >
                                <RefreshCcw size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Decrypting Event Logs...</p>
                        </div>
                    ) : logs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-10 py-6">Administrator</th>
                                        <th className="px-10 py-6 text-center">Protocol Action</th>
                                        <th className="px-10 py-6">Operation Details</th>
                                        <th className="px-10 py-6 text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.map((log) => (
                                        <tr key={log.log_id} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="px-10 py-7">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                        {log.admin_name ? log.admin_name[0] : 'A'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{log.admin_name || `Admin #${log.admin_user_id}`}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Admin</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-center">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${
                                                    log.action_type.includes('reject') || log.action_type.includes('freeze') ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                                    log.action_type.includes('approve') || log.action_type.includes('activate') ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                    'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {log.action_type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-10 py-7">
                                                <div className="max-w-md">
                                                    <p className="text-xs text-slate-600 font-medium leading-relaxed mb-2">{log.description}</p>
                                                    {log.target_id && (
                                                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md tracking-widest uppercase">
                                                            Scope ID: {log.target_id}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <p className="text-xs font-black text-slate-800 mb-1">
                                                    {new Date(log.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-40 text-center">
                            <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <History size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-slate-800 font-black text-xl mb-2">No activity records</h3>
                            <p className="text-slate-500 font-medium text-sm">Your filters returned zero administrative actions.</p>
                            <button 
                                onClick={clearFilters}
                                className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                            >
                                Reset Search Parameters
                            </button>
                        </div>
                    )}

                    <div className="bg-slate-50/50 border-t border-slate-100 px-10 py-6 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing page {page} of system logs
                        </p>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm">
                                {page}
                            </div>
                            <button 
                                onClick={() => setPage(p => p + 1)}
                                disabled={logs.length < limit || loading}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
