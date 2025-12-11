import React, { useState, useEffect } from 'react';
import { AppState, SubscriptionPlan, SupportTicket, Tenant, UserProfile, SubscriptionTier, BillingPeriod } from '../types';
import { 
    LayoutDashboard, Building, CreditCard, LogOut, 
    Plus, Cpu, HardDrive, ShieldCheck, X, Edit,
    Search, ChevronRight, TrendingUp, Server, Lock // <--- Added Lock to imports
} from 'lucide-react';
import { SuperAdminService, PlanService } from '../services/api';

interface SuperAdminProps {
    appState: AppState;
    onUpdateTenant: (tenant: Tenant) => void;
    onCreateTenant: (tenant: Tenant, user: UserProfile, password: string) => void;
    onUpdatePlan: (plan: SubscriptionPlan) => void;
    onUpdateTicket: (ticket: SupportTicket) => void;
    onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminProps> = ({ appState, onUpdateTenant, onCreateTenant, onUpdatePlan, onLogout }) => {
    const [activeView, setActiveView] = useState<'overview' | 'clinics' | 'subscriptions' | 'tickets' | 'system'>('overview');
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Default stats to 0
    const [stats, setStats] = useState({
        totalClinics: 0,
        activeClinics: 0,
        suspendedClinics: 0,
        totalRevenue: 0,
        systemLoad: { cpuUsage: 0, memoryUsage: 0 }
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClinic, setSelectedClinic] = useState<Tenant | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    
    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClinicForm, setNewClinicForm] = useState({
        clinicName: '', 
        adminName: '', 
        email: '', 
        password: '', 
        plan: 'Trial' as SubscriptionTier, 
        billingPeriod: 'Monthly' as BillingPeriod, 
        country: 'Nigeria'
    });

    // Edit Subscription State
    const [editSubForm, setEditSubForm] = useState<{ plan: SubscriptionTier; billingPeriod: BillingPeriod }>({
        plan: 'Trial',
        billingPeriod: 'Monthly'
    });

    // Fetch Data on Mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [tenantsRes, statsRes, plansRes] = await Promise.all([
                    SuperAdminService.getTenants(),
                    SuperAdminService.getStats(),
                    PlanService.getAll()
                ]);

                setTenants(tenantsRes.data);
                
                // Map Backend API Stats strictly.
                const backendStats = statsRes.data;
                setStats({
                    totalClinics: backendStats.totalClinics || 0,
                    activeClinics: backendStats.activeSubscriptions || 0,
                    suspendedClinics: (backendStats.totalClinics || 0) - (backendStats.activeSubscriptions || 0),
                    totalRevenue: backendStats.monthlyRevenue || 0,
                    systemLoad: backendStats.systemLoad || { cpuUsage: 0, memoryUsage: 0 } 
                });

                setPlans(plansRes.data);
            } catch (error) {
                console.error("Failed to load admin data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (selectedClinic) {
            setEditSubForm({
                plan: selectedClinic.plan,
                billingPeriod: selectedClinic.billingPeriod
            });
        }
    }, [selectedClinic]);

    const handleCreateSubmit = async () => {
        if (!newClinicForm.clinicName || !newClinicForm.email) return;
        try {
            const payload = { ...newClinicForm, name: newClinicForm.adminName };
            await SuperAdminService.createTenant(payload);
            
            const res = await SuperAdminService.getTenants();
            setTenants(res.data);
            
            setIsCreateModalOpen(false);
            setNewClinicForm({ clinicName: '', adminName: '', email: '', password: '', plan: 'Trial', billingPeriod: 'Monthly', country: 'Nigeria' });
        } catch (e: any) {
            console.error(e);
            alert('Failed to create tenant: ' + (e.response?.data?.error || e.message));
        }
    };

    const handleUpdateStatus = async (tenant: Tenant, status: 'Active' | 'Suspended' | 'Restricted') => {
        try {
            await SuperAdminService.updateTenant(tenant.id, { status });
            setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, status } : t));
            if (selectedClinic?.id === tenant.id) setSelectedClinic({ ...tenant, status });
        } catch (e) {
            alert('Update failed');
        }
    };

    const handleUpdateSubscription = async () => {
        if (!selectedClinic) return;
        try {
            await SuperAdminService.updateTenant(selectedClinic.id, {
                plan: editSubForm.plan,
                billingPeriod: editSubForm.billingPeriod
            });
            const updated = { ...selectedClinic, plan: editSubForm.plan, billingPeriod: editSubForm.billingPeriod };
            setSelectedClinic(updated);
            setTenants(prev => prev.map(t => t.id === updated.id ? updated : t));
        } catch (e) {
            alert("Failed to update subscription");
        }
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlan) return;
        
        const cleanPrice = (price: string | number) => {
            if (typeof price === 'number') return price;
            return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
        };

        try {
            await PlanService.update(selectedPlan.id, {
                priceMonthly: cleanPrice(selectedPlan.price.Monthly),
                priceYearly: cleanPrice(selectedPlan.price.Yearly),
                features: selectedPlan.features,
                limits: selectedPlan.limits
            });
            setSelectedPlan(null);
            const res = await PlanService.getAll();
            setPlans(res.data);
            onUpdatePlan(selectedPlan);
        } catch (e) {
            alert('Failed to update plan');
        }
    };

    const filteredTenants = tenants.filter(t => 
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- UI COMPONENTS ---

    const StatCard = ({ label, value, subValue, icon: Icon, colorClass, delay }: any) => (
        <div 
            className="group bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            style={{ animation: `fadeInUp 0.6s ease-out ${delay}s backwards` }}
        >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl ${colorClass}`}></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1 tracking-wide">{label}</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-2">{value}</h3>
                    {subValue && (
                        <div className="flex items-center text-xs font-bold px-2 py-1 rounded-full bg-slate-100/50 w-fit text-slate-600 border border-slate-200/50">
                            <TrendingUp className="w-3 h-3 mr-1" /> {subValue}
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-2xl ${colorClass} text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );

    const UsageBar = ({ used, limit, colorClass }: { used: number, limit: number, colorClass: string }) => {
        const percent = limit === -1 ? 5 : Math.min(100, (used / limit) * 100);
        return (
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3 border border-slate-200/50">
                <div 
                    className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`} 
                    style={{ width: `${percent}%` }}
                />
            </div>
        );
    };

    if (isLoading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Establishing Secure Connection...</p>
        </div>
    );

    const renderOverview = () => (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h2>
                <div className="text-sm font-medium text-slate-500 bg-white/50 px-4 py-2 rounded-full border border-slate-200/60 backdrop-blur-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Tenants" value={stats.totalClinics} subValue={`${stats.activeClinics} Active`} icon={Building} colorClass="bg-indigo-600" delay={0.1}/>
                <StatCard label="Monthly Revenue" value={`₦${(stats.totalRevenue || 0).toLocaleString()}`} subValue="Gross Income" icon={CreditCard} colorClass="bg-emerald-500" delay={0.2}/>
                <StatCard label="CPU Load" value={`${stats.systemLoad.cpuUsage.toFixed(1)}%`} subValue="Live Metric" icon={Cpu} colorClass="bg-violet-500" delay={0.3}/>
                <StatCard label="Memory Usage" value={`${stats.systemLoad.memoryUsage}%`} subValue="System RAM" icon={Server} colorClass="bg-rose-500" delay={0.4}/>
            </div>
        </div>
    );

    const renderPlans = () => (
        <div className="space-y-8 animate-fade-in-up">
             <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Subscription Plans</h2>
                    <p className="text-slate-500 mt-1">Manage pricing tiers and resource limits.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan, idx) => (
                    <div 
                        key={plan.id} 
                        style={{ animationDelay: `${idx * 0.1}s` }}
                        className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full group"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">{plan.name}</span>
                            <button onClick={() => setSelectedPlan(plan)} className="text-slate-400 hover:text-indigo-600 transition-colors bg-white p-2 rounded-full shadow-sm border border-slate-100">
                                <Edit className="w-4 h-4"/>
                            </button>
                        </div>
                        <div className="mb-6">
                            <p className="text-3xl font-black text-slate-800 tracking-tight">{plan.price.Monthly}</p>
                            <p className="text-xs font-semibold text-slate-400 mt-1">per month</p>
                        </div>
                        <div className="space-y-3 flex-1">
                            {plan.features.slice(0, 4).map((f, i) => (
                                <div key={i} className="flex items-center text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2"></div>
                                    {f}
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                             <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                 <span className="block text-slate-400 mb-1">Users</span> 
                                 <b className="text-slate-700 text-lg">{plan.limits.maxUsers === -1 ? '∞' : plan.limits.maxUsers}</b>
                             </div>
                             <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                 <span className="block text-slate-400 mb-1">Storage</span> 
                                 <b className="text-slate-700 text-lg">{plan.limits.maxStorageGB}<span className="text-xs">GB</span></b>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderClinics = () => (
        <div className="space-y-8 animate-fade-in-up">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Clinic Registry</h2>
                    <p className="text-slate-500 mt-1">Manage tenant access and resources.</p>
                </div>
                <div className="flex space-x-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search clinics..." 
                            className="pl-11 pr-4 py-3 w-64 bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Onboard Clinic
                    </button>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-200/60">
                        <tr>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Name</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Resource Usage</th>
                            <th className="px-8 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredTenants.length > 0 ? filteredTenants.map(tenant => {
                            const plan = plans.find(p => p.id === tenant.plan);
                            const storageLimit = (plan?.limits.maxStorageGB || 0.5) * 1024;
                            
                            return (
                                <tr key={tenant.id} className="group hover:bg-indigo-50/30 transition-colors cursor-pointer" onClick={() => setSelectedClinic(tenant)}>
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-slate-800 text-sm">{tenant.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{tenant.id.split('-')[0]}...</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                            {tenant.plan}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                             tenant.status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                                             tenant.status === 'Restricted' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                                         }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                tenant.status === 'Active' ? 'bg-emerald-500' : 
                                                tenant.status === 'Restricted' ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}></div>
                                            {tenant.status}
                                         </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                                            <span>{tenant.storageUsed.toFixed(1)}MB</span>
                                            <span className="opacity-50">{storageLimit}MB</span>
                                        </div>
                                        <UsageBar used={tenant.storageUsed} limit={storageLimit} colorClass="bg-indigo-500" />
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors inline-block" />
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Building className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="font-medium">No clinics found matching your search.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Clinic Detail Modal */}
            {selectedClinic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedClinic(null)}></div>
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up relative border border-white/50">
                        
                        {/* Header */}
                        <div className="px-10 py-8 border-b border-slate-200/60 flex justify-between items-start bg-gradient-to-r from-slate-50/50 to-white/50">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedClinic.name}</h3>
                                <div className="flex items-center space-x-3 mt-2">
                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{selectedClinic.id}</span>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        Joined {selectedClinic.joinedDate ? new Date(selectedClinic.joinedDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedClinic(null)} className="p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                        </div>
                        
                        <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                            
                            {/* Resource Monitoring */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-slate-800 mb-6 flex items-center text-lg">
                                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl mr-3"><HardDrive className="w-5 h-5"/></div>
                                        Storage Allocation
                                    </h4>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-4xl font-black text-slate-800 tracking-tighter">{selectedClinic.storageUsed.toFixed(2)} <span className="text-lg text-slate-400 font-medium">MB</span></span>
                                        <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Limit: {(plans.find(p => p.id === selectedClinic.plan)?.limits.maxStorageGB || 0) * 1024} MB</span>
                                    </div>
                                    <UsageBar used={selectedClinic.storageUsed} limit={(plans.find(p => p.id === selectedClinic.plan)?.limits.maxStorageGB || 1) * 1024} colorClass="bg-indigo-600" />
                                </div>

                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-500 font-medium">Active Users</span>
                                        <span className="text-2xl font-bold text-slate-800">{selectedClinic.userCount || 0}</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-100 rounded-full mb-6"><div className="w-1/3 h-full bg-emerald-500 rounded-full"></div></div>
                                    
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-500 font-medium">Patients</span>
                                        <span className="text-2xl font-bold text-slate-800">{selectedClinic.patientCount || 0}</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-100 rounded-full"><div className="w-2/3 h-full bg-violet-500 rounded-full"></div></div>
                                </div>
                            </div>

                            {/* Subscription Management */}
                            <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl border border-indigo-100">
                                <div className="flex justify-between items-center mb-8">
                                    <h4 className="font-bold text-indigo-900 flex items-center text-lg">
                                        <ShieldCheck className="w-6 h-6 mr-3 text-indigo-600" /> Subscription Control
                                    </h4>
                                    <span className="bg-white border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                                        Current: {selectedClinic.plan} ({selectedClinic.billingPeriod})
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reassign Plan</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none"
                                                value={editSubForm.plan}
                                                onChange={(e) => setEditSubForm({...editSubForm, plan: e.target.value as SubscriptionTier})}
                                            >
                                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billing Cycle</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none"
                                                value={editSubForm.billingPeriod}
                                                onChange={(e) => setEditSubForm({...editSubForm, billingPeriod: e.target.value as BillingPeriod})}
                                            >
                                                <option value="Monthly">Monthly</option>
                                                <option value="Yearly">Yearly</option>
                                            </select>
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button 
                                        onClick={handleUpdateSubscription}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                                    >
                                        Update Subscription
                                    </button>
                                </div>
                            </div>
                            
                            {/* Danger Zone */}
                            <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                                <div className="flex items-center space-x-2">
                                    <span className={`w-3 h-3 rounded-full ${selectedClinic.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    <span className="font-bold text-slate-700">Account Status: {selectedClinic.status}</span>
                                </div>
                                <div className="space-x-4 flex">
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedClinic, selectedClinic.status === 'Restricted' ? 'Active' : 'Restricted')}
                                        className={`px-6 py-3 rounded-xl font-bold border transition-all ${selectedClinic.status === 'Restricted' ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-amber-200 text-amber-600 hover:bg-amber-50'}`}
                                    >
                                        {selectedClinic.status === 'Restricted' ? 'Unrestrict Access' : 'Restrict Access'}
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedClinic, selectedClinic.status === 'Suspended' ? 'Active' : 'Suspended')}
                                        className={`px-6 py-3 rounded-xl font-bold border flex items-center transition-all ${selectedClinic.status === 'Suspended' ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:shadow-lg hover:shadow-rose-100'}`}
                                    >
                                        <Lock className="w-4 h-4 mr-2" />
                                        {selectedClinic.status === 'Suspended' ? 'Reactivate Account' : 'Suspend Account'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 w-screen overflow-hidden font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Styles for animations */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
            `}</style>

            <div className="w-72 bg-slate-900 text-white flex flex-col shrink-0 relative overflow-hidden shadow-2xl z-20">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-10"></div>
                
                <div className="p-10 relative z-10">
                    <h1 className="font-black text-2xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Vet Nexus</h1>
                    <span className="text-[11px] text-indigo-200 uppercase tracking-[0.2em] font-bold mt-1 block">Super Admin</span>
                </div>
                
                <nav className="flex-1 px-6 space-y-2 relative z-10">
                    <button onClick={() => setActiveView('overview')} className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium ${activeView === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                        <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
                    </button>
                    <button onClick={() => setActiveView('clinics')} className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium ${activeView === 'clinics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                        <Building className="w-5 h-5 mr-3" /> Clinics
                    </button>
                    <button onClick={() => setActiveView('subscriptions')} className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium ${activeView === 'subscriptions' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                        <CreditCard className="w-5 h-5 mr-3" /> Plans & Revenue
                    </button>
                </nav>
                
                <div className="p-6 relative z-10">
                    <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-200 py-3.5 rounded-2xl text-sm font-bold border border-white/5 hover:border-rose-500/20 transition-all duration-300">
                        <LogOut className="w-4 h-4" /> <span>Sign Out</span>
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                 {/* Top subtle gradient */}
                 <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent pointer-events-none z-0 opacity-50"></div>
                 
                <div className="max-w-[1600px] mx-auto p-12 relative z-10">
                    {activeView === 'overview' && renderOverview()}
                    {activeView === 'clinics' && renderClinics()}
                    {activeView === 'subscriptions' && renderPlans()}
                </div>
            </main>

             {/* Create Modal */}
             {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-scale-up relative border border-white/50 overflow-hidden">
                        
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                            <div>
                                <h3 className="font-black text-2xl text-slate-800 tracking-tight">Onboard Clinic</h3>
                                <p className="text-sm text-slate-500">Provision a new tenant environment</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400"/></button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Clinic Name</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" 
                                    placeholder="e.g. Paws & Claws Vet"
                                    value={newClinicForm.clinicName} 
                                    onChange={e => setNewClinicForm({...newClinicForm, clinicName: e.target.value})} 
                                />
                            </div>
                             <div className="grid grid-cols-2 gap-5">
                                 <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Admin Name</label>
                                    <input type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none" value={newClinicForm.adminName} onChange={e => setNewClinicForm({...newClinicForm, adminName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Admin Email</label>
                                    <input type="email" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none" value={newClinicForm.email} onChange={e => setNewClinicForm({...newClinicForm, email: e.target.value})} />
                                </div>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Initial Password</label>
                                <input type="password" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none" value={newClinicForm.password} onChange={e => setNewClinicForm({...newClinicForm, password: e.target.value})} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Plan</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none"
                                            value={newClinicForm.plan} 
                                            onChange={e => setNewClinicForm({...newClinicForm, plan: e.target.value as SubscriptionTier})}
                                        >
                                           {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Billing</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none"
                                            value={newClinicForm.billingPeriod} 
                                            onChange={e => setNewClinicForm({...newClinicForm, billingPeriod: e.target.value as BillingPeriod})}
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Yearly">Yearly</option>
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90"/>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleCreateSubmit} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 mt-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-slate-900/20">
                                Provision Tenant
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Plan Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedPlan(null)}></div>
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-scale-up relative border border-white/50">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                            <h3 className="font-black text-2xl text-slate-900">Edit {selectedPlan.name} Plan</h3>
                            <button onClick={() => setSelectedPlan(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400"/></button>
                        </div>
                        <form onSubmit={handleSavePlan} className="p-8 space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Monthly Price</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none" 
                                        value={selectedPlan.price.Monthly} 
                                        onChange={e => setSelectedPlan({...selectedPlan, price: {...selectedPlan.price, Monthly: e.target.value}})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Yearly Price</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none" 
                                        value={selectedPlan.price.Yearly} 
                                        onChange={e => setSelectedPlan({...selectedPlan, price: {...selectedPlan.price, Yearly: e.target.value}})} 
                                    />
                                </div>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Max Users limit (-1 for ∞)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none" 
                                    value={selectedPlan.limits.maxUsers} 
                                    onChange={e => setSelectedPlan({...selectedPlan, limits: {...selectedPlan.limits, maxUsers: parseInt(e.target.value)}})} 
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Max Storage (GB)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none" 
                                    value={selectedPlan.limits.maxStorageGB} 
                                    onChange={e => setSelectedPlan({...selectedPlan, limits: {...selectedPlan.limits, maxStorageGB: parseFloat(e.target.value)}})} 
                                />
                             </div>
                             <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 mt-4 transition-all hover:scale-[1.02] shadow-lg shadow-indigo-200">
                                Save Changes
                             </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
