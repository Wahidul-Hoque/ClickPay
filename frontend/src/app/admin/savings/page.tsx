'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { ArrowLeft, Users } from 'lucide-react';

export default function AdminSavingsPage() {
  const [savings, setSavings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await adminApi.getActiveSavings();
        if (result.success) {
          setSavings(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch savings plans', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-10 space-y-6">
      <div className="flex items-center gap-3 text-slate-600">
        <Link href="/admin" className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-slate-500">
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className="text-3xl font-black text-slate-900">All Active Savings Plans</h1>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Showing all active savings entries tracked by the platform.</p>
        <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
          <Users className="w-4 h-4" />
          <span>{savings.length} plans</span>
        </div>
      </div>
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
        {loading ? (
          <p className="text-center text-slate-400 uppercase tracking-[0.4em] text-xs">Loading savings plans...</p>
        ) : savings.length === 0 ? (
          <p className="text-center text-slate-400 uppercase tracking-[0.4em] text-xs">No active savings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100">
                <tr>
                  <th className="py-3">Plan ID</th>
                  <th className="py-3">Primary Holder</th>
                  <th className="py-3">Principal</th>
                  <th className="py-3">APR</th>
                  <th className="py-3">Finishes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savings.map((plan) => (
                  <tr key={plan.fixed_savings_id} className="hover:bg-slate-50">
                    <td className="py-4 font-black text-slate-800">#{plan.fixed_savings_id}</td>
                    <td className="py-4 text-slate-600">
                      {plan.user_name || plan.phone}
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{plan.phone || '—'}</div>
                    </td>
                    <td className="py-4 font-bold text-slate-800">৳{Number(plan.principal_amount).toLocaleString()}</td>
                    <td className="py-4 text-slate-600">{parseFloat(plan.annual_interest_rate).toFixed(2)}%</td>
                    <td className="py-4 text-slate-600">{new Date(plan.finish_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
