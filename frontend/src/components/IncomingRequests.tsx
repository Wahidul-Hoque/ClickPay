'use client';

import { useEffect, useState } from 'react';
import { transactionAPI } from '@/lib/api';
import { HandCoins, Check, X, Loader2, AlertCircle, Inbox, Lock } from 'lucide-react';

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

  // ── NEW: ePin modal state ──────────────────────────
  const [epinModal, setEpinModal] = useState<{ open: boolean; requestId: string | null }>({
    open: false,
    requestId: null,
  });
  const [epin, setEpin] = useState('');
  const [epinError, setEpinError] = useState('');

  useEffect(() => {
    fetchIncoming();
  }, []);

  const fetchIncoming = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getIncomingRequests();
      const data = response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch requests', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // ── NEW: Open ePin modal when Approve is clicked ───
  const handleApproveClick = (requestId: string) => {
    setEpin('');
    setEpinError('');
    setEpinModal({ open: true, requestId });
  };

  // ── NEW: Submit approval with ePin ─────────────────
  const handleApproveSubmit = async () => {
    if (!epinModal.requestId) return;

    if (epin.length !== 5 || !/^\d+$/.test(epin)) {
      setEpinError('ePin must be exactly 5 digits');
      return;
    }

    setActionLoading(epinModal.requestId);
    setEpinError('');

    try {
      await transactionAPI.approveRequest(epinModal.requestId, epin); // ✅ Now passes ePin!
      setRequests(requests.filter(r => r.request_id !== epinModal.requestId));
      setEpinModal({ open: false, requestId: null });
      setEpin('');
    } catch (error: any) {
      setEpinError(error.response?.data?.message || 'Transaction failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Decline handler (unchanged) ────────────────────
  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      await transactionAPI.updateRequestStatus(id, 'declined');
      setRequests(requests.filter(r => r.request_id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to decline');
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
                  &quot;{req.message}&quot;
                </p>
              )}

              <div className="flex gap-2">
                <button
                  disabled={!!actionLoading}
                  onClick={() => handleApproveClick(req.request_id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  {actionLoading === req.request_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  disabled={!!actionLoading}
                  onClick={() => handleDecline(req.request_id)}
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

      {/* ── ePin Confirmation Modal ─────────────────────── */}
      {epinModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Confirm Payment</h3>
                <p className="text-xs text-slate-500">Enter your 5-digit ePin to approve</p>
              </div>
            </div>

            <input
              type="password"
              maxLength={5}
              value={epin}
              onChange={(e) => {
                setEpin(e.target.value.replace(/\D/g, ''));
                setEpinError('');
              }}
              placeholder="•••••"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none mb-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApproveSubmit();
              }}
            />

            {epinError && (
              <p className="text-xs text-rose-500 text-center mb-3">{epinError}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setEpinModal({ open: false, requestId: null });
                  setEpin('');
                  setEpinError('');
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveSubmit}
                disabled={!!actionLoading || epin.length !== 5}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}