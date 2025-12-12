import React, { useMemo } from 'react';
import { AppState, AppointmentStatus, ViewType } from '../types';
import { 
  Calendar, Users, Stethoscope, ShoppingCart, 
  Package, FlaskConical, FileText, Settings, 
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

// Ultra-Pop App Icon
const AppIcon: React.FC<{ icon: React.FC<any>; gradient: string; size?: 'sm' | 'md' | 'lg' }> = ({ icon: Icon, gradient, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10 p-2 rounded-2xl',
    md: 'w-14 h-14 p-3.5 rounded-3xl', // Larger icon container
    lg: 'w-16 h-16 p-4 rounded-[1.8rem]'
  };
  
  return (
    <div className={`${sizeClasses[size]} ${gradient} shadow-lg shadow-black/5 ring-4 ring-white/40 flex items-center justify-center text-white transform transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl`}>
      <Icon className="w-full h-full stroke-[2.5px] drop-shadow-md" />
    </div>
  );
};

// High-Fidelity Stat Widget
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
        <div className={`flex flex-col justify-between p-6 rounded-[2rem] border-2 ${colors.border} ${colors.bg} backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${colors.hover} group cursor-default`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-2xl ${colors.icon} text-white shadow-md ring-4 ring-white/60 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 stroke-[3px]" />
                </div>
                {trendPercent !== undefined && (
                    <span className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full border bg-white/90 shadow-sm ${finalIsNegative ? 'text-rose-600 border-rose-100' : 'text-emerald-600 border-emerald-100'}`}>
                        {finalIsNegative ? <ArrowDownRight className="w-3.5 h-3.5"/> : <ArrowUpRight className="w-3.5 h-3.5"/>}
                        {Math.abs(trendPercent).toFixed(1)}%
                    </span>
                )}
            </div>
            <div>
                <h4 className={`text-3xl font-black ${colors.text} tracking-tight`}>{value}</h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1.5 opacity-80">{label}</p>
            </div>
        </div>
    );
};

// Larger, More Colorful Navigation Module
const ModuleAppCard: React.FC<{
    title: string;
    desc: string;
    icon: React.FC<any>;
    colorTheme: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'slate' | 'rose' | 'indigo' | 'orange' | 'teal';
    onClick: () => void;
    count?: number;
}> = ({ title, desc, icon: Icon, colorTheme, onClick, count }) => {
    
    // Gradients updated to be more vibrant and shift on hover
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
            className={`
                group relative flex flex-col items-center text-center p-5 rounded-[2.5rem] 
                ${theme.bg} backdrop-blur-xl border-2 ${theme.border}
                shadow-sm hover:shadow-2xl hover:shadow-${colorTheme}-500/20 
                hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98]
                transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                min-h-[170px] justify-center
            `}
        >
            {/* Notification Badge */}
            {count !== undefined && count > 0 && (
                <div className="absolute top-4 right-4 bg-rose-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-rose-500/30 z-20 animate-pulse border-2 border-white ring-1 ring-rose-200">
                    {count}
                </div>
            )}
            
            <div className="mb-4">
                <AppIcon icon={Icon} gradient={theme.grad} size="md" />
            </div>
            
            <h3 className="text-base font-black text-slate-800 group-hover:text-black leading-tight tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-500 font-bold mt-1.5 leading-tight opacity-70 uppercase tracking-wide group-hover:opacity-100 transition-opacity">{desc}</p>
        </button>
    );
};

// --- 2. Main Dashboard Component ---

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, onSelectPatient }) => {
  const currentTenant = state.tenants.find(t => t.id === state.currentTenantId);
  const currency = currentTenant?.settings.currency || 'USD';
  
  // --- Data Logic ---
  
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  // Appointments Logic
  const todayAppointments = useMemo(() => state.appointments.filter(a => 
    a.status !== AppointmentStatus.Cancelled && 
    new Date(a.date).toDateString() === today
  ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [state.appointments, today]);

  // Revenue Logic
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

  // --- Greeting Logic ---
  const { greetingTime, displayName } = useMemo(() => {
      const h = new Date().getHours();
      const time = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
      
      const firstName = state.currentUser?.name.split(' ')[0] || 'User';
      // Check if role includes 'Veterinarian' to append 'Dr.'
      const isVet = state.currentUser?.roles.includes('Veterinarian') || state.currentUser?.roles.includes('Doctor');
      const name = isVet ? `Dr. ${firstName}` : firstName;

      return { greetingTime: time, displayName: name };
  }, [state.currentUser]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-cyan-50/40 p-4 lg:p-6">
      
      <div className="max-w-[1900px] mx-auto bg-white/40 backdrop-blur-2xl rounded-[3.5rem] p-6 lg:p-8 border-[6px] border-white shadow-2xl shadow-cyan-900/5">
        
        <div className="flex flex-col xl:flex-row gap-8">
            
            {/* --- LEFT COLUMN --- */}
            <div className="xl:w-[300px] shrink-0 flex flex-col gap-6 animate-slide-up">
                
                {/* 1. Identity Card (Soft Cyan) */}
                <div className="bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 rounded-[2.5rem] border-2 border-white/60 shadow-lg shadow-cyan-900/5 hover:shadow-xl hover:border-cyan-200 transition-all duration-500">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className={`w-24 h-24 rounded-[2rem] shadow-xl flex items-center justify-center text-white text-4xl font-black ring-8 ring-white ${getAvatarGradient(state.currentUser?.name || '')}`}>
                            {state.currentUser?.avatarUrl ? (
                                <img src={state.currentUser.avatarUrl} className="w-full h-full object-cover rounded-[2rem]" />
                            ) : (
                                state.currentUser?.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">{state.currentUser?.name.split(' ')[0]}</h2>
                            <p className="text-[11px] font-bold text-cyan-600 uppercase tracking-widest mt-1.5">{currentTenant?.name}</p>
                            
                            <div className="mt-4 flex justify-center">
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Online</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Today's Agenda (Optimized Visuals) */}
                <div className="flex-1 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 p-6 rounded-[2.5rem] border-2 border-white/60 shadow-lg shadow-indigo-900/5 flex flex-col relative overflow-hidden min-h-[450px]">
                    <div className="flex justify-between items-end mb-8 z-10 relative">
                        <div>
                            <h3 className="text-5xl font-black text-slate-800 tracking-tighter">{new Date().getDate()}</h3>
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">{new Date().toLocaleString('default', { month: 'long', weekday: 'long' })}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-md">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Timeline Line */}
                    <div className="absolute left-[3.25rem] top-32 bottom-0 w-[2px] bg-indigo-100 z-0 dashed"></div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 z-10">
                        {todayAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 opacity-50">
                                <Clock className="w-12 h-12 text-indigo-300 mb-3"/>
                                <p className="text-sm font-bold text-indigo-400">No appointments today</p>
                            </div>
                        ) : (
                            todayAppointments.map((apt, idx) => {
                                const pet = state.pets.find(p => p.id === apt.petId);
                                const time = new Date(apt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                const isNext = idx === 0; // Highlighting the next appointment

                                return (
                                    <div 
                                        key={apt.id} 
                                        onClick={() => apt.petId && onSelectPatient(apt.petId)}
                                        className={`relative flex items-center group cursor-pointer ${isNext ? 'scale-[1.02] origin-left' : ''} transition-all`}
                                    >
                                        <div className={`w-16 text-[11px] font-bold text-right mr-6 shrink-0 tabular-nums ${isNext ? 'text-indigo-600' : 'text-slate-400'}`}>{time}</div>
                                        
                                        {/* Timeline Dot */}
                                        <div className={`absolute left-[2.9rem] w-3 h-3 rounded-full border-[3px] z-20 transition-all ${isNext ? 'bg-indigo-500 border-indigo-200 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]' : 'bg-white border-slate-300'}`}></div>
                                        
                                        {/* Appointment Card */}
                                        <div className={`flex-1 p-3.5 rounded-[1.2rem] border-2 transition-all shadow-sm group-hover:shadow-md relative overflow-hidden ${isNext ? 'bg-white border-indigo-100 ring-2 ring-indigo-50' : 'bg-white/60 border-transparent hover:bg-white'}`}>
                                            {/* Colored Side Bar based on Pet Avatar Color */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getAvatarGradient(pet?.name || 'A')}`}></div>
                                            
                                            <div className="flex items-center gap-3 pl-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm ${getAvatarGradient(pet?.name || 'P')}`}>
                                                    {pet?.name?.[0]}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{pet?.name || apt.walkInName || 'Guest'}</p>
                                                    <p className="text-[10px] text-slate-500 truncate font-medium">{apt.reason}</p>
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

            {/* --- CENTER COLUMN: HERO & MODULES (50%) --- */}
            <div className="flex-1 flex flex-col gap-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                
                {/* 1. Hero / Action Center (Rose Gold / Teal Theme) */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-r from-teal-50 via-white to-rose-50 p-10 shadow-2xl shadow-teal-900/5 ring-4 ring-white border-2 border-teal-50/50 group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{greetingTime}</span>
                            </div>
                            <h1 className="text-5xl font-black mb-3 tracking-tight text-slate-800">{displayName}</h1>
                            <p className="text-slate-600 font-medium text-base md:max-w-lg leading-relaxed">
                                Everything is set for the day. You have <span className="font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">{todayAppointments.length} appointments</span> scheduled. 
                                {pendingLabs > 0 && <span> Check the <span className="font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">{pendingLabs} lab results</span> awaiting your review.</span>}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => onNavigate('logs')}
                                className="flex items-center gap-2 bg-slate-800 text-white px-6 py-4 rounded-[1.2rem] text-sm font-bold shadow-xl shadow-slate-800/20 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group-hover:bg-black"
                            >
                                <FileClock className="w-4 h-4 stroke-white" />
                                <span>Clinic Logs</span>
                                <ChevronRight className="w-4 h-4 opacity-50" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Decorative Blobs */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-teal-300 opacity-10 rounded-full blur-[80px] translate-x-20 -translate-y-10 group-hover:opacity-20 transition-opacity duration-700"></div>
                    <div className="absolute bottom-0 right-40 w-60 h-60 bg-rose-300 opacity-10 rounded-full blur-[60px] translate-y-20 group-hover:opacity-20 transition-opacity duration-700"></div>
                </div>

                {/* 2. Application Grid (Larger Cards) */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
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

            {/* --- RIGHT COLUMN: INTELLIGENCE & ALERTS (25%) --- */}
            <div className="xl:w-[300px] shrink-0 flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                
                {/* 1. Stat Widgets */}
                <div className="flex flex-col gap-5">
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

                {/* 2. Visual Chart Card */}
                <div className="flex-1 bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-lg shadow-teal-900/5 flex flex-col min-h-[250px] relative overflow-hidden group hover:border-teal-100 transition-colors">
                    <div className="flex items-center justify-between mb-4 z-10">
                        <h3 className="text-base font-black text-slate-700 tracking-tight">Financial Flow</h3>
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>
                    
                    <div className="flex-1 -ml-5 absolute bottom-0 left-0 right-0 top-16 z-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorGraph" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: '#0f766e', fontWeight: 'bold', fontSize: '13px' }}
                                    formatter={(val: number) => [formatCurrency(val, currency), '']}
                                    labelStyle={{ display: 'none' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="v" 
                                    stroke="#0d9488" 
                                    strokeWidth={4} 
                                    fill="url(#colorGraph)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Alerts (Enhanced) */}
                {lowStockCount > 0 && (
                    <button 
                        onClick={() => onNavigate('inventory')}
                        className="p-5 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] flex items-center gap-4 hover:bg-rose-100 hover:border-rose-200 transition-all text-left group shadow-sm hover:shadow-md hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 shrink-0 rounded-[1.2rem] bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all">
                            <AlertTriangle className="w-6 h-6 stroke-[2.5px]" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-rose-700 uppercase tracking-widest">Attention</p>
                            <p className="text-sm font-bold text-rose-900/80 leading-tight mt-0.5">{lowStockCount} items low on stock</p>
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
