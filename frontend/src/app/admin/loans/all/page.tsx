"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AllLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem('token');
        // CORRECTED URL: Match the backend prefix + loan router path
        const res = await fetch(`${API_BASE}/loans/admin/detailed`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) setLoans(result.data);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const filteredLoans = statusFilter === "all" 
    ? loans 
    : loans.filter(l => l.status === statusFilter);

  if (loading) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Master Ledger...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-4 hover:translate-x-[-4px] transition-all group">
              <ArrowLeft size={14} className="group-hover:scale-125 transition-transform" /> 
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black text-slate-950 tracking-tighter">Loan Portfolio</h1>
            <p className="text-slate-500 font-medium">Full historical record of system credit</p>
          </div>
          
          <select 
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="repaid">Repaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-10 py-6">User Profile</th>
                <th className="px-10 py-6">Principal</th>
                <th className="px-10 py-6">Interest</th>
                <th className="px-10 py-6">Due Date</th>
                <th className="px-10 py-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLoans.map((l) => (
                <tr key={l.loan_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6">
                    <p className="font-black text-slate-800 text-sm">{l.user_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest">{l.user_phone}</p>
                  </td>
                  <td className="px-10 py-6 font-black text-slate-900 text-sm">৳{l.principal_amount}</td>
                  <td className="px-10 py-6 font-black text-indigo-600 text-xs uppercase tracking-tighter">{(l.interest_rate * 100).toFixed(0)}% Fixed</td>
                  <td className="px-10 py-6 text-sm text-slate-500 font-medium">{new Date(l.due_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-10 py-6 text-right">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      l.status === 'active' ? 'bg-indigo-100 text-indigo-600' : 
                      l.status === 'repaid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                   <td colSpan={5} className="p-20 text-center text-slate-400 font-black uppercase tracking-widest italic opacity-50">No records found for this status</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}