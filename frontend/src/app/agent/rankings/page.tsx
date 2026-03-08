'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { Trophy, Medal, Loader2, MapPin, Filter, Search } from 'lucide-react';

// 1. Define the interface for the Agent object
interface AgentRank {
  user_id: string;
  name: string;
  phone: string;
  city: string;
  total_volume: string | number;
  transaction_count: number;
}

// Custom hook to close dropdown when clicking outside
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

const WheelScroll = ({ items, value, onChange }: { items: any[], value: any, onChange: (v: any) => void }) => {
  const itemHeight = 40;
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    if (containerRef.current) {
      const index = items.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
  }, []);

  const handleScroll = (e: any) => {
    if (isScrolling.current) return;
    const scrollTop = e.target.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (index >= 0 && index < items.length) {
      if (items[index] !== value) {
        onChange(items[index]);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-[120px] overflow-y-auto scroll-smooth snap-y snap-mandatory relative"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      onScroll={handleScroll}
    >
      <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />
      <div className="h-[40px] shrink-0"></div>
      {items.map((item, i) => (
        <div
          key={i}
          className={`h-[40px] flex items-center justify-center snap-center cursor-pointer transition-colors text-lg ${item === value ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'}`}
          onClick={() => {
            isScrolling.current = true;
            if (containerRef.current) containerRef.current.scrollTop = i * itemHeight;
            onChange(item);
            setTimeout(() => isScrolling.current = false, 300);
          }}
        >
          {typeof item === 'number' && item < 32 ? String(item).padStart(2, '0') : item}
        </div>
      ))}
      <div className="h-[40px] shrink-0"></div>
    </div>
  );
};

const DatePickerDialog = ({ isOpen, initDate, onCancel, onOk, targetName }: any) => {
  const [day, setDay] = useState(initDate ? parseInt(initDate.split('-')[2]) : new Date().getDate());
  const [monthOffset, setMonthOffset] = useState(initDate ? parseInt(initDate.split('-')[1]) - 1 : new Date().getMonth());
  const [year, setYear] = useState(initDate ? parseInt(initDate.split('-')[0]) : new Date().getFullYear());

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 30 }, (_, i) => 2015 + i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleOk = () => {
    const mm = String(monthOffset + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const yyyy = year;
    onOk(`${yyyy}-${mm}-${dd}`, targetName);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 shadow-2xl backdrop-blur-sm animate-fadeIn">
      <div className="bg-white shadow-2xl rounded-2xl w-[320px] flex flex-col pt-4 overflow-hidden border border-slate-200">
        <div className="px-6 py-4">
          <div className="relative h-[120px]">
            <div className="absolute top-1/2 left-0 right-0 h-[40px] -mt-[20px] border-y-2 border-emerald-500 pointer-events-none z-10 bg-emerald-50/30"></div>

            <div className="flex justify-between items-center text-center">
              <div className="flex-1 overflow-hidden">
                <WheelScroll items={days} value={day} onChange={setDay} />
              </div>
              <div className="flex-1 overflow-hidden">
                <WheelScroll items={months} value={months[monthOffset]} onChange={(val: string) => setMonthOffset(months.indexOf(val))} />
              </div>
              <div className="flex-1 overflow-hidden">
                <WheelScroll items={years} value={year} onChange={setYear} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-t border-slate-200 mt-2 bg-slate-50">
          <button onClick={onCancel} className="flex-1 py-4 text-slate-500 hover:text-slate-700 hover:bg-slate-100 uppercase text-sm font-bold transition-colors">Cancel</button>
          <div className="w-px bg-slate-200"></div>
          <button onClick={handleOk} className="flex-1 py-4 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/80 uppercase text-sm font-bold transition-colors">OK</button>
        </div>
      </div>
    </div>
  );
};

export default function AgentRankingsPage() {
  // 2. Pass the interface to useState: <AgentRank[]>
  const [rankings, setRankings] = useState<AgentRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    regions: [] as string[],
    startDate: '',
    endDate: '',
    transactionTypes: [] as string[],
    rankBy: ['total_volume'] as string[]
  });
  const [activeFilters, setActiveFilters] = useState({
    regions: [] as string[],
    startDate: '',
    endDate: '',
    transactionTypes: [] as string[],
    rankBy: ['total_volume'] as string[]
  });
  const [regionInputValue, setRegionInputValue] = useState('');
  const [datePickerTarget, setDatePickerTarget] = useState<string | null>(null);

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(typeDropdownRef, () => setIsTypeDropdownOpen(false));

  const [isRankByDropdownOpen, setIsRankByDropdownOpen] = useState(false);
  const rankByDropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(rankByDropdownRef, () => setIsRankByDropdownOpen(false));

  const [regionSuggestions, setRegionSuggestions] = useState<string[]>([]);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(regionDropdownRef, () => setIsRegionDropdownOpen(false));

  useEffect(() => {
    const fetchRegions = async () => {
      if (regionInputValue.trim().length === 0) {
        setRegionSuggestions([]);
        return;
      }
      try {
        const res = await api.get(`/agent/regions?q=${regionInputValue.trim()}`);
        const filterOutSelected = (res.data.data || []).filter((r: string) => !filters.regions.includes(r));
        setRegionSuggestions(filterOutSelected);
      } catch (err) {
        console.error("Failed to fetch regions", err);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchRegions();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [regionInputValue, filters.regions]);

  const addRegion = (region: string) => {
    if (region && !filters.regions.includes(region)) {
      setFilters(prev => ({ ...prev, regions: [...prev.regions, region] }));
    }
    setRegionInputValue('');
    setIsRegionDropdownOpen(false);
  };

  const removeRegion = (region: string) => {
    setFilters(prev => ({ ...prev, regions: prev.regions.filter(r => r !== region) }));
  };

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeFilters.regions.length > 0) {
          params.append('regions', activeFilters.regions.join(','));
        }
        if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
        if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);
        if (activeFilters.transactionTypes.length > 0) {
          params.append('transactionTypes', activeFilters.transactionTypes.join(','));
        }
        if (activeFilters.rankBy.length > 0) {
          params.append('rankBy', activeFilters.rankBy.join(','));
        }

        const res = await api.get(`/agent/rankings?${params.toString()}`);
        setRankings(res.data.data);
      } catch (err) {
        console.error("Failed to fetch rankings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [activeFilters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (type: string) => {
    setFilters(prev => {
      const types = prev.transactionTypes.includes(type)
        ? prev.transactionTypes.filter(t => t !== type)
        : [...prev.transactionTypes, type];
      return { ...prev, transactionTypes: types };
    });
  };

  const handleRankByCheckboxChange = (type: string) => {
    setFilters(prev => {
      const types = prev.rankBy.includes(type)
        ? prev.rankBy.filter(t => t !== type)
        : [...prev.rankBy, type];
      return { ...prev, rankBy: types };
    });
  };

  const applyFilters = () => {
    setActiveFilters(filters);
    setIsTypeDropdownOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = { regions: [], startDate: '', endDate: '', transactionTypes: [], rankBy: ['total_volume'] };
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setRegionInputValue('');
    setIsTypeDropdownOpen(false);
    setIsRankByDropdownOpen(false);
  };

  const handleDatePick = (dateStr: string, targetName: string) => {
    setFilters(prev => ({ ...prev, [targetName]: dateStr }));
    setDatePickerTarget(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      <DatePickerDialog
        isOpen={datePickerTarget !== null}
        initDate={datePickerTarget ? (filters as any)[datePickerTarget] : ''}
        targetName={datePickerTarget}
        onCancel={() => setDatePickerTarget(null)}
        onOk={handleDatePick}
      />
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-yellow-100 rounded-2xl">
          <Trophy className="w-8 h-8 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agent Ranking</h1>
          <p className="text-slate-500 text-sm">Top performers based on monthly volume</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] relative" ref={regionDropdownRef}>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Region</label>
          <div className="relative flex flex-wrap gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl p-2 min-h-[42px] focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
            <MapPin className="w-4 h-4 text-slate-400 ml-1" />
            {filters.regions.map(r => (
              <span key={r} className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                {r}
                <button type="button" onClick={() => removeRegion(r)} className="hover:text-emerald-900 font-bold focus:outline-none">×</button>
              </span>
            ))}
            <input
              type="text"
              name="region"
              placeholder={filters.regions.length === 0 ? "e.g. Dhaka" : ""}
              value={regionInputValue}
              onChange={(e) => {
                setRegionInputValue(e.target.value);
                setIsRegionDropdownOpen(true);
              }}
              onFocus={() => setIsRegionDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && regionInputValue.trim()) {
                  addRegion(regionInputValue.trim());
                  e.preventDefault();
                }
              }}
              className="flex-1 bg-transparent min-w-[80px] focus:outline-none text-sm px-1 py-0.5"
            />
          </div>
          {isRegionDropdownOpen && regionSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 max-h-48 overflow-y-auto">
              {regionSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm text-slate-700 font-medium transition-colors"
                  onClick={() => addRegion(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-slate-400" /> {suggestion}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">From Date</label>
          <input
            type="text"
            readOnly
            name="startDate"
            placeholder="Select Date"
            value={filters.startDate}
            onClick={() => setDatePickerTarget('startDate')}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">To Date</label>
          <input
            type="text"
            readOnly
            name="endDate"
            placeholder="Select Date"
            value={filters.endDate}
            onClick={() => setDatePickerTarget('endDate')}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
          />
        </div>
        <div className="flex-1 min-w-[150px] relative" ref={typeDropdownRef}>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Transaction Type</label>
          <div
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all flex justify-between items-center"
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
          >
            <span className="text-slate-700 truncate">
              {filters.transactionTypes.length === 0
                ? "All Types"
                : filters.transactionTypes.map(t => t.replace('_', ' ')).join(', ')}
            </span>
            <span className="text-xs text-slate-400">▼</span>
          </div>

          {isTypeDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.transactionTypes.includes('cash_in')}
                  onChange={() => handleCheckboxChange('cash_in')}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-slate-700">Cash In</span>
              </label>
              <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.transactionTypes.includes('cash_out')}
                  onChange={() => handleCheckboxChange('cash_out')}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-slate-700">Cash Out</span>
              </label>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-[150px] relative" ref={rankByDropdownRef}>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Rank By (Amount/Count)</label>
          <div
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all flex justify-between items-center h-[42px]"
            onClick={() => setIsRankByDropdownOpen(!isRankByDropdownOpen)}
          >
            <span className="text-slate-700 truncate text-sm">
              {filters.rankBy.length === 0
                ? "Select Rank"
                : filters.rankBy.map(r => r === 'total_volume' ? 'Total Amount' : 'Transaction Count').join(', ')}
            </span>
            <span className="text-xs text-slate-400">▼</span>
          </div>

          {isRankByDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  value="total_volume"
                  checked={filters.rankBy.includes('total_volume')}
                  onChange={() => handleRankByCheckboxChange('total_volume')}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-slate-700">Total Amount</span>
              </label>
              <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  value="transaction_count"
                  checked={filters.rankBy.includes('transaction_count')}
                  onChange={() => handleRankByCheckboxChange('transaction_count')}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-slate-700">Transaction Count</span>
              </label>
            </div>
          )}
        </div>
        <button
          onClick={applyFilters}
          className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 h-[42px]"
        >
          <Filter className="w-4 h-4" /> Apply
        </button>
        <button
          onClick={clearFilters}
          className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all h-[42px]"
        >
          Clear
        </button>
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