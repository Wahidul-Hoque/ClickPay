'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Trophy, Medal, Loader2, MapPin } from 'lucide-react';

// 1. Define the interface for the Agent object
interface AgentRank {
  user_id: string;
  name: string;
  phone: string;
  city: string;
  total_volume: string | number;
  transaction_count: number;
}

export default function AgentRankingsPage() {
  // 2. Pass the interface to useState: <AgentRank[]>
  const [rankings, setRankings] = useState<AgentRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await api.get('/agent/rankings');
        setRankings(res.data.data);
      } catch (err) {
        console.error("Failed to fetch rankings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-yellow-100 rounded-2xl">
          <Trophy className="w-8 h-8 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agent Ranking</h1>
          <p className="text-slate-500 text-sm">Top performers based on monthly volume</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-600">Rank</th>
              <th className="px-6 py-4 font-bold text-slate-600">Agent Info</th>
              <th className="px-6 py-4 font-bold text-slate-600 text-right">Volume (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rankings.length > 0 ? (
              rankings.map((agent, index) => (
                <tr key={agent.user_id} className={`transition-colors hover:bg-slate-50 ${index < 3 ? "bg-emerald-50/20" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full">
                      {index === 0 && <Medal className="w-6 h-6 text-yellow-500" />}
                      {index === 1 && <Medal className="w-6 h-6 text-slate-400" />}
                      {index === 2 && <Medal className="w-6 h-6 text-amber-600" />}
                      {index > 2 && <span className="font-mono text-slate-400 font-bold">#{index + 1}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{agent.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3 h-3" />
                      <span>{agent.city || "Unknown City"}</span>
                      <span>•</span>
                      <span>{agent.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-mono font-bold text-emerald-600 text-lg">
                      ৳{Number(agent.total_volume).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase">{agent.transaction_count} TXs</p>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                  No transaction data available for this month yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}