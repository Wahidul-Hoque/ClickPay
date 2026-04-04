'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Users, 
    TrendingUp, 
    ShieldCheck, 
    ArrowRight, 
    Search, 
    Bell, 
    Settings, 
    Menu, 
    X, 
    LogOut, 
    FileText, 
    ShieldAlert, 
    UserCheck, 
    UserMinus, 
    Wallet, 
    LayoutDashboard,
    PieChart,
    Calendar,
    Download,
    Eye,
    Landmark,
    Trophy,
    Store,
    UserRound,
    History,
    Activity,
    Lock,
    Unlock,
    Filter,
    RefreshCcw,
    ArrowRightLeft,
    DollarSign,
    Percent,
    ArrowRightLeft as ArrowRightLeftIcon
} from 'lucide-react';
import AgentRankingList from '@/components/AgentRankingList';
import MerchantRankingList from '@/components/MerchantRankingList';
import { DatePickerDialog } from '@/components/DatePickerDialog';
import Link from 'next/link';
import { useToast } from '@/contexts/toastcontext';
import { ConfirmModal } from '@/components/ConfirmModal';
import { adminApi } from '@/lib/api';


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

const ADMIN_WALLET_FLOW_EMPTY_PRESET = {
    totalIncoming: 0,
    totalOutgoing: 0,
    loanInterest: 0,
    systemProfit: 0,
    merchantSubscription: 0,
};

const ADMIN_WALLET_FLOW_EMPTY = {
    current: { ...ADMIN_WALLET_FLOW_EMPTY_PRESET },
    previousMonth: { ...ADMIN_WALLET_FLOW_EMPTY_PRESET },
};

const RECON_PERIODS = [
    { key: 'day', label: 'This Day' },
    { key: 'month', label: 'This Month' },
] as const;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const LoanSummaryWidget = () => {
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const token = localStorage.getItem('token');
                // Use the same pattern as your other dashboard calls
                const res = await fetch(`${API_BASE}/loans/admin/applications?limit=5`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const result = await res.json();
                
                if (result.success) {
                    setApps(result.data);
                }
            } catch (error) {
                console.error("Failed to fetch loans:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLoans();
    }, []);

    if (loading) return <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Scanning Portfolio...</div>;

    return (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Loan Requests</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Review pending applications</p>
                </div>
                <Link 
                    href="/admin/loans" 
                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/20"
                >
                    See All Applications
                </Link>
                <Link 
                    href="/admin/loans/all" 
                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/20"
                    >
                    View All Loans
                </Link>
            </div>

            <div className="space-y-3">
                {apps && apps.length > 0 ? apps.map((app: any) => (
                    <div key={app.application_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {app.name ? app.name[0] : 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800">{app.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">৳{app.requested_amount} • {new Date(app.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <Link href="/admin/loans" className="p-2.5 bg-white rounded-xl text-slate-300 hover:text-indigo-600 shadow-sm border border-slate-100 transition-colors">
                            <ArrowRightLeft size={16} />
                        </Link>
                    </div>
                )) : (
                    <div className="text-center py-12 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">No pending requests</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const DefaultedLoansWidget = () => {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDefaulted = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/loans/admin/detailed`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) {
                    // Filter for defaulted loans OR loans that are past due but still active
                    setLoans(result.data.filter((l: any) => 
                        l.status === 'defaulted' || 
                        (l.status !== 'repaid' && new Date(l.due_at) <= new Date())
                    ));
                }
            } catch (error) {
                console.error("Failed to fetch defaulted loans:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDefaulted();
    }, []);

    if (loading) return <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-widest italic">Scanning defaults...</div>;

    return (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h4 className="font-black text-rose-600 uppercase text-xs tracking-widest">Defaulted & Past Due</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Immediate action or auto-deduction pending</p>
                </div>
                <div className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {loans.length} Overdue
                </div>
            </div>

            <div className="space-y-3">
                {loans.length > 0 ? loans.map((loan: any) => (
                    <div key={loan.loan_id} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100 hover:bg-rose-50 transition-all group">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 font-black group-hover:bg-rose-600 group-hover:text-white transition-all">
                                {loan.user_name ? loan.user_name[0] : 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800">{loan.user_name}</p>
                                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">৳{(loan.principal_amount * 1.09).toFixed(2)} OVERDUE SINCE {new Date(loan.due_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button className="p-2.5 bg-white rounded-xl text-rose-400 hover:text-rose-600 shadow-sm border border-rose-100 transition-colors">
                            <ShieldAlert size={16} />
                        </button>
                    </div>
                )) : (
                    <div className="text-center py-12 bg-emerald-50 rounded-[1.5rem] border-2 border-dashed border-emerald-100">
                        <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest italic">All portfolios are healthy</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SystemSettingsWidget = () => {
    const [settings, setSettings] = useState<{setting_key: string; setting_value: number; description: string}[]>([]);
    const [inputValues, setInputValues] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const toast = useToast();

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/admin/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setSettings(result.data);
                const vals: Record<string, string> = {};
                result.data.forEach((s: any) => { vals[s.setting_key] = String(s.setting_value); });
                setInputValues(vals);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSettings(); }, []);

    const handleSave = async (key: string) => {
        const val = parseFloat(inputValues[key]);
        if (isNaN(val)) { toast.error('Invalid value'); return; }
        setSaving(key);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/admin/settings`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: val })
            });
            const result = await res.json();
            if (result.success) { toast.success(`${key.replace(/_/g, ' ')} updated!`); fetchSettings(); }
            else { toast.error(result.message || 'Update failed'); }
        } catch { toast.error('Network error'); }
        finally { setSaving(null); }
    };

    if (loading) return <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Loading settings...</div>;

    return (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Settings size={140} className="text-slate-800" />
            </div>
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <h4 className="font-black text-indigo-600 uppercase text-xs tracking-widest mb-1">Global Protocol Settings</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Edit a value then click Save to apply it instantly across all services.</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-xl border border-indigo-200">
                    <Activity className="text-indigo-600" size={20} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                {settings.map((s) => (
                    <div key={s.setting_key} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{s.setting_key.replace(/_/g, ' ')}</p>
                            {s.setting_key.includes('rate') || s.setting_key.includes('fee') ? <Percent size={13} className="text-slate-300 group-hover:text-indigo-600 transition-colors" /> : <DollarSign size={13} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mb-4 leading-tight capitalize">{s.description}</p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                step="any"
                                value={inputValues[s.setting_key] ?? ''}
                                onChange={(e) => setInputValues(prev => ({ ...prev, [s.setting_key]: e.target.value }))}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder-slate-300"
                            />
                            <button
                                onClick={() => handleSave(s.setting_key)}
                                disabled={saving === s.setting_key}
                                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm shadow-indigo-600/10 whitespace-nowrap"
                            >
                                {saving === s.setting_key ? '...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Changes are applied immediately to all new transactions</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-600">Live Sync</span>
                </div>
            </div>
        </div>
    );
};

export default function AdminDashboard() {
    const toast = useToast();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedCity, setSelectedCity] = useState("");
    const [cityInputValue, setCityInputValue] = useState("");
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(cityDropdownRef, () => setIsCityDropdownOpen(false));

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [trendCity, setTrendCity] = useState("");
    const [trendStartDate, setTrendStartDate] = useState("");
    const [trendEndDate, setTrendEndDate] = useState("");
    const [trendData, setTrendData] = useState<any[]>([]);
    const [trendView, setTrendView] = useState<'chart' | 'methods'>('chart');
    
    const [segCity, setSegCity] = useState("");
    const [segStartDate, setSegStartDate] = useState("");
    const [segEndDate, setSegEndDate] = useState("");
    const [segData, setSegData] = useState<any>(null);
    const [segView, setSegView] = useState<'activity' | 'wallets'>('activity');
    const [userSearch, setUserSearch] = useState("");

    const [datePickerTarget, setDatePickerTarget] = useState<string | null>(null);

    const [notifyAudience, setNotifyAudience] = useState('all');
    const [notifyPhone, setNotifyPhone] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifySending, setNotifySending] = useState(false);
    const [sentNotifications, setSentNotifications] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);
    const [activeSavings, setActiveSavings] = useState<any[]>([]);
    const [reconScope, setReconScope] = useState<'day' | 'month'>('day');
    const [adminWalletFlows, setAdminWalletFlows] = useState({
        day: { ...ADMIN_WALLET_FLOW_EMPTY },
        month: { ...ADMIN_WALLET_FLOW_EMPTY },
    });
    const [adminWalletLoading, setAdminWalletLoading] = useState(true);

    const [analytics, setAnalytics] = useState<any>(null);
    const [portfolio, setPortfolio] = useState<any>(null);
    const [audit, setAudit] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const router = useRouter();

    // Fraud Detection State
    const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
    const [fraudStats, setFraudStats] = useState<any>(null);
    const [fraudFilter, setFraudFilter] = useState<string>('');
    const [fraudLoading, setFraudLoading] = useState(false);
    const [fraudResolving, setFraudResolving] = useState<number | null>(null);

    const fetchSentNotifications = useCallback(async () => {
        setNotificationsLoading(true);
        try {
            const result = await adminApi.getSentNotifications({ limit: 10 });
            if (result.success) {
                setSentNotifications(result.data);
            } else {
                setSentNotifications([]);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load notifications');
        } finally {
            setNotificationsLoading(false);
        }
    }, [toast]);

    const fetchActiveSavings = useCallback(async () => {
        try {
            const result = await adminApi.getActiveSavings({ limit: 3 });
            if (result.success) {
                setActiveSavings(result.data);
            } else {
                setActiveSavings([]);
            }
        } catch (error: any) {
            console.error('[SAVINGS]', error);
        }
    }, []);

    const fetchAdminWalletFlows = useCallback(async () => {
        setAdminWalletLoading(true);
        try {
            const [dayResult, monthResult] = await Promise.all([
                adminApi.getAdminWalletReconciliation('day'),
                adminApi.getAdminWalletReconciliation('month'),
            ]);
            const normalizePayload = (payload: any) => {
                const data = payload?.success ? payload.data : {};
                const current = data?.current || {};
                const previousMonth = data?.previousMonth || {};
                const parseFlow = (row: any) => ({
                    totalIncoming: Number(row.totalIncoming) || 0,
                    totalOutgoing: Number(row.totalOutgoing) || 0,
                    loanInterest: Number(row.loanInterest) || 0,
                    systemProfit: Number(row.systemProfit) || 0,
                    merchantSubscription: Number(row.merchantSubscription) || 0,
                });
                return {
                    current: parseFlow(current),
                    previousMonth: parseFlow(previousMonth),
                };
            };
            setAdminWalletFlows({
                day: normalizePayload(dayResult),
                month: normalizePayload(monthResult),
            });
        } catch (error: any) {
            console.error('[ADMIN WALLET]', error);
            setAdminWalletFlows({
                day: { ...ADMIN_WALLET_FLOW_EMPTY },
                month: { ...ADMIN_WALLET_FLOW_EMPTY },
            });
        } finally {
            setAdminWalletLoading(false);
        }
    }, []);

    const handleBellToggle = () => {
        setNotificationsOpen((prev) => {
            const next = !prev;
            if (next) {
                fetchSentNotifications();
            }
            return next;
        });
    };

    useEffect(() => {
        fetchActiveSavings();
    }, [fetchActiveSavings]);

    useEffect(() => {
        fetchAdminWalletFlows();
    }, [fetchAdminWalletFlows]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsOpen && bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [notificationsOpen]);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log("No token found, please login as admin first");
                    return;
                }
                const headers = { Authorization: `Bearer ${token}` };

                let dashUrl = `http://localhost:5000/api/v1/admin/dashboard?city=${selectedCity}`;
                if (startDate) dashUrl += `&startDate=${startDate}`;
                if (endDate) dashUrl += `&endDate=${endDate}`;

                const dashboardRes = await fetch(dashUrl, { headers });
                const dashboardData = await dashboardRes.json();
                
                if (dashboardData.success) {
                    setAnalytics(dashboardData.data.analytics);
                    setPortfolio(dashboardData.data.portfolio);
                    setAudit(dashboardData.data.audit);
                }

                const citiesRes = await fetch('http://localhost:5000/api/v1/admin/cities', { headers });
                const citiesJson = await citiesRes.json();
                if (citiesJson.success) {
                    setCities(citiesJson.data);
                }
            } catch (err: any) {
                console.error("Failed to fetch admin data", err);
                toast.error("Failed to load dashboard data");
                if (err.response?.data?.errors) {
                  err.response.data.errors.forEach((e: any) => {
                    toast.error(e.message || 'Validation error');
                  });
                }
            }
        };
        fetchAdminData();
    }, [selectedCity, startDate, endDate]);

    useEffect(() => {
        const fetchTrendData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const headers = { Authorization: `Bearer ${token}` };

                let trendUrl = `http://localhost:5000/api/v1/admin/dashboard/trend?city=${trendCity}`;
                if (trendStartDate) trendUrl += `&startDate=${trendStartDate}`;
                if (trendEndDate) trendUrl += `&endDate=${trendEndDate}`;

                const trendRes = await fetch(trendUrl, { headers });
                const data = await trendRes.json();
                
                if (data.success) {
                    setTrendData(data.data);
                }
            } catch (err: any) {
                console.error("Failed to fetch trend data", err);
                if (err.response?.data?.errors) {
                  err.response.data.errors.forEach((e: any) => {
                    toast.error(e.message || 'Validation error');
                  });
                }
            }
        };
        fetchTrendData();
    }, [trendCity, trendStartDate, trendEndDate]);

    useEffect(() => {
        const fetchSegData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const headers = { Authorization: `Bearer ${token}` };

                let segUrl = `http://localhost:5000/api/v1/admin/dashboard/segmentation?city=${segCity}`;
                if (segStartDate) segUrl += `&startDate=${segStartDate}`;
                if (segEndDate) segUrl += `&endDate=${segEndDate}`;

                const segRes = await fetch(segUrl, { headers });
                const data = await segRes.json();
                
                if (data.success) {
                    setSegData(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch segmentation data", error);
            }
        };
        fetchSegData();
    }, [segCity, segStartDate, segEndDate]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const headers = { Authorization: `Bearer ${token}` };
                
                const url = `http://localhost:5000/api/v1/admin/users${userSearch ? `?search=${userSearch}` : ''}`;
                const usersRes = await fetch(url, { headers });
                const usersJson = await usersRes.json();
                if (usersJson.success) {
                    setUsers(usersJson.data);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };
        
        const delay = setTimeout(fetchUsers, 300);
        return () => clearTimeout(delay);
    }, [userSearch]);

    // Fetch Fraud Alerts
    useEffect(() => {
        const fetchFraudData = async () => {
            try {
                setFraudLoading(true);
                const token = localStorage.getItem('token');
                if (!token) return;
                const headers = { Authorization: `Bearer ${token}` };

                const alertsUrl = `http://localhost:5000/api/v1/admin/fraud/alerts${fraudFilter ? `?status=${fraudFilter}` : ''}`;
                const [alertsRes, statsRes] = await Promise.all([
                    fetch(alertsUrl, { headers }),
                    fetch('http://localhost:5000/api/v1/admin/fraud/stats', { headers })
                ]);
                const alertsData = await alertsRes.json();
                const statsData = await statsRes.json();

                if (alertsData.success) setFraudAlerts(alertsData.data);
                if (statsData.success) setFraudStats(statsData.data);
            } catch (err: any) {
                console.error('Failed to fetch fraud data', err);
                if (err.response?.data?.errors) {
                  err.response.data.errors.forEach((e: any) => {
                    toast.error(e.message || 'Validation error');
                  });
                }
            } finally {
                setFraudLoading(false);
            }
        };
        fetchFraudData();
    }, [fraudFilter]);

    const handleSendNotification = async () => {
        if (!notifyMessage.trim()) return toast.error("Message is required");
        if (notifyAudience === 'phone' && !notifyPhone.trim()) return toast.error("Phone number is required");
        
        try {
            setNotifySending(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/v1/admin/notifications/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    audience: notifyAudience,
                    phone: notifyAudience === 'phone' ? notifyPhone : undefined,
                    message: notifyMessage
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Notification sent to ${data.sentCount} recipient(s)`);
                setNotifyMessage('');
                setNotifyPhone('');
                setNotifyAudience('all');
            } else {
                toast.error(data.error || data.message || "Failed to send notification");
            }
        } catch (err: any) {
            console.error('[NOTIFY] Error:', err);
            toast.error(err.response?.data?.message || err.message || "An error occurred");
        } finally {
            setNotifySending(false);
        }
    };

    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
        confirmText: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'warning',
        confirmText: 'Confirm'
    });

    const handleResolveFraudAlert = async (alertId: number, action: 'freeze' | 'dismiss') => {
        const title = action === 'freeze' ? 'Freeze User Account' : 'Dismiss Fraud Alert';
        const message = action === 'freeze'
            ? 'Are you sure you want to FREEZE this user\'s account? All transactions will be blocked immediately.'
            : 'Are you sure you want to DISMISS this alert? The account will remain active and this alert record will be archived.';
        
        setConfirmConfig({ 
            isOpen: true, 
            title, 
            message, 
            onConfirm: () => executeFraudAction(alertId, action),
            type: action === 'freeze' ? 'danger' : 'warning',
            confirmText: action === 'freeze' ? 'Freeze Now' : 'Dismiss Alert'
        });
    };

    const executeFraudAction = async (alertId: number, action: 'freeze' | 'dismiss') => {
        try {
            setFraudResolving(alertId);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/v1/admin/fraud/alerts/${alertId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setFraudAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, alert_status: action === 'freeze' ? 'frozen' : 'dismissed' } : a));
                const statsRes = await fetch('http://localhost:5000/api/v1/admin/fraud/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const statsData = await statsRes.json();
                if (statsData.success) setFraudStats(statsData.data);
                if (action === 'freeze') {
                    setUsers(prev => prev.map(u => u.user_id === data.flaggedUserId ? { ...u, status: 'frozen' } : u));
                }
            } else {
                toast.error(data.message || 'Failed to resolve alert');
            }
        } catch (err: any) {
            console.error('Failed to resolve fraud alert', err);
            toast.error(err.response?.data?.message || err.message || 'An error occurred while resolving the alert');
        } finally {
            setFraudResolving(null);
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
    };

    const toggleUserStatus = async (id: number, currentStatus: string) => {
        const action = currentStatus === 'active' ? 'freeze' : 'unfreeze';
        const title = action === 'freeze' ? 'Freeze Account' : 'Unfreeze Account';
        const message = action === 'freeze' 
            ? 'Are you sure you want to freeze this user? They will lose access to all funds.' 
            : 'Are you sure you want to unfreeze this user and restore their access?';

        setConfirmConfig({
            isOpen: true,
            title,
            message,
            confirmText: action === 'freeze' ? 'Freeze Member' : 'Restore Member',
            type: action === 'freeze' ? 'danger' : 'info',
            onConfirm: () => executeToggleStatus(id, action)
        });
    };

    const executeToggleStatus = async (id: number, action: 'freeze' | 'unfreeze') => {
        try {
            const res = await fetch(`http://localhost:5000/api/v1/admin/users/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`User successfully ${action}d`);
                setUsers(users.map(u => u.user_id === id ? { ...u, status: data.status } : u));
            } else {
                toast.error(data.message || 'Toggle failed');
            }
        } catch (error) {
            console.error("Failed to toggle status", error);
            toast.error('An error occurred during status update');
        } finally {
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
    };

    const methodTotals: Record<string, number> = {};
    if (trendData && trendData.length > 0) {
        trendData.forEach(d => {
            Object.keys(d).forEach(k => {
                if (k !== 'date' && k !== 'total_volume') {
                    methodTotals[k] = (methodTotals[k] || 0) + parseFloat(d[k]);
                }
            });
        });
    }
    const sortedMethods = Object.entries(methodTotals).sort((a, b) => b[1] - a[1]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/auth/login');
    };

    const formatCurrency = (value: any) => {
        const num = Number(value) || 0;
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatCount = (value: any) => Number(value) || 0;
    const displayedAdminWalletFlow = adminWalletFlows[reconScope] ?? ADMIN_WALLET_FLOW_EMPTY;
    const currentFlow = displayedAdminWalletFlow.current ?? ADMIN_WALLET_FLOW_EMPTY.current;
    const previousMonthFlow = displayedAdminWalletFlow.previousMonth ?? ADMIN_WALLET_FLOW_EMPTY.previousMonth;

    const handleDatePick = (dateStr: string, targetName: string) => {
        if (targetName === 'startDate') setStartDate(dateStr);
        if (targetName === 'endDate') setEndDate(dateStr);
        if (targetName === 'trendStartDate') setTrendStartDate(dateStr);
        if (targetName === 'trendEndDate') setTrendEndDate(dateStr);
        if (targetName === 'segStartDate') setSegStartDate(dateStr);
        if (targetName === 'segEndDate') setSegEndDate(dateStr);
        setDatePickerTarget(null);
    };

    return (
        <div className="flex bg-slate-50 min-h-screen">
            {/* --- SIDEBAR --- */}
            <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} fixed h-full bg-slate-950 text-slate-400 z-50 transition-all duration-300 flex flex-col border-r border-slate-800`}>
                <div className="p-6 flex items-center gap-3 text-white border-b border-slate-900">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    {isSidebarOpen && <span className="font-black text-xl tracking-tighter">ADMIN CORE</span>}
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1 mt-4">
                    <NavBtn icon={<LayoutDashboard />} label="Financial Analytics" active={activeSection === 'dashboard'} onClick={() => scrollToSection('dashboard')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<Users />} label="Agent Ranking" active={activeSection === 'agents'} onClick={() => scrollToSection('agents')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<Store />} label="Merchant Ranking" active={activeSection === 'merchants'} onClick={() => scrollToSection('merchants')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<UserRound />} label="User Management" active={activeSection === 'users'} onClick={() => scrollToSection('users')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<Landmark />} label="Loans & Savings" active={activeSection === 'loans'} onClick={() => scrollToSection('loans')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<Bell />} label="Send Notification" active={activeSection === 'notify'} onClick={() => scrollToSection('notify')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<ShieldAlert />} label="Fraud Alerts" active={activeSection === 'fraud'} onClick={() => scrollToSection('fraud')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<RefreshCcw />} label="Reconciliation" active={activeSection === 'recon'} onClick={() => scrollToSection('recon')} collapsed={!isSidebarOpen}/>
                    <NavBtn icon={<Activity />} label="Admin Action History" active={activeSection === 'audit'} onClick={() => scrollToSection('audit')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<Settings />} label="System Settings" active={activeSection === 'settings'} onClick={() => scrollToSection('settings')} collapsed={!isSidebarOpen} />
                </nav>

                <div className="p-4 border-t border-slate-900 space-y-1">
                    <button onClick={() => router.push('/admin/settings')} className="flex items-center gap-3 w-full p-3 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all">
                        <UserRound size={18} />
                        {isSidebarOpen && <span className="font-bold text-sm">Account Settings</span>}
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all">
                        <LogoutIcon />
                        {isSidebarOpen && <span className="font-bold text-sm">Exit System</span>}
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className={`flex-1 ${isSidebarOpen ? 'ml-72' : 'ml-20'} transition-all duration-300`}>
                
                {/* --- TOPBAR --- */}
                <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-10 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all">
                            {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
                        </button>
                        <div className="hidden lg:block">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight capitalize">{activeSection.replace('-',' ')}</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Status: Operational</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="relative hidden xl:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                            <input className="pl-12 pr-6 py-3 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-2xl text-sm outline-none w-80 transition-all" placeholder="Search Transactions, NID, or Logs..."/>
                        </div>
                        <div className="flex gap-2">
                            <div ref={bellRef} className="relative">
                                <IconButton
                                    icon={<Bell size={20} />}
                                    badge={!notificationsOpen && sentNotifications.length > 0}
                                    onClick={handleBellToggle}
                                    ariaLabel="Toggle sent notifications"
                                />
                                {notificationsOpen && (
                                    <div className="absolute right-0 top-full mt-3 w-[340px] bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/20 z-50">
                                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                Sent Notifications
                                            </p>
                                            <span className="text-[10px] font-black text-slate-400">
                                                {sentNotifications.length} latest
                                            </span>
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            {notificationsLoading ? (
                                                <div className="px-5 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                                    Loading...
                                                </div>
                                            ) : sentNotifications.length === 0 ? (
                                                <div className="px-5 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                                    No notifications yet
                                                </div>
                                            ) : (
                                                <ul className="divide-y divide-slate-100">
                                                    {sentNotifications.map((notification) => (
                                                        <li key={notification.notification_id} className="px-5 py-4">
                                                            <p className="text-sm font-semibold text-slate-800 leading-snug">
                                                                {notification.message}
                                                            </p>
                                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
                                                                <span>{(notification.recipient_role || 'user').toUpperCase()}</span>
                                                                <span>•</span>
                                                                <span>{notification.recipient_phone || 'Unknown'}</span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 mt-1">
                                                                {new Date(notification.created_at).toLocaleString()}
                                                            </p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-10 space-y-32">
                    <DatePickerDialog
                        isOpen={datePickerTarget !== null}
                        initDate={datePickerTarget === 'startDate' ? startDate : endDate}
                        targetName={datePickerTarget}
                        onCancel={() => setDatePickerTarget(null)}
                        onOk={handleDatePick}
                        theme="indigo"
                    />

                    {/* SECTION 1, 3, 5: ANALYTICS, CHURN & TRENDS */}
                    <section id="dashboard" className="scroll-mt-32">
                        <div className="mb-6">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Financial Analytics</h2>
                            <p className="text-slate-500 font-medium">Real-time revenue & user transaction analysis</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px] relative" ref={cityDropdownRef}>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Area / Branch</label>
                                <div className="relative flex flex-wrap gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl p-2 min-h-[42px] focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                    <Landmark className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
                                    {selectedCity && (
                                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md flex items-center gap-1 font-bold">
                                            {selectedCity}
                                            <button type="button" onClick={() => setSelectedCity('')} className="hover:text-indigo-900 font-black focus:outline-none ml-1">×</button>
                                        </span>
                                    )}
                                    <input
                                        type="text"
                                        placeholder={!selectedCity ? "Search or write Area..." : ""}
                                        value={cityInputValue}
                                        onChange={(e) => {
                                            setCityInputValue(e.target.value);
                                            setIsCityDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsCityDropdownOpen(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && cityInputValue.trim()) {
                                                setSelectedCity(cityInputValue.trim());
                                                setCityInputValue('');
                                                setIsCityDropdownOpen(false);
                                                e.preventDefault();
                                            }
                                        }}
                                        className="flex-1 bg-transparent min-w-[80px] focus:outline-none text-sm px-1 py-0.5 text-slate-700 font-bold"
                                    />
                                </div>
                                {isCityDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 max-h-48 overflow-y-auto">
                                        {cities.filter(c => c.toLowerCase().includes(cityInputValue.toLowerCase())).length > 0 ? (
                                            cities.filter(c => c.toLowerCase().includes(cityInputValue.toLowerCase())).map((suggestion, idx) => (
                                                <div
                                                    key={idx}
                                                    className="px-4 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm text-slate-700 font-medium transition-colors"
                                                    onClick={() => {
                                                        setSelectedCity(suggestion);
                                                        setCityInputValue('');
                                                        setIsCityDropdownOpen(false);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Landmark className="w-3 h-3 text-slate-400" /> {suggestion}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-slate-500 italic">Press Enter to add "{cityInputValue}"</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">From Date</label>
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select Date"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer h-[42px] text-sm text-slate-700 font-bold"
                                    value={startDate}
                                    onClick={() => setDatePickerTarget('startDate')}
                                />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">To Date</label>
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select Date"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer h-[42px] text-sm text-slate-700 font-bold"
                                    value={endDate}
                                    onClick={() => setDatePickerTarget('endDate')}
                                />
                            </div>
                            <button 
                                onClick={() => { setStartDate(''); setEndDate(''); setSelectedCity(''); }}
                                className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all h-[42px] flex items-center justify-center min-w-[100px]"
                            >
                                Reset
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                            <StatCard title="Revenue (Fees)" value={`৳${analytics?.revenue?.total_fees || '0'}`} trend="+14.2%" up icon={<DollarSign className="text-indigo-600"/>} bg="bg-indigo-50" />
                            <StatCard title="Total Volume" value={`৳${analytics?.stats?.total_volume || '0'}`} trend="+5.1%" up icon={<RefreshCcw className="text-emerald-600"/>} bg="bg-emerald-50" />
                            <StatCard title="Trans. Count" value={analytics?.stats?.transaction_count || '0'} trend="+2.0%" up icon={<PieChart className="text-rose-600"/>} bg="bg-rose-50" />
                            <StatCard title="Avg Trans" value={`৳${Number(analytics?.stats?.avg_transaction || 0).toFixed(0)}`} trend="+2.0%" up icon={<ArrowRightLeft className="text-amber-600"/>} bg="bg-amber-50" />
                        </div>

                        <div className="flex flex-col gap-8">
                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                                    <div className="flex gap-4 items-center">
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest whitespace-nowrap">
                                            Transaction Trend
                                        </h4>
                                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                            <button onClick={() => setTrendView('chart')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${trendView === 'chart' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Chart</button>
                                            <button onClick={() => setTrendView('methods')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${trendView === 'methods' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Methods</button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                        <div className="relative flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-indigo-500 cursor-pointer w-28">
                                            <select 
                                                className="w-full bg-transparent outline-none text-[10px] text-slate-700 font-bold appearance-none cursor-pointer"
                                                value={trendCity}
                                                onChange={(e) => setTrendCity(e.target.value)}
                                            >
                                                <option value="">All Areas</option>
                                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            readOnly
                                            placeholder="From"
                                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer text-[10px] text-slate-700 font-bold"
                                            value={trendStartDate}
                                            onClick={() => setDatePickerTarget('trendStartDate')}
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            placeholder="To"
                                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer text-[10px] text-slate-700 font-bold"
                                            value={trendEndDate}
                                            onClick={() => setDatePickerTarget('trendEndDate')}
                                        />
                                        <button 
                                            onClick={() => { setTrendStartDate(''); setTrendEndDate(''); setTrendCity(''); }}
                                            className="px-3 py-1 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-all text-[10px]"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>

                                {trendView === 'chart' ? (
                                    <>
                                        <div className="flex gap-3 mb-6 flex-wrap">
                                            {Object.entries({cash_in: 'emerald-500', cash_out: 'rose-500', transfer: 'sky-500', send_money: 'amber-500', request_payment: 'purple-500', add_money: 'teal-500', other: 'slate-400'}).map(([k, color]) => (
                                                <div key={k} className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-sm bg-${color}`}></div><span className="text-[10px] uppercase font-bold text-slate-500">{k.replace('_', ' ')}</span></div>
                                            ))}
                                        </div>

                                        <div className="h-64 flex items-end justify-between gap-1 md:gap-2">
                                            {trendData && trendData.length > 0 ? (
                                                trendData.map((t: any, i: number) => {
                                                    const maxVol = Math.max(...trendData.map((d: any) => parseFloat(d.total_volume)));
                                                    const totalH = maxVol > 0 ? (parseFloat(t.total_volume) / maxVol) * 100 : 0;
                                                    
                                                    const keys = Object.keys(t).filter(k => k !== 'date' && k !== 'total_volume');
                                                    
                                                    const typeColors: Record<string, string> = {
                                                        cash_in: 'bg-emerald-500 hover:bg-emerald-400',
                                                        cash_out: 'bg-rose-500 hover:bg-rose-400',
                                                        transfer: 'bg-sky-500 hover:bg-sky-400',
                                                        send_money: 'bg-amber-500 hover:bg-amber-400',
                                                        request_payment: 'bg-purple-500 hover:bg-purple-400',
                                                        add_money: 'bg-teal-500 hover:bg-teal-400',
                                                    };
                                                    
                                                    return (
                                                        <div key={i} style={{ height: `${Math.max(totalH, 5)}%` }} className="flex-1 bg-transparent relative group cursor-pointer transition-all flex flex-col justify-end">
                                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none shadow-xl border border-slate-800 flex flex-col items-center min-w-[120px]">
                                                                <span className="font-black text-emerald-400 text-xs mb-1">৳{parseFloat(t.total_volume).toLocaleString()}</span>
                                                                <div className="flex flex-col gap-1 w-full mt-1 border-t border-slate-700 pt-1">
                                                                    {keys.map(k => t[k] > 0 && (
                                                                        <div key={k} className="flex justify-between items-center w-full gap-3 text-[9px]">
                                                                            <span className="text-slate-400 uppercase font-black tracking-widest">{k.replace('_', ' ')}</span>
                                                                            <span className="font-bold text-white">৳{t[k]}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="w-full h-full flex flex-col justify-end rounded-t-xl overflow-hidden bg-slate-100/50">
                                                                {keys.map((k) => {
                                                                    if (!t[k]) return null;
                                                                    const sliceH = (parseFloat(t[k]) / parseFloat(t.total_volume)) * 100;
                                                                    return <div key={k} style={{ height: `${sliceH}%` }} className={`w-full transition-all ${typeColors[k] || 'bg-slate-400 hover:bg-slate-300'}`}></div>
                                                                })}
                                                            </div>

                                                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-400 rotate-45 whitespace-nowrap">{new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="w-full h-full flex justify-center items-center text-slate-300 text-sm font-bold">No transaction data available</div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-2 h-72 overflow-y-auto pr-2 custom-scrollbar">
                                        {sortedMethods.length > 0 ? sortedMethods.map(([method, volume], index) => {
                                            const maxVolume = sortedMethods[0]?.[1] || 1;
                                            return (
                                                <div key={method} className="flex items-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all group">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 text-xs mr-4 shrink-0 transition-all group-hover:bg-indigo-100 group-hover:text-indigo-600">{index + 1}</div>
                                                    <div className="flex-1 mr-6">
                                                        <h5 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest mb-2">{method.replace('_', ' ')}</h5>
                                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-700 max-w-full" style={{ width: `${(volume / maxVolume) * 100}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <div className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors shrink-0">
                                                        ৳{volume.toLocaleString()}
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="w-full h-full flex justify-center items-center text-slate-300 text-sm font-bold">No transaction data available</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
                                <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex gap-4 items-center">
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest whitespace-nowrap">
                                            User Segmentation
                                        </h4>
                                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                            <button onClick={() => setSegView('activity')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${segView === 'activity' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Activity</button>
                                            <button onClick={() => setSegView('wallets')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${segView === 'wallets' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Wallets</button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                        <div className="relative flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-indigo-500 cursor-pointer w-28">
                                            <select 
                                                className="w-full bg-transparent outline-none text-[10px] text-slate-700 font-bold appearance-none cursor-pointer"
                                                value={segCity}
                                                onChange={(e) => setSegCity(e.target.value)}
                                            >
                                                <option value="">All Areas</option>
                                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            readOnly
                                            placeholder="From"
                                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer text-[10px] text-slate-700 font-bold"
                                            value={segStartDate}
                                            onClick={() => setDatePickerTarget('segStartDate')}
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            placeholder="To"
                                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer text-[10px] text-slate-700 font-bold"
                                            value={segEndDate}
                                            onClick={() => setDatePickerTarget('segEndDate')}
                                        />
                                        <button 
                                            onClick={() => { setSegStartDate(''); setSegEndDate(''); setSegCity(''); }}
                                            className="px-3 py-1 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-all text-[10px]"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                                {segView === 'activity' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-2 items-center">
                                        <div>
                                            <SegmentRow label="Active (< 7d)" value={segData?.activity?.active_users || '0'} percent={(segData?.activity?.active_users / (segData?.activity?.total_users || 1)) * 100 || 0} color="bg-emerald-500" />
                                        </div>
                                        <div>
                                            <SegmentRow label="Irregular (< 30d)" value={segData?.activity?.irregular_users || '0'} percent={(segData?.activity?.irregular_users / (segData?.activity?.total_users || 1)) * 100 || 0} color="bg-amber-500" />
                                        </div>
                                        <div>
                                            <SegmentRow label="Inactive (> 90d)" value={segData?.activity?.inactive_users || '0'} percent={(segData?.activity?.inactive_users / (segData?.activity?.total_users || 1)) * 100 || 0} color="bg-rose-500" />
                                        </div>
                                        <div>
                                            <SegmentRow label="Total Users" value={segData?.activity?.total_users || '0'} percent={100} color="bg-indigo-600" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mt-2 items-center">
                                        <div>
                                            <SegmentRow label="Active Wallets" value={segData?.wallets?.active_wallets || '0'} percent={(segData?.wallets?.active_wallets / (segData?.wallets?.total_wallets || 1)) * 100 || 0} color="bg-emerald-500" />
                                        </div>
                                        <div>
                                            <SegmentRow label="Frozen Wallets" value={segData?.wallets?.frozen_wallets || '0'} percent={(segData?.wallets?.frozen_wallets / (segData?.wallets?.total_wallets || 1)) * 100 || 0} color="bg-sky-500" />
                                        </div>
                                        <div>
                                            <SegmentRow label="Disabled Wallets" value={segData?.wallets?.disabled_wallets || '0'} percent={(segData?.wallets?.disabled_wallets / (segData?.wallets?.total_wallets || 1)) * 100 || 0} color="bg-rose-500" />
                                        </div>
                                        <div>
                                            <SegmentRow label="Loan Defaults" value={segData?.wallets?.loan_defaults || '0'} percent={(segData?.wallets?.loan_defaults / (segData?.wallets?.total_wallets || 1)) * 100 || 0} color="bg-rose-600" />
                                        </div>
                                        <div>
                                            <SegmentRow label="Total Wallets" value={segData?.wallets?.total_wallets || '0'} percent={100} color="bg-indigo-600" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2, 11: AGENT PERFORMANCE & COMMISSIONS */}
                    <section id="agents" className="scroll-mt-32">
                        <AgentRankingList apiPrefix="/admin/agent" />
                    </section>

                    {/* Merchant Performance Section */}
                    <section id="merchants" className="scroll-mt-32">
                        <MerchantRankingList apiPrefix="/admin/merchant" />
                    </section>

                    {/* SECTION 9: USER MANAGEMENT & ACCOUNT CONTROLS */}
                    <section id="users" className="scroll-mt-32">
                        <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">User Management</h2>
                                <p className="text-slate-500 font-medium">Freeze/Unfreeze & Detailed Directory</p>
                            </div>
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="text" 
                                        placeholder="Search phone number..." 
                                        className="pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 shadow-sm w-full md:w-64"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>
                                
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-5">Platform Member</th>
                                        <th className="px-8 py-5">Wallet Status</th>
                                        <th className="px-8 py-5">Total Assets</th>
                                        <th className="px-8 py-5 text-right">Admin Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.length > 0 ? users.map((u, i) => (
                                        <UserRow key={i} id={u.user_id} name={u.name} phone={u.phone} nid={u.nid} status={u.status} balance={u.balance} isDefaulted={u.has_loan_default} onToggle={toggleUserStatus} onViewHistory={(userId: number) => router.push(`/admin/user/${userId}`)} />
                                    )) : (
                                        <tr><td colSpan={4} className="px-8 py-6 text-center text-slate-400">Loading users...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* SECTION 3: LOANS & SAVINGS (INTEGRATED WIDGET) */}
                    <section id="loans" className="scroll-mt-32">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Loans & Savings</h2>
                            <p className="text-slate-500 font-medium">Review loan requests and savings maturity</p>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <LoanSummaryWidget />
                            <DefaultedLoansWidget />
                        </div>
                        
                        <div className="mt-8 grid grid-cols-1 xl:grid-cols-1 gap-8">
                            {/* Existing Savings Overview */}
                            <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden flex flex-col justify-center min-h-[300px]">
                                <div className="absolute top-0 right-0 p-10 opacity-10"><Landmark size={150}/></div>
                                <h4 className="font-black text-indigo-400 uppercase text-xs tracking-widest mb-10">Fixed Savings Pool</h4>
                                <div className="flex items-end gap-3 mb-4">
                                    <span className="text-6xl font-black">
                                        ৳{formatCurrency(portfolio?.totalSavings?.total_savings)}
                                    </span>
                                    <span className="text-indigo-400 font-bold mb-2">Total Assets</span>
                                </div>
                                <div className="flex items-center gap-6 mt-4">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Current MRR</p>
                                        <p className="text-lg font-black text-emerald-400">৳{formatCurrency(portfolio?.mrr?.mrr)}</p>
                                    </div>
                                    <div className="w-[1px] h-10 bg-slate-800"></div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active Plans</p>
                                        <p className="text-lg font-black">{formatCount(portfolio?.activeSavingsCount)}</p>
                                    </div>
                                </div>
                                <div className="mt-6 space-y-3">
                                    {activeSavings.length === 0 ? (
                                        <p className="text-[11px] text-slate-300">No active plans yet.</p>
                                    ) : (
                                        activeSavings.map((plan) => (
                                            <div key={plan.fixed_savings_id} className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/10">
                                                <div>
                                                    <p className="text-sm font-black text-white">{plan.user_name || plan.phone}</p>
                                                    <p className="text-[10px] text-slate-300">
                                                        {new Date(plan.finish_at).toLocaleDateString()} • @{plan.annual_interest_rate}% APR
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-emerald-200">৳{formatCurrency(plan.principal_amount)}</p>
                                                    <p className="text-[10px] text-slate-300">Plan #{plan.fixed_savings_id}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <Link href="/admin/savings" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 hover:text-white">
                                        <span>View All Plans</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION: SYSTEM PROTOCOL SETTINGS */}
                    <section id="settings" className="scroll-mt-32">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">System Settings</h2>
                            <p className="text-slate-500 font-medium">Configure global interest rates and transaction fees</p>
                        </div>
                        <SystemSettingsWidget />
                    </section>

                    {/* SECTION: SEND NOTIFICATIONS */}
                    <section id="notify" className="scroll-mt-32">
                        <div className="mb-6">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Send Notifications</h2>
                            <p className="text-slate-500 font-medium">Broadcast messages to users, agents, and merchants</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
                                        <select 
                                            value={notifyAudience}
                                            onChange={(e) => setNotifyAudience(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 transition-all"
                                        >
                                            <option value="all">All Active Users (User, Agent, Merchant)</option>
                                            <option value="users">Regular Users</option>
                                            <option value="agents">Agents</option>
                                            <option value="merchants">Merchants</option>
                                            <option value="phone">Specific Phone Number</option>
                                        </select>
                                    </div>
                                    
                                    {notifyAudience === 'phone' && (
                                        <div className="animate-fadeIn">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Recipient Phone</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 017XXXXXXXX"
                                                value={notifyPhone}
                                                onChange={(e) => setNotifyPhone(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                                    <textarea 
                                        rows={4}
                                        placeholder="Type your notification message here..."
                                        value={notifyMessage}
                                        onChange={(e) => setNotifyMessage(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 transition-all resize-none"
                                    ></textarea>
                                    <div className="text-right mt-2 flex justify-end">
                                        <button 
                                            onClick={handleSendNotification}
                                            disabled={notifySending}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {notifySending ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : <Bell size={18} />}
                                            {notifySending ? 'Sending...' : 'Broadcast Notification'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION: FRAUD DETECTION ALERTS */}
                    <section id="fraud" className="scroll-mt-32">
                        <div className="mb-6">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Fraud Alerts</h2>
                            <p className="text-slate-500 font-medium">Monitor suspicious transactions & take action</p>
                        </div>

                        {/* Fraud Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                            <div onClick={() => setFraudFilter('')} className={`bg-white p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${!fraudFilter ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4"><ShieldCheck className="text-indigo-600" size={22} /></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Alerts</p>
                                <p className="text-3xl font-black text-slate-900 mt-1">{fraudStats?.total || 0}</p>
                            </div>
                            <div onClick={() => setFraudFilter('pending')} className={`bg-white p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${fraudFilter === 'pending' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'}`}>
                                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4"><ShieldAlert className="text-amber-600" size={22} /></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Review</p>
                                <p className="text-3xl font-black text-amber-600 mt-1">{fraudStats?.pending || 0}</p>
                            </div>
                            <div onClick={() => setFraudFilter('frozen')} className={`bg-white p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${fraudFilter === 'frozen' ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'}`}>
                                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4"><Lock className="text-rose-600" size={22} /></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accounts Frozen</p>
                                <p className="text-3xl font-black text-rose-600 mt-1">{fraudStats?.frozen || 0}</p>
                            </div>
                            <div onClick={() => setFraudFilter('dismissed')} className={`bg-white p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${fraudFilter === 'dismissed' ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4"><UserCheck className="text-emerald-600" size={22} /></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dismissed</p>
                                <p className="text-3xl font-black text-emerald-600 mt-1">{fraudStats?.dismissed || 0}</p>
                            </div>
                        </div>

                        {/* Fraud Alerts List */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className="text-rose-500" size={20} />
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                                        {fraudFilter ? `${fraudFilter} alerts` : 'All Fraud Alerts'}
                                    </h4>
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                                        {fraudAlerts.length} alerts
                                    </span>
                                </div>
                                {fraudFilter && (
                                    <button onClick={() => setFraudFilter('')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
                                        Show All
                                    </button>
                                )}
                            </div>

                            {fraudLoading ? (
                                <div className="p-16 text-center">
                                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scanning for fraud alerts...</p>
                                </div>
                            ) : fraudAlerts.length === 0 ? (
                                <div className="p-16 text-center">
                                    <ShieldCheck className="mx-auto text-emerald-300 mb-4" size={48} />
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No fraud alerts found</p>
                                    <p className="text-xs text-slate-300 mt-2">System is monitoring all transactions in real-time</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                                    {fraudAlerts.map((alert: any) => (
                                        <div key={alert.alert_id} className={`px-8 py-6 hover:bg-slate-50/80 transition-all ${
                                            alert.alert_status === 'pending' ? 'border-l-4 border-l-amber-400' :
                                            alert.alert_status === 'frozen' ? 'border-l-4 border-l-rose-400' :
                                            'border-l-4 border-l-emerald-400'
                                        }`}>
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter ${
                                                            alert.alert_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                            alert.alert_status === 'frozen' ? 'bg-rose-100 text-rose-700' :
                                                            'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                            {alert.alert_status}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            Alert #{alert.alert_id}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[10px] font-black">
                                                            {alert.repeat_count}× in 1 hour
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm">
                                                            {alert.user_name ? alert.user_name[0] : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-800 text-sm">{alert.user_name || 'Unknown User'}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                                {alert.user_phone} • Account: <span className={alert.user_status === 'active' ? 'text-emerald-600' : 'text-rose-600'}>{alert.user_status}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>

                                                    <div className="flex flex-wrap gap-3 mt-3">
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                                             ৳{alert.amount}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                                             {alert.transaction_type}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                                             {new Date(alert.created_at).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {alert.resolved_by_name && (
                                                        <p className="text-[10px] text-slate-400 mt-2 italic">
                                                            Resolved by {alert.resolved_by_name} on {new Date(alert.resolved_at).toLocaleString()}
                                                            {alert.resolution_note && ` — "${alert.resolution_note}"`}
                                                        </p>
                                                    )}
                                                </div>

                                                {alert.alert_status === 'pending' && (
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleResolveFraudAlert(alert.alert_id, 'freeze')}
                                                            disabled={fraudResolving === alert.alert_id}
                                                            className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            {fraudResolving === alert.alert_id ? (
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            ) : <Lock size={14} />}
                                                            Freeze Account
                                                        </button>
                                                        <button
                                                            onClick={() => handleResolveFraudAlert(alert.alert_id, 'dismiss')}
                                                            disabled={fraudResolving === alert.alert_id}
                                                            className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            <UserCheck size={14} />
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section id="recon" className="scroll-mt-32">
                        <div className="space-y-10">
                            {/* --- Top Part: Settlement Summary (Now Full Width) --- */}
                             <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                                 <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                     <div>
                                         <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Reconciliation</h2>
                                         <p className="text-slate-500 font-medium">Daily inflow vs outflow audit</p>
                                     </div>
                                     <div className="flex gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex-1 md:max-w-2xl justify-around">
                                         <ReconItem label="Inflow" value={`+৳${analytics?.reconciliation?.inflow || 0}`} />
                                         <div className="w-[1px] h-8 bg-slate-200 hidden md:block"></div>
                                         <ReconItem label="Outflow" value={`-৳${analytics?.reconciliation?.outflow || 0}`} />
                                         <div className="w-[1px] h-8 bg-slate-200 hidden md:block"></div>
                                         <ReconItem 
                                             label="Net Flow" 
                                             value={`৳${(parseFloat(analytics?.reconciliation?.inflow || 0) - parseFloat(analytics?.reconciliation?.outflow || 0)).toLocaleString()}`} 
                                             success={parseFloat(analytics?.reconciliation?.inflow || 0) - parseFloat(analytics?.reconciliation?.outflow || 0) >= 0} 
                                         />
                                     </div>
                                 </div>
                             </div>

                              <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                      <div>
                                          <h3 className="text-2xl font-black text-slate-900">Admin Wallet Flow</h3>
                                          <p className="text-[11px] text-slate-500 uppercase tracking-[0.3em]">
                                              Income sources for the admin profit wallet (wallet #48)
                                          </p>
                                      </div>
                                      <div className="flex gap-2">
                                          {RECON_PERIODS.map((periodOpt) => (
                                              <button
                                                  key={periodOpt.key}
                                                  type="button"
                                                  onClick={() => setReconScope(periodOpt.key)}
                                                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl border transition-all ${
                                                      reconScope === periodOpt.key
                                                          ? 'bg-indigo-600 text-white border-indigo-600'
                                                          : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                                                  }`}
                                              >
                                                  {periodOpt.label}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                                  <div className="grid gap-6 md:grid-cols-[1.5fr_1fr] mt-6">
                                      <div className="grid gap-3 sm:grid-cols-3">
                                          {[
                                              { label: 'Loan Interest', value: currentFlow.loanInterest },
                                              { label: 'System Profit', value: currentFlow.systemProfit },
                                              { label: 'Merchant Subscription', value: currentFlow.merchantSubscription },
                                          ].map((item) => (
                                              <div key={item.label} className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4">
                                                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">{item.label}</p>
                                                  <p className="text-2xl font-black text-slate-900 mt-2">
                                                      {adminWalletLoading
                                                          ? 'Loading...'
                                                          : `+৳${formatCurrency(item.value)}`}
                                                  </p>
                                                  <p className="text-[10px] text-slate-500 mt-1">
                                                      {item.label} credits into wallet 48
                                                  </p>
                                              </div>
                                          ))}
                                      </div>
                                      <div className="space-y-4">
                                          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6">
                                              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Total Incoming</p>
                                              <p className="text-3xl font-black text-emerald-600 mt-3">
                                                  {adminWalletLoading
                                                      ? 'Loading...'
                                                      : `+৳${formatCurrency(currentFlow.totalIncoming)}`}
                                              </p>
                                              <p className="text-[10px] text-slate-500 mt-1">All credits landing in wallet 48</p>
                                          </div>
                                          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6">
                                              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Outgoing</p>
                                              <p className="text-3xl font-black text-rose-600 mt-3">
                                                  {adminWalletLoading
                                                      ? 'Loading...'
                                                      : `-৳${formatCurrency(currentFlow.totalOutgoing)}`}
                                              </p>
                                              <p className="text-[10px] text-slate-500 mt-1">Money paid from wallet 48 settlements</p>
                                          </div>
                                      </div>
                                  </div>
                                  {!adminWalletLoading && (
                                      <div className="mt-6">
                                          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 mb-3">Previous Month (wallet 48)</p>
                                          <div className="grid gap-4 sm:grid-cols-2">
                                              {[
                                                  {
                                                      label: 'Incoming',
                                                      value: previousMonthFlow.totalIncoming,
                                                      prefix: '+৳',
                                                      color: 'emerald-600',
                                                  },
                                                  {
                                                      label: 'Outgoing',
                                                      value: previousMonthFlow.totalOutgoing,
                                                      prefix: '-৳',
                                                      color: 'rose-600',
                                                  },
                                              ].map((item) => (
                                                  <div key={item.label} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                                                      <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">{item.label}</p>
                                                      <p className={`text-2xl font-black mt-2 text-${item.color}`}>
                                                          {`${item.prefix}${formatCurrency(item.value)}`}
                                                      </p>
                                                      <p className="text-[10px] text-slate-500 mt-1">Totals for the previous month</p>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 mt-6">
                                      Totals reflect {reconScope === 'day' ? 'today' : 'this month'} for wallet 48.
                                  </p>
                              </div>

                              {/* --- Bottom Part: Admin Action History (Now Full Width) --- */}
                            <div id="audit" className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col">
                                <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Admin Action History</h2>
                                    </div>
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                                        {audit.length} Recent Logs
                                    </span>
                                </div>
                                
                                {/* The list now spans the full width */}
                                <div className="flex-1 space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {audit.length > 0 ? audit.map((a, i) => (
                                        <AuditLog 
                                            key={i} 
                                            admin={a.admin_name || `Admin #${a.admin_user_id}`} 
                                            action={a.action_type} 
                                            target={a.target_id} 
                                            description={a.description} 
                                            time={new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} 
                                        />
                                    )) : (
                                        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No activity logs found in the system</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
                <ConfirmModal 
                    isOpen={confirmConfig.isOpen}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    confirmText={confirmConfig.confirmText}
                    type={confirmConfig.type}
                    onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmConfig.onConfirm}
                />
            </main>
        </div>
    );
}

/* --- REUSABLE UI COMPONENTS --- */

function NavBtn({ icon, label, active, onClick, collapsed }: any) {
    return (
        <button onClick={onClick} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all group ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-slate-900 hover:text-white'} ${collapsed ? 'justify-center' : ''}`}>
            {React.cloneElement(icon, { size: 22, className: active ? 'text-white' : 'group-hover:text-indigo-400 transition-colors' })}
            {!collapsed && <span className="text-sm font-black tracking-tight">{label}</span>}
        </button>
    );
}

function StatCard({ title, value, trend, up, icon, bg }: any) {
    return (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mb-6`}>{icon}</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <div className="flex items-end justify-between mt-2">
                <h3 className="text-3xl font-black text-slate-900">{value}</h3>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{trend}</span>
            </div>
        </div>
    );
}

function UserRow({ id, name, phone, nid, status, balance, isDefaulted, onToggle, onViewHistory }: any) {
    return (
        <tr className="hover:bg-slate-50/80 transition-all group border-b border-slate-50 last:border-0">
            <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">{name ? name[0] : '?'}</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800 text-sm">{name}</p>
                            {isDefaulted && (
                                <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1 animate-pulse">
                                    <ShieldAlert size={10} /> Loan Default
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{phone}</p>
                    </div>
                </div>
            </td>
            <td className="px-8 py-6">
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{status}</span>
            </td>
            <td className="px-8 py-6 font-black text-slate-700 text-sm">৳{balance}</td>
            <td className="px-8 py-6 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onViewHistory(id)} className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                        History
                    </button>
                    <button onClick={() => onToggle(id, status)} className={`p-2.5 rounded-2xl transition-all ${status === 'active' ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>
                        {status === 'active' ? <Lock size={16}/> : <Unlock size={16}/>}
                    </button>
                </div>
            </td>
        </tr>
    );
}

function SegmentRow({ label, value, percent, color }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-900">{value}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
}

function AuditLog({ admin, action, target, description, time }: any) {
    return (
        <div className="group p-4 bg-slate-50 hover:bg-white hover:shadow-md hover:border-indigo-100 border border-transparent rounded-2xl transition-all">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                        action.includes('reject') || action.includes('freeze') ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}></div>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{admin}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        action.includes('loan') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                    }`}>{action.replace('_', ' ')}</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400">{time}</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed mb-1">{description}</p>
            {target && (
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded tracking-widest uppercase">Target ID: {target}</span>
            )}
        </div>
    );
}

function LoanItem({ user, amount, interest, status, color }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-sm font-bold">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm"><Percent size={14}/></div>
                <div><p className="text-slate-800">{user}</p><p className="text-[10px] text-slate-400 uppercase tracking-widest">Rate: {interest}</p></div>
            </div>
            <div className="text-right"><p className="text-slate-900">{amount}</p><p className={`text-[10px] font-black uppercase tracking-tighter ${color}`}>{status}</p></div>
        </div>
    );
}

function ReconItem({ label, value, success }: any) {
    return (
        <div className="flex justify-between items-center text-sm font-black tracking-tight">
            <span className="text-slate-500">{label}</span>
            <span className={success ? 'text-emerald-600' : 'text-slate-900'}>{value}</span>
        </div>
    );
}

function IconButton({ icon, badge, onClick, ariaLabel }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className="p-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all relative"
        >
            {icon}
            {badge && <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></div>}
        </button>
    );
}

function LogoutIcon() { return <LogOut size={20}/>; }
