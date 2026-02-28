'use client';

import { useEffect, useState } from 'react';
import { transactionAPI } from '@/lib/api';
import { HandCoins, Check, X, Loader2, AlertCircle, Inbox } from 'lucide-react';

interface MoneyRequest {
  request_id: string;
  requester_name: string;
  requester_phone: string;
  amount: number;
  message: string;
  created_at: string;
}

export default function IncomingRequests() {
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchIncoming();
  }, []);

  const fetchIncoming = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getIncomingRequests();
      // Ensure we handle different possible API response structures
      const data = response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch requests', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (id: string, status: 'paid' | 'declined') => {
    setActionLoading(id);
    try {
      if (status === 'paid') {
        await transactionAPI.approveRequest(id);
      } else {
        await transactionAPI.updateRequestStatus(id, 'declined');
      }
      setRequests(requests.filter(r => r.request_id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Transaction failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        Requests Received
      </h2>
      
      {requests.length === 0 ? (
        /* --- THIS SECTION WILL SHOW IF NO REQUESTS ARE FOUND --- */
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Inbox className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500 font-medium">No pending requests for you</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
            <div key={req.request_id} className="bg-white p-5 rounded-2xl border-l-4 border-l-amber-400 shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">From</p>
                  <p className="font-bold text-slate-900">{req.requester_name || req.requester_phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-indigo-600">৳{req.amount}</p>
                </div>
              </div>

              {req.message && (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg mb-4 border border-slate-100">
                  "{req.message}"
                </p>
              )}

              <div className="flex gap-2">
                <button
                  disabled={!!actionLoading}
                  onClick={() => handleResponse(req.request_id, 'paid')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  {actionLoading === req.request_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  disabled={!!actionLoading}
                  onClick={() => handleResponse(req.request_id, 'declined')}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <X className="w-4 h-4" />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}