'use client';

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, UserRound, History, Settings, ShieldCheck, 
    TrendingUp, CreditCard, Activity, PieChart, Lock, Unlock, 
    FileText, Search, Filter, Bell, Menu, X, Landmark, RefreshCcw, 
    Calendar, ArrowRightLeft, DollarSign, Percent, LogOut
} from 'lucide-react';

export default function AdminDashboard() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
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
                    <NavBtn icon={<UserRound />} label="User Management" active={activeSection === 'users'} onClick={() => scrollToSection('users')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<Users />} label="Agent Performance" active={activeSection === 'agents'} onClick={() => scrollToSection('agents')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<Landmark />} label="Loans & Savings" active={activeSection === 'loans'} onClick={() => scrollToSection('loans')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<RefreshCcw />} label="Reconciliation" active={activeSection === 'recon'} onClick={() => scrollToSection('recon')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<Activity />} label="System Audit" active={activeSection === 'audit'} onClick={() => scrollToSection('audit')} collapsed={!isSidebarOpen} />
                    <NavBtn icon={<Settings />} label="System Settings" active={activeSection === 'settings'} onClick={() => scrollToSection('settings')} collapsed={!isSidebarOpen} />
                </nav>

                <div className="p-4 border-t border-slate-900">
                    <button className="flex items-center gap-3 w-full p-3 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all">
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
                            <IconButton icon={<Bell size={20}/>} badge />
                            <div className="h-10 w-[1px] bg-slate-200 mx-2"></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-slate-800">Wahid Hoque</p>
                                    <p className="text-[10px] text-indigo-600 font-bold">Super Admin</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 border-4 border-white shadow-xl flex items-center justify-center text-white font-black text-lg">W</div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-10 space-y-32">
                    
                    {/* SECTION 1, 3, 5: ANALYTICS, CHURN & TRENDS */}
                    <section id="dashboard" className="scroll-mt-32">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Financial Intelligence</h2>
                                <p className="text-slate-500 font-medium">Real-time revenue & user behavior analysis</p>
                            </div>
                            <div className="flex gap-3 bg-white p-1.5 rounded-2xl border shadow-sm">
                                <FilterBtn label="Dhaka" active />
                                <FilterBtn label="Sylhet" />
                                <FilterBtn label="Chittagong" />
                                <div className="w-[1px] bg-slate-200 mx-1"></div>
                                <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all">Custom Range</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                            <StatCard title="Revenue (Fees)" value="৳142,850" trend="+14.2%" up icon={<DollarSign className="text-indigo-600"/>} bg="bg-indigo-50" />
                            <StatCard title="User Churn" value="1.8%" trend="-0.4%" up icon={<PieChart className="text-rose-600"/>} bg="bg-rose-50" />
                            <StatCard title="Active Subs" value="2,401" trend="+5.1%" up icon={<RefreshCcw className="text-emerald-600"/>} bg="bg-emerald-50" />
                            <StatCard title="Avg Trans" value="৳1,240" trend="+2.0%" up icon={<ArrowRightLeft className="text-amber-600"/>} bg="bg-amber-50" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <div className="flex justify-between items-center mb-8">
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Transaction Trend Analysis</h4>
                                    <div className="flex gap-4 text-[10px] font-bold">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-full"></div> Send Money</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 rounded-full"></div> Cash Out</div>
                                    </div>
                                </div>
                                <div className="h-64 flex items-end justify-between gap-4">
                                    {[40, 70, 45, 90, 65, 85, 50, 75, 60, 95].map((h, i) => (
                                        <div key={i} className="flex-1 bg-slate-100 rounded-t-xl relative group cursor-pointer hover:bg-indigo-50 transition-all">
                                            <div style={{ height: `${h}%` }} className="bg-indigo-600 w-full rounded-t-xl group-hover:bg-indigo-500 transition-all"></div>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all">৳{h}k</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6">User Segmentation</h4>
                                <div className="space-y-6">
                                    <SegmentRow label="Top Volume Users" value="842" percent={85} color="bg-indigo-600" />
                                    <SegmentRow label="Inactive (Dormant)" value="1,204" percent={40} color="bg-slate-300" />
                                    <SegmentRow label="Returning (Retention)" value="6,402" percent={72} color="bg-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2, 11: AGENT PERFORMANCE & COMMISSIONS */}
                    <section id="agents" className="scroll-mt-32">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Agent Network</h2>
                            <p className="text-slate-500 font-medium">Commission breakdown & hierarchy tracking</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PerformanceCard name="Rahim Uddin" city="Dhaka" vol="৳1.2M" comm="৳12,000" rank="#1" />
                            <PerformanceCard name="Karim Ali" city="Sylhet" vol="৳980K" comm="৳9,800" rank="#2" />
                            <PerformanceCard name="Siddiqur" city="Dhaka" vol="৳850K" comm="৳8,500" rank="#3" />
                        </div>
                    </section>

                    {/* SECTION 9: USER MANAGEMENT & ACCOUNT CONTROLS */}
                    <section id="users" className="scroll-mt-32">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Account Lifecycle</h2>
                                <p className="text-slate-500 font-medium">Freeze/Unfreeze & Detailed Directory</p>
                            </div>
                            <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all">+ New User</button>
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
                                    <UserRow name="Wahid Hoque" phone="01712345678" nid="2305054XXX" status="Active" balance="৳142,000" />
                                    <UserRow name="Abu Bakar" phone="01812345678" nid="2305059XXX" status="Frozen" balance="৳12,500" />
                                    <UserRow name="Sarah Miller" phone="01911223344" nid="4455667XXX" status="Active" balance="৳8,200" />
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* SECTION 6, 7, 8: LOAN, SAVINGS & SUBSCRIPTIONS */}
                    <section id="loans" className="scroll-mt-32">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-8">Credit & Interest Portfolios</h2>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6">Loan Default Risk Assessment</h4>
                                <div className="space-y-4">
                                    <LoanItem user="User #802" amount="৳50,000" interest="5%" status="At Risk" color="text-rose-600" />
                                    <LoanItem user="User #124" amount="৳20,000" interest="4.5%" status="Repaid" color="text-emerald-600" />
                                    <LoanItem user="User #442" amount="৳10,000" interest="6%" status="Active" color="text-indigo-600" />
                                </div>
                            </div>
                            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Landmark size={120}/></div>
                                <h4 className="font-black text-indigo-400 uppercase text-xs tracking-widest mb-8">Fixed Savings Maturity (30 Days)</h4>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-5xl font-black">৳420K</span>
                                    <span className="text-indigo-400 font-bold mb-1">Interest Accrued</span>
                                </div>
                                <p className="text-slate-400 text-sm font-medium">Calculated across 84 active fixed accounts</p>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 10, 12: RECONCILIATION & AUDIT */}
                    <section id="recon" className="scroll-mt-32">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Settlement & Audit</h2>
                                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6">Daily Reconciliation Dashboard</h4>
                                    <div className="space-y-6">
                                        <ReconItem label="Inflow (Bank/Card)" value="+৳2.4M" />
                                        <ReconItem label="Outflow (Cashouts)" value="-৳1.1M" />
                                        <div className="h-[1px] bg-slate-100"></div>
                                        <ReconItem label="System Ledger Check" value="Verified" success />
                                    </div>
                                </div>
                            </div>
                            <div id="audit" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-3">
                                    <Activity className="text-indigo-600"/> Admin Action History
                                </h4>
                                <div className="flex-1 space-y-4 max-h-80 overflow-y-auto pr-4">
                                    <AuditLog admin="Wahid_Admin" action="User Frozen" target="UID: 8402" time="12:42 PM" />
                                    <AuditLog admin="Siddique_Admin" action="Loan Approved" target="LID: 102" time="11:15 AM" />
                                    <AuditLog admin="Wahid_Admin" action="Rate Modified" target="Interest: 4.5%" time="09:30 AM" />
                                    <AuditLog admin="System" action="Backup Created" target="DB_PROD" time="02:00 AM" />
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
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

function UserRow({ name, phone, nid, status, balance }: any) {
    return (
        <tr className="hover:bg-slate-50/80 transition-all group border-b border-slate-50 last:border-0">
            <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">{name[0]}</div>
                    <div>
                        <p className="font-black text-slate-800 text-sm">{name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{phone}</p>
                    </div>
                </div>
            </td>
            <td className="px-8 py-6">
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{status}</span>
            </td>
            <td className="px-8 py-6 font-black text-slate-700 text-sm">{balance}</td>
            <td className="px-8 py-6 text-right">
                <button className={`p-3 rounded-2xl transition-all ${status === 'Active' ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>
                    {status === 'Active' ? <Lock size={16}/> : <Unlock size={16}/>}
                </button>
            </td>
        </tr>
    );
}

function PerformanceCard({ name, city, vol, comm, rank }: any) {
    return (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 text-4xl font-black text-slate-50 group-hover:text-indigo-50 transition-colors">{rank}</div>
            <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">{name[0]}</div>
                <div>
                    <h4 className="font-black text-slate-800">{name}</h4>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{city} Branch</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Volume</p><p className="text-xl font-black text-slate-800">{vol}</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Commission</p><p className="text-xl font-black text-emerald-600">{comm}</p></div>
            </div>
        </div>
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

function AuditLog({ admin, action, target, time }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <div className="text-xs">
                    <span className="font-black text-slate-800">{admin}</span>
                    <span className="mx-2 text-indigo-600 font-bold">{action}</span>
                    <span className="text-slate-400">on {target}</span>
                </div>
            </div>
            <span className="text-[10px] font-black text-slate-300">{time}</span>
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

function IconButton({ icon, badge }: any) {
    return (
        <button className="p-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all relative">
            {icon}
            {badge && <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></div>}
        </button>
    );
}

function FilterBtn({ label, active }: any) {
    return (
        <button className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{label}</button>
    );
}

function LogoutIcon() { return <LogOut size={20}/>; }