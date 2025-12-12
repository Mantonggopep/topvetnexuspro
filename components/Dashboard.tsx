import React, { useMemo } from 'react';
import { AppState, AppointmentStatus, ViewType } from '../types';
import { 
  Calendar, Users, Stethoscope, ShoppingCart, 
  Package, FlaskConical, Settings, 
  TrendingUp, AlertTriangle, Clock,
  DollarSign, Activity, Search, Wallet, FileClock, 
  ArrowUpRight, ArrowDownRight, ChevronRight, Sparkles
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getAvatarGradient, formatCurrency } from '../utils/uiUtils';

interface DashboardProps {
  state: AppState;
  onNavigate: (view: ViewType) => void;
  onSelectPatient: (id: string) => void;
}

// 1. HD Compact App Icon
const AppIcon: React.FC<{ icon: React.FC<any>; gradient: string; }> = ({ icon: Icon, gradient }) => {
  return (
    <div className={`w-11 h-11 p-2.5 rounded-[14px] ${gradient} shadow-lg shadow-black/5 ring-1 ring-white/50 flex items-center justify-center text-white`}>
      <Icon className="w-full h-full stroke-[2.5px]" />
    </div>
  );
};

// 2. HD Stat Widget (Slim Bezel)
const HDStatWidget: React.FC<{ 
    label: string; 
    value: string; 
    trendPercent?: number; 
    icon: React.FC<any>;
    colorTheme: 'teal' | 'gold';
}> = ({ label, value, trendPercent, icon: Icon, colorTheme }) => {
    
    const colors = {
        teal:    { bg: 'bg-teal-50/50', border: 'border-teal-100', icon: 'bg-teal-500', text: 'text-teal-900' },
        gold:    { bg: 'bg-amber-50/50', border: 'border-amber-100', icon: 'bg-amber-500', text: 'text-amber-900' },
    }[colorTheme];

    return (
        <div className={`flex flex-col justify-between p-4 rounded-3xl border ${colors.border} ${colors.bg} backdrop-blur-md shadow-sm min-h-[110px]`}>
            <div className="flex justify-between items-start mb-1">
                <div className={`p-2 rounded-xl ${colors.icon} text-white shadow-md`}>
                    <Icon className="w-4 h-4 stroke-[3px]" />
                </div>
                {trendPercent !== undefined && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/80 text-emerald-600 border-emerald-100">
                        <ArrowUpRight className="w-3 h-3"/> {Math.abs(trendPercent).toFixed(1)}%
                    </span>
                )}
            </div>
            <div>
                <h4 className={`text-xl md:text-2xl font-black ${colors.text} tracking-tight truncate`}>{value}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider opacity-80">{label}</p>
            </div>
        </div>
    );
};

// 3. Module Card (iOS Icon Style)
const ModuleAppCard: React.FC<{
    title: string;
    desc: string;
    icon: React.FC<any>;
    colorTheme: string;
    onClick: () => void;
    count?: number;
}> = ({ title, desc, icon, colorTheme, onClick, count }) => {
    // Map theme to gradients
    const gradients: Record<string, string> = {
        blue: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        indigo: 'bg-gradient-to-br from-indigo-500 to-purple-600',
        rose: 'bg-gradient-to-br from-rose-400 to-pink-600',
        purple: 'bg-gradient-to-br from-purple-500 to-fuchsia-600',
        amber: 'bg-gradient-to-br from-amber-400 to-orange-500',
        cyan: 'bg-gradient-to-br from-cyan-400 to-blue-500',
        orange: 'bg-gradient-to-br from-orange-500 to-red-500',
        teal: 'bg-gradient-to-br from-teal-500 to-emerald-600',
        slate: 'bg-gradient-to-br from-slate-600 to-slate-800',
    };

    return (
        <button 
            onClick={onClick}
            className="group relative flex flex-col items-center text-center p-3 rounded-[24px] bg-white/60 backdrop-blur-xl border border-white/60 shadow-ios-sm hover:shadow-ios-md active:scale-95 transition-all duration-300 w-full min-h-[120px] justify-center"
        >
            {count !== undefined && count > 0 && (
                <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg shadow-rose-500/30 z-20 ring-1 ring-white">
                    {count}
                </div>
            )}
            <div className="mb-2.5 transform group-hover:scale-105 transition-transform duration-300">
                <AppIcon icon={icon} gradient={gradients[colorTheme] || gradients['blue']} />
            </div>
            <h3 className="text-sm font-black text-slate-800 leading-tight">{title}</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5 opacity-70 uppercase tracking-wide">{desc}</p>
        </button>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, onSelectPatient }) => {
  const currentTenant = state.tenants.find(t => t.id === state.currentTenantId);
  const currency = currentTenant?.settings.currency || 'USD';
  
  // Logic preserved exactly
  const today = new Date().toDateString();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const todayAppointments = useMemo(() => state.appointments.filter(a => 
    a.status !== AppointmentStatus.Cancelled && 
    new Date(a.date).toDateString() === today
  ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [state.appointments, today]);

  const { todayRevenue, revenuePercentChange } = useMemo(() => {
      const tRev = state.sales.filter(s => s.status === 'Paid' && new Date(s.date).toDateString() === today).reduce((sum, s) => sum + s.total, 0);
      const yRev = state.sales.filter(s => s.status === 'Paid' && new Date(s.date).toDateString() === yesterdayStr).reduce((sum, s) => sum + s.total, 0);
      let percent = 0;
      if (yRev > 0) percent = ((tRev - yRev) / yRev) * 100; else if (tRev > 0) percent = 100;
      return { todayRevenue: tRev, revenuePercentChange: percent };
  }, [state.sales, today, yesterdayStr]);

  const lowStockCount = useMemo(() => state.inventory.filter(i => i.type === 'Product' && i.stock <= i.reorderLevel).length, [state.inventory]);
  const pendingLabs = useMemo(() => state.labResults.filter(l => l.status !== 'Completed').length, [state.labResults]);

  const chartData = useMemo(() => [
      { v: todayRevenue * 0.2 }, { v: todayRevenue * 0.45 }, { v: todayRevenue * 0.3 }, 
      { v: todayRevenue * 0.7 }, { v: todayRevenue * 0.55 }, { v: todayRevenue }
  ], [todayRevenue]);

  const { greetingTime, displayName } = useMemo(() => {
      const h = new Date().getHours();
      const time = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
      const firstName = state.currentUser?.name.split(' ')[0] || 'User';
      const isVet = state.currentUser?.roles.includes('Veterinarian') || state.currentUser?.roles.includes('Doctor');
      return { greetingTime: time, displayName: isVet ? `Dr. ${firstName}` : firstName };
  }, [state.currentUser]);

  return (
    <div className="w-full pb-8 animate-fade-in">
        <div className="flex flex-col xl:flex-row gap-3 md:gap-4">
            
            {/* LEFT COLUMN: Identity & Agenda */}
            <div className="w-full xl:w-[280px] shrink-0 flex flex-col gap-3 md:gap-4">
                
                {/* Identity Card */}
                <div className="glass-card p-4 rounded-3xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center text-white text-xl font-black ring-2 ring-white shrink-0 ${getAvatarGradient(state.currentUser?.name || '')}`}>
                        {state.currentUser?.avatarUrl ? <img src={state.currentUser.avatarUrl} className="w-full h-full object-cover rounded-2xl" /> : state.currentUser?.name.charAt(0)}
                    </div>
                    <div className="min-w-0 z-10">
                        <h2 className="text-lg font-black text-slate-800 leading-tight truncate">{displayName}</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">{currentTenant?.name}</p>
                    </div>
                </div>

                {/* Today's Agenda */}
                <div className="flex-1 glass-card p-5 rounded-3xl flex flex-col relative overflow-hidden h-[300px] md:min-h-[380px]">
                    <div className="flex justify-between items-end mb-4 z-10">
                        <div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{new Date().getDate()}</h3>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">{new Date().toLocaleString('default', { month: 'long', weekday: 'long' })}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                    {/* Dashed Timeline Line */}
                    <div className="absolute left-[2.25rem] top-24 bottom-0 w-[1px] bg-indigo-100 z-0 dashed"></div>

                    <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3 z-10">
                        {todayAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-50 pb-10">
                                <Clock className="w-8 h-8 text-indigo-300 mb-2"/>
                                <p className="text-xs font-bold text-indigo-400">No appointments</p>
                            </div>
                        ) : (
                            todayAppointments.map((apt, idx) => {
                                const pet = state.pets.find(p => p.id === apt.petId);
                                const time = new Date(apt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                const isNext = idx === 0;
                                return (
                                    <div key={apt.id} onClick={() => apt.petId && onSelectPatient(apt.petId)} className={`relative flex items-center group cursor-pointer ${isNext ? 'scale-[1.01] origin-left' : ''} transition-all`}>
                                        <div className={`w-14 text-[10px] font-bold text-right mr-4 shrink-0 tabular-nums ${isNext ? 'text-indigo-600' : 'text-slate-400'}`}>{time}</div>
                                        <div className={`absolute left-[2rem] w-2.5 h-2.5 rounded-full border-[2px] z-20 ${isNext ? 'bg-indigo-500 border-indigo-200' : 'bg-white border-slate-300'}`}></div>
                                        <div className={`flex-1 p-3 rounded-2xl border transition-all ${isNext ? 'bg-white border-indigo-100 shadow-sm' : 'bg-white/40 border-transparent'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] text-white font-bold ${getAvatarGradient(pet?.name || 'P')}`}>{pet?.name?.[0]}</div>
                                                <div className="min-w-0"><p className="text-xs font-bold text-slate-800 truncate">{pet?.name || apt.walkInName || 'Guest'}</p><p className="text-[10px] text-slate-500 truncate">{apt.reason}</p></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* CENTER COLUMN: Hero & Grid */}
            <div className="flex-1 flex flex-col gap-3 md:gap-4">
                
                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-6 shadow-lg text-white">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" /><span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{greetingTime}</span></div>
                            <h1 className="text-3xl font-black mb-2 tracking-tight">Overview</h1>
                            <p className="font-medium text-sm md:max-w-md leading-relaxed text-white/90">
                                You have <span className="font-bold bg-white/20 px-1.5 rounded">{todayAppointments.length} appointments</span> today. 
                                {pendingLabs > 0 && <span> <span className="font-bold bg-rose-500/80 px-1.5 rounded">{pendingLabs} labs</span> need review.</span>}
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => onNavigate('logs')} className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-3 rounded-xl text-xs font-bold active:scale-95 transition-all">
                                <FileClock className="w-3.5 h-3.5" /><span>Logs</span><ChevronRight className="w-3.5 h-3.5 opacity-50" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Application Grid - Auto responsive */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <ModuleAppCard title="Patients" desc="Records" icon={Users} colorTheme="blue" onClick={() => onNavigate('patients')} count={state.pets.length} />
                    <ModuleAppCard title="Consults" desc="Medical" icon={Stethoscope} colorTheme="emerald" onClick={() => onNavigate('treatments')} />
                    <ModuleAppCard title="Schedule" desc="Booking" icon={Calendar} colorTheme="indigo" onClick={() => onNavigate('appointments')} />
                    <ModuleAppCard title="Clients" desc="Owners" icon={Search} colorTheme="rose" onClick={() => onNavigate('clients')} />
                    <ModuleAppCard title="POS" desc="Checkout" icon={ShoppingCart} colorTheme="purple" onClick={() => onNavigate('pos')} />
                    <ModuleAppCard title="Inventory" desc="Stock" icon={Package} colorTheme="amber" onClick={() => onNavigate('inventory')} />
                    <ModuleAppCard title="Labs" desc="Diagnostic" icon={FlaskConical} colorTheme="cyan" onClick={() => onNavigate('lab')} count={pendingLabs} />
                    <ModuleAppCard title="Expenses" desc="Finance" icon={Wallet} colorTheme="orange" onClick={() => onNavigate('expenses')} />
                    <ModuleAppCard title="Reports" desc="Analytics" icon={TrendingUp} colorTheme="teal" onClick={() => onNavigate('reports')} />
                    <ModuleAppCard title="Settings" desc="Config" icon={Settings} colorTheme="slate" onClick={() => onNavigate('settings')} />
                </div>
            </div>

            {/* RIGHT COLUMN: Stats */}
            <div className="w-full xl:w-[250px] shrink-0 flex flex-col gap-3 md:gap-4">
                <div className="grid grid-cols-2 xl:flex xl:flex-col gap-3">
                    <HDStatWidget label="Revenue (Today)" value={formatCurrency(todayRevenue, currency)} icon={DollarSign} colorTheme="teal" trendPercent={revenuePercentChange} />
                    <HDStatWidget label="Active Patients" value={state.pets.length.toString()} icon={Users} colorTheme="gold" />
                </div>

                <div className="flex-1 glass-card p-4 rounded-3xl flex flex-col min-h-[180px] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2 z-10"><h3 className="text-sm font-black text-slate-700">Flow</h3><Activity className="w-3.5 h-3.5 text-teal-600" /></div>
                    <div className="flex-1 -ml-5 absolute bottom-0 left-0 right-0 top-12 z-0 opacity-80">
                        <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorGraph" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/><stop offset="95%" stopColor="#0d9488" stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="v" stroke="#0d9488" strokeWidth={3} fill="url(#colorGraph)" /></AreaChart></ResponsiveContainer>
                    </div>
                </div>

                {lowStockCount > 0 && (
                    <button onClick={() => onNavigate('inventory')} className="p-4 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-3 active:scale-95 transition-transform text-left">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30"><AlertTriangle className="w-5 h-5" /></div>
                        <div className="min-w-0"><p className="text-[9px] font-black text-rose-700 uppercase tracking-widest">Alert</p><p className="text-xs font-bold text-rose-900/80 leading-tight mt-0.5 truncate">{lowStockCount} items low</p></div>
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;