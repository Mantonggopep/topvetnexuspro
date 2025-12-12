import React, { useMemo } from 'react';
import { AppState, AppointmentStatus, ViewType } from '../types';
import { 
  Calendar, Users, Stethoscope, ShoppingCart, 
  Package, FlaskConical, Settings, 
  TrendingUp, AlertTriangle, Clock,
  DollarSign, Activity, Search, Wallet, FileClock, 
  ArrowUpRight, ArrowDownRight, ChevronRight, Sparkles
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { getAvatarGradient, formatCurrency } from '../utils/uiUtils';

interface DashboardProps {
  state: AppState;
  onNavigate: (view: ViewType) => void;
  onSelectPatient: (id: string) => void;
}

// --- 1. Helper Components ---

// Compact App Icon
const AppIcon: React.FC<{ icon: React.FC<any>; gradient: string; size?: 'sm' | 'md' | 'lg' }> = ({ icon: Icon, gradient, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5 rounded-xl',
    md: 'w-10 h-10 p-2 rounded-2xl', // Reduced from w-14
    lg: 'w-12 h-12 p-2.5 rounded-2xl'
  };
  
  return (
    <div className={`${sizeClasses[size]} ${gradient} shadow-lg shadow-black/5 ring-2 ring-white/40 flex items-center justify-center text-white transform transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl`}>
      <Icon className="w-full h-full stroke-[2px] drop-shadow-md" />
    </div>
  );
};

// Compact Stat Widget
const HDStatWidget: React.FC<{ 
    label: string; 
    value: string; 
    trendPercent?: number; 
    isNegative?: boolean;
    icon: React.FC<any>;
    colorTheme: 'emerald' | 'blue' | 'purple' | 'teal' | 'gold';
}> = ({ label, value, trendPercent, isNegative, icon: Icon, colorTheme }) => {
    
    const colors = {
        emerald: { bg: 'bg-emerald-50/90', border: 'border-emerald-200', icon: 'bg-emerald-500', text: 'text-emerald-900', hover: 'hover:bg-emerald-100' },
        blue:    { bg: 'bg-blue-50/90', border: 'border-blue-200', icon: 'bg-blue-500', text: 'text-blue-900', hover: 'hover:bg-blue-100' },
        purple:  { bg: 'bg-violet-50/90', border: 'border-violet-200', icon: 'bg-violet-500', text: 'text-violet-900', hover: 'hover:bg-violet-100' },
        teal:    { bg: 'bg-teal-50/90', border: 'border-teal-200', icon: 'bg-teal-500', text: 'text-teal-900', hover: 'hover:bg-teal-100' },
        gold:    { bg: 'bg-amber-50/90', border: 'border-amber-200', icon: 'bg-amber-500', text: 'text-amber-900', hover: 'hover:bg-amber-100' },
    }[colorTheme];

    const isTrendPositive = (trendPercent || 0) >= 0;
    const finalIsNegative = isNegative !== undefined ? isNegative : !isTrendPositive;

    return (
        // Reduced padding (p-4), border radius (rounded-2xl)
        <div className={`flex flex-col justify-between p-4 rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${colors.hover} group cursor-default`}>
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-xl ${colors.icon} text-white shadow-md ring-2 ring-white/60 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4 stroke-[2.5px]" />
                </div>
                {trendPercent !== undefined && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border bg-white/90 shadow-sm ${finalIsNegative ? 'text-rose-600 border-rose-100' : 'text-emerald-600 border-emerald-100'}`}>
                        {finalIsNegative ? <ArrowDownRight className="w-3 h-3"/> : <ArrowUpRight className="w-3 h-3"/>}
                        {Math.abs(trendPercent).toFixed(1)}%
                    </span>
                )}
            </div>
            <div>
                {/* Reduced font size */}
                <h4 className={`text-2xl font-black ${colors.text} tracking-tight`}>{value}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 opacity-80">{label}</p>
            </div>
        </div>
    );
};

// Compact Navigation Module
const ModuleAppCard: React.FC<{
    title: string;
    desc: string;
    icon: React.FC<any>;
    colorTheme: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'slate' | 'rose' | 'indigo' | 'orange' | 'teal';
    onClick: () => void;
    count?: number;
}> = ({ title, desc, icon: Icon, colorTheme, onClick, count }) => {
    
    const theme = {
        blue:    { bg: 'bg-blue-50/50', hover: 'hover:bg-blue-100', border: 'border-blue-200 hover:border-blue-300', grad: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
        emerald: { bg: 'bg-emerald-50/50', hover: 'hover:bg-emerald-100', border: 'border-emerald-200 hover:border-emerald-300', grad: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
        amber:   { bg: 'bg-amber-50/50', hover: 'hover:bg-amber-100', border: 'border-amber-200 hover:border-amber-300', grad: 'bg-gradient-to-br from-amber-400 to-orange-500' },
        purple:  { bg: 'bg-purple-50/50', hover: 'hover:bg-purple-100', border: 'border-purple-200 hover:border-purple-300', grad: 'bg-gradient-to-br from-purple-500 to-fuchsia-600' },
        cyan:    { bg: 'bg-cyan-50/50', hover: 'hover:bg-cyan-100', border: 'border-cyan-200 hover:border-cyan-300', grad: 'bg-gradient-to-br from-cyan-400 to-blue-500' },
        slate:   { bg: 'bg-slate-50/50', hover: 'hover:bg-slate-100', border: 'border-slate-200 hover:border-slate-300', grad: 'bg-gradient-to-br from-slate-600 to-slate-800' },
        rose:    { bg: 'bg-rose-50/50', hover: 'hover:bg-rose-100', border: 'border-rose-200 hover:border-rose-300', grad: 'bg-gradient-to-br from-rose-400 to-pink-600' },
        indigo:  { bg: 'bg-indigo-50/50', hover: 'hover:bg-indigo-100', border: 'border-indigo-200 hover:border-indigo-300', grad: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
        orange:  { bg: 'bg-orange-50/50', hover: 'hover:bg-orange-100', border: 'border-orange-200 hover:border-orange-300', grad: 'bg-gradient-to-br from-orange-500 to-red-500' },
        teal:    { bg: 'bg-teal-50/50', hover: 'hover:bg-teal-100', border: 'border-teal-200 hover:border-teal-300', grad: 'bg-gradient-to-br from-teal-500 to-emerald-600' },
    }[colorTheme];

    return (
        <button 
            onClick={onClick}
            // Reduced padding (p-3), rounded corners, and min-height
            className={`
                group relative flex flex-col items-center text-center p-3 rounded-2xl
                ${theme.bg} backdrop-blur-xl border ${theme.border}
                shadow-sm hover:shadow-lg hover:shadow-${colorTheme}-500/20 
                hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]
                transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                min-h-[120px] justify-center
            `}
        >
            {count !== undefined && count > 0 && (
                <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg shadow-rose-500/30 z-20 animate-pulse border-2 border-white">
                    {count}
                </div>
            )}
            
            <div className="mb-2">
                <AppIcon icon={Icon} gradient={theme.grad} size="md" />
            </div>
            
            <h3 className="text-sm font-black text-slate-800 group-hover:text-black leading-tight tracking-tight">{title}</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-1 leading-tight opacity-70 uppercase tracking-wide group-hover:opacity-100 transition-opacity">{desc}</p>
        </button>
    );
};

// --- 2. Main Dashboard Component ---

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, onSelectPatient }) => {
  const currentTenant = state.tenants.find(t => t.id === state.currentTenantId);
  const currency = currentTenant?.settings.currency || 'USD';
  
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const todayAppointments = useMemo(() => state.appointments.filter(a => 
    a.status !== AppointmentStatus.Cancelled && 
    new Date(a.date).toDateString() === today
  ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [state.appointments, today]);

  const { todayRevenue, revenuePercentChange } = useMemo(() => {
      const tRev = state.sales.filter(s => s.status === 'Paid' && new Date(s.date).toDateString() === today).reduce((sum, s) => sum + s.total, 0);
      const yRev = state.sales.filter(s => s.status === 'Paid' && new Date(s.date).toDateString() === yesterdayStr).reduce((sum, s) => sum + s.total, 0);
      let percent = 0;
      if (yRev > 0) percent = ((tRev - yRev) / yRev) * 100;
      else if (tRev > 0) percent = 100;
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
      const name = isVet ? `Dr. ${firstName}` : firstName;
      return { greetingTime: time, displayName: name };
  }, [state.currentUser]);

  return (
    // Reduced outer padding
    <div className="h-full overflow-y-auto custom-scrollbar bg-cyan-50/40 p-3 lg:p-4">
      
      {/* Reduced container max width slightly and border radii */}
      <div className="max-w-[1800px] mx-auto bg-white/40 backdrop-blur-2xl rounded-3xl p-4 lg:p-6 border-4 border-white shadow-xl shadow-cyan-900/5">
        
        {/* Reduced Gap from gap-8 to gap-5 */}
        <div className="flex flex-col xl:flex-row gap-5">
            
            {/* --- LEFT COLUMN --- */}
            <div className="xl:w-[260px] shrink-0 flex flex-col gap-4 animate-slide-up">
                
                {/* 1. Identity Card (Scaled Down) */}
                <div className="bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-4 rounded-2xl border border-white/60 shadow-md hover:shadow-lg transition-all duration-500">
                    <div className="flex flex-col items-center text-center gap-3">
                        {/* Avatar Size Reduced */}
                        <div className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center text-white text-2xl font-black ring-4 ring-white ${getAvatarGradient(state.currentUser?.name || '')}`}>
                            {state.currentUser?.avatarUrl ? (
                                <img src={state.currentUser.avatarUrl} className="w-full h-full object-cover rounded-2xl" alt="Profile" />
                            ) : (
                                state.currentUser?.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 leading-tight tracking-tight">{state.currentUser?.name.split(' ')[0]}</h2>
                            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mt-1">{currentTenant?.name}</p>
                            
                            <div className="mt-3 flex justify-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Online</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Today's Agenda (Scaled Down) */}
                <div className="flex-1 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 p-4 rounded-2xl border border-white/60 shadow-md flex flex-col relative overflow-hidden min-h-[350px]">
                    <div className="flex justify-between items-end mb-6 z-10 relative">
                        <div>
                            {/* Font size reduced */}
                            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{new Date().getDate()}</h3>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{new Date().toLocaleString('default', { month: 'long', weekday: 'long' })}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="absolute left-[2.75rem] top-28 bottom-0 w-[1px] bg-indigo-100 z-0 dashed"></div>

                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 z-10">
                        {todayAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 opacity-50">
                                <Clock className="w-8 h-8 text-indigo-300 mb-2"/>
                                <p className="text-xs font-bold text-indigo-400">No appointments</p>
                            </div>
                        ) : (
                            todayAppointments.map((apt, idx) => {
                                const pet = state.pets.find(p => p.id === apt.petId);
                                const time = new Date(apt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                const isNext = idx === 0;

                                return (
                                    <div 
                                        key={apt.id} 
                                        onClick={() => apt.petId && onSelectPatient(apt.petId)}
                                        className={`relative flex items-center group cursor-pointer ${isNext ? 'scale-[1.01] origin-left' : ''} transition-all`}
                                    >
                                        <div className={`w-14 text-[10px] font-bold text-right mr-5 shrink-0 tabular-nums ${isNext ? 'text-indigo-600' : 'text-slate-400'}`}>{time}</div>
                                        
                                        <div className={`absolute left-[2.45rem] w-2.5 h-2.5 rounded-full border-[2px] z-20 transition-all ${isNext ? 'bg-indigo-500 border-indigo-200 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]' : 'bg-white border-slate-300'}`}></div>
                                        
                                        <div className={`flex-1 p-2.5 rounded-xl border transition-all shadow-sm group-hover:shadow-md relative overflow-hidden ${isNext ? 'bg-white border-indigo-100 ring-1 ring-indigo-50' : 'bg-white/60 border-transparent hover:bg-white'}`}>
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getAvatarGradient(pet?.name || 'A')}`}></div>
                                            <div className="flex items-center gap-2 pl-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-sm ${getAvatarGradient(pet?.name || 'P')}`}>
                                                    {pet?.name?.[0]}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-slate-800 truncate">{pet?.name || apt.walkInName || 'Guest'}</p>
                                                    <p className="text-[9px] text-slate-500 truncate font-medium">{apt.reason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* --- CENTER COLUMN --- */}
            <div className="flex-1 flex flex-col gap-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
                
                {/* 1. Hero / Action Center (Scaled Down) */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-50 via-white to-rose-50 p-6 shadow-xl shadow-teal-900/5 ring-1 ring-white border border-teal-50/50 group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{greetingTime}</span>
                            </div>
                            <h1 className="text-3xl font-black mb-2 tracking-tight text-slate-800">{displayName}</h1>
                            <p className="text-slate-600 font-medium text-sm md:max-w-lg leading-relaxed">
                                You have <span className="font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{todayAppointments.length} appointments</span> scheduled. 
                                {pendingLabs > 0 && <span> <span className="font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">{pendingLabs} lab results</span> pending.</span>}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onNavigate('logs')}
                                className="flex items-center gap-2 bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-lg shadow-slate-800/20 hover:shadow-xl hover:scale-105 active:scale-95 transition-all group-hover:bg-black"
                            >
                                <FileClock className="w-3.5 h-3.5 stroke-white" />
                                <span>Clinic Logs</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Decorative Blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-300 opacity-10 rounded-full blur-[60px] translate-x-20 -translate-y-10 group-hover:opacity-20 transition-opacity duration-700"></div>
                    <div className="absolute bottom-0 right-32 w-48 h-48 bg-rose-300 opacity-10 rounded-full blur-[50px] translate-y-20 group-hover:opacity-20 transition-opacity duration-700"></div>
                </div>

                {/* 2. Application Grid (NAV BAR) - VISIBLE ON MOBILE, HIDDEN ON PC (lg:hidden) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:hidden">
                    <ModuleAppCard 
                        title="Patients" 
                        desc="Records" 
                        icon={Users} 
                        colorTheme="blue"
                        onClick={() => onNavigate('patients')} 
                        count={state.pets.length}
                    />
                    <ModuleAppCard 
                        title="Consults" 
                        desc="Medical" 
                        icon={Stethoscope} 
                        colorTheme="emerald"
                        onClick={() => onNavigate('treatments')} 
                    />
                    <ModuleAppCard 
                        title="Schedule" 
                        desc="Booking" 
                        icon={Calendar} 
                        colorTheme="indigo"
                        onClick={() => onNavigate('appointments')} 
                    />
                    <ModuleAppCard 
                        title="Clients" 
                        desc="Owners" 
                        icon={Search} 
                        colorTheme="rose"
                        onClick={() => onNavigate('clients')} 
                    />
                    <ModuleAppCard 
                        title="POS" 
                        desc="Checkout" 
                        icon={ShoppingCart} 
                        colorTheme="purple"
                        onClick={() => onNavigate('pos')} 
                    />
                    <ModuleAppCard 
                        title="Inventory" 
                        desc="Stock" 
                        icon={Package} 
                        colorTheme="amber"
                        onClick={() => onNavigate('inventory')} 
                    />
                    <ModuleAppCard 
                        title="Labs" 
                        desc="Diagnostic" 
                        icon={FlaskConical} 
                        colorTheme="cyan"
                        onClick={() => onNavigate('lab')}
                        count={pendingLabs}
                    />
                    <ModuleAppCard 
                        title="Expenses" 
                        desc="Finance" 
                        icon={Wallet} 
                        colorTheme="orange"
                        onClick={() => onNavigate('expenses')} 
                    />
                    <ModuleAppCard 
                        title="Reports" 
                        desc="Analytics" 
                        icon={TrendingUp} 
                        colorTheme="teal"
                        onClick={() => onNavigate('reports')} 
                    />
                    <ModuleAppCard 
                        title="Settings" 
                        desc="Config" 
                        icon={Settings} 
                        colorTheme="slate"
                        onClick={() => onNavigate('settings')} 
                    />
                </div>
            </div>

            {/* --- RIGHT COLUMN --- */}
            <div className="xl:w-[260px] shrink-0 flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                
                {/* 1. Stat Widgets (Scaled Down) */}
                <div className="flex flex-col gap-4">
                    <HDStatWidget 
                        label="Revenue (Today)" 
                        value={formatCurrency(todayRevenue, currency)} 
                        icon={DollarSign} 
                        colorTheme="teal"
                        trendPercent={revenuePercentChange}
                    />
                    <HDStatWidget 
                        label="Active Patients" 
                        value={state.pets.length.toString()} 
                        icon={Users} 
                        colorTheme="gold"
                    />
                </div>

                {/* 2. Visual Chart Card (Scaled Down) */}
                <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-md shadow-teal-900/5 flex flex-col min-h-[200px] relative overflow-hidden group hover:border-teal-100 transition-colors">
                    <div className="flex items-center justify-between mb-2 z-10">
                        <h3 className="text-sm font-black text-slate-700 tracking-tight">Financial Flow</h3>
                        <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                            <Activity className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    
                    <div className="flex-1 -ml-4 absolute bottom-0 left-0 right-0 top-12 z-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorGraph" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: '#0f766e', fontWeight: 'bold', fontSize: '11px' }}
                                    formatter={(val: number) => [formatCurrency(val, currency), '']}
                                    labelStyle={{ display: 'none' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="v" 
                                    stroke="#0d9488" 
                                    strokeWidth={3} 
                                    fill="url(#colorGraph)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Alerts (Scaled Down) */}
                {lowStockCount > 0 && (
                    <button 
                        onClick={() => onNavigate('inventory')}
                        className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 hover:bg-rose-100 hover:border-rose-200 transition-all text-left group shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all">
                            <AlertTriangle className="w-5 h-5 stroke-[2px]" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-rose-700 uppercase tracking-widest">Attention</p>
                            <p className="text-xs font-bold text-rose-900/80 leading-tight mt-0.5">{lowStockCount} items low</p>
                        </div>
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
