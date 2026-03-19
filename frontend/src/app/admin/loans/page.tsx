"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const AllLoanApplications = () => {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State for Confirmation
  const [selectedApp, setSelectedApp] = useState<{id: number, action: 'approve' | 'reject'} | null>(null);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/loans/admin/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await res.json();
      if (result.success) setApps(result.data);
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    const loadingToast = toast.loading(`Processing ${action}...`);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/loans/admin/${action}/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await res.json();

      if (result.success) {
        setApps(prev => prev.filter((a: any) => a.application_id !== id));
        toast.success(`Loan ${action}ed successfully!`, { id: loadingToast });
      } else {
        toast.error(result.message || `Failed to ${action} loan.`, { id: loadingToast });
      }
    } catch (err: any) {
      toast.error("System connection error", { id: loadingToast });
    } finally {
      setSelectedApp(null); // Close modal after action
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
        Synchronizing Credit Data...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-10 relative">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-10">
          <Link href="/admin" className="inline-flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:translate-x-[-4px] transition-all">
            <span className="text-lg">←</span> Return to Core Dashboard
          </Link>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Loan Management</h1>
            <p className="text-slate-500 font-medium italic">Disbursement Control Center</p>
          </div>
          <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Queue Status</p>
            <p className="text-0.5xl font-black text-black-400">{apps.length} Applications Pending</p>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-700 uppercase tracking-[0.15em]">
                <th className="px-10 py-6">Member Profile</th>
                <th className="px-10 py-6">Credit Request</th>
                <th className="px-10 py-6">Duration</th>
                <th className="px-10 py-6">Submitted At</th>
                <th className="px-10 py-6 text-right">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {apps.map((app: any) => (
                <tr key={app.application_id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {app.name ? app.name[0] : 'U'}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{app.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{app.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <p className="text-lg font-black text-slate-900 tracking-tight">৳{app.requested_amount}</p>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Fixed Rate: 9%</p>
                  </td>
                  <td className="px-10 py-7">
                    <span className="px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      {app.term_days} Day Cycle
                    </span>
                  </td>
                  <td className="px-10 py-7 text-sm font-bold text-black-500">
                    {new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setSelectedApp({id: app.application_id, action: 'approve'})} 
                        className="px-5 py-2.5 bg-white text-green-500 border border-green-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-50 active:scale-95 transition-all"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => setSelectedApp({id: app.application_id, action: 'reject'})} 
                        className="px-5 py-2.5 bg-white text-rose-500 border border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 active:scale-95 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] italic">Queue is currently empty</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${selectedApp.action === 'approve' ? 'bg-green-100 text-black-600' : 'bg-rose-100 text-black-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-0.5xl font-black text-slate-900 uppercase tracking-tighter mb-2">Final Review</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Are you sure you want to <span className={`font-black uppercase ${selectedApp.action === 'approve' ? 'text-black-400' : 'text-black-400'}`}>{selectedApp.action}</span> this loan request? 
              {selectedApp.action === 'approve' && " Money will be disbursed from the system loan wallet to the member's active wallet immediately."}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => handleAction(selectedApp.id, selectedApp.action)}
                className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${selectedApp.action === 'approve' ? 'bg-green-600 shadow-indigo-200' : 'bg-rose-600 shadow-rose-200'}`}
              >
                Confirm
              </button>
              <button 
                onClick={() => setSelectedApp(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllLoanApplications;