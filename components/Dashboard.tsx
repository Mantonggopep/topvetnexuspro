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

// --- 1. Compact Helper Components ---

// Mini App Icon
const AppIcon: React.FC<{ icon: React.FC<any>; gradient: string; size?: 'sm' | 'md' }> = ({ icon: Icon, gradient, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5 rounded-lg',
    md: 'w-10 h-10 p-2 rounded-xl',
  };
  
  return (
    <div className={`${sizeClasses[size]} ${gradient} shadow-md shadow-black/5 ring-1 ring-white/40 flex items-center justify-center text-white transform transition-all group-hover:scale-110`}>
      <Icon className="w-full h-full stroke-[2px]" />
    </div>
  );
};

// Compact Stat Widget (Small Card)
const CompactStatWidget: React.FC<{ 
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
        <div className={`flex flex-col justify-between p-3 rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 group`}>
            <div className="flex justify-between items-start mb-1">
                <div className={`p-1.5 rounded-lg ${colors.icon} text-white shadow-sm ring-1 ring-white/60`}>
                    <Icon className="w-3.5 h-3.5 stroke-[2.5px]" />
                </div>
                {trendPercent !== undefined && (
                    <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-white/90 ${finalIsNegative ? 'text-rose-600 border-rose-100' : 'text-emerald-600 border-emerald-100'}`}>
                        {finalIsNegative ? <ArrowDownRight className="w-2.5 h-2.5"/> : <ArrowUpRight className="w-2.5 h-2.5"/>}
                        {Math.abs(trendPercent).toFixed(1)}%
                    </span>
                )}
            </div>
            <div>
                <h4 className={`text-lg font-black ${colors.text} tracking-tight leading-none`}>{value}</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1 opacity-80">{label}</p>
            </div>
        </div>
    );
};

// Compact Nav Card (Only for Mobile)
const ModuleAppCard: React.FC<{
    title: string;
    desc: string;
    icon: React.FC<any>;
    colorTheme: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'slate' | 'rose' | 'indigo' | 'orange' | 'teal';
    onClick: () => void;
    count?: number;
}> = ({ title, desc, icon: Icon, colorTheme, onClick, count }) => {
    
    const theme = {
        blue:    { bg: 'bg-blue-50/50', border: 'border-blue-200', grad: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
        emerald: { bg: 'bg-emerald-50/50', border: 'border-emerald-200', grad: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
        amber:   { bg: 'bg-amber-50/50', border: 'border-amber-200', grad: 'bg-gradient-to-br from-amber-400 to-orange-500' },
        purple:  { bg: 'bg-purple-50/50', border: 'border-purple-200', grad: 'bg-gradient-to-br from-purple-500 to-fuchsia-600' },
        cyan:    { bg: 'bg-cyan-50/50', border: 'border-cyan-200', grad: 'bg-gradient-to-br from-cyan-400 to-blue-500' },
        slate:   { bg: 'bg-slate-50/50', border: 'border-slate-200', grad: 'bg-gradient-to-br from-slate-600 to-slate-800' },
        rose:    { bg: 'bg-rose-50/50', border: 'border-rose-200', grad: 'bg-gradient-to-br from-rose-400 to-pink-600' },
        indigo:  { bg: 'bg-indigo-50/50', border: 'border-indigo-200', grad: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
        orange:  { bg: 'bg-orange-50/50', border: 'border-orange-200', grad: 'bg-gradient-to-br from-orange-500 to-red-500' },
        teal:    { bg: 'bg-teal-50/50', border: 'border-teal-200', grad: 'bg-gradient-to-br from-teal-500 to-emerald-600' },
    }[colorTheme];

    return (
        <button 
            onClick={onClick}
            className={`
                group relative flex flex-col items-center text-center p-2 rounded-xl
                ${theme.bg} backdrop-blur-xl border ${theme.border}
                shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95
                transition-all duration-200
                min-h-[90px] justify-center
            `}
        >
            {count !== undefined && count > 0 && (
                <div className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-20">
                    {count}
                </div>
            )}
            <div className="mb-1.5">
                <AppIcon icon={Icon} gradient={theme.grad} size="sm" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 leading-tight">{title}</h3>
            <p className="text-[9px] text-slate-500 font-medium opacity-80">{desc}</p>
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
    // PADDING REDUCED: p-2 lg:p-4
    <div className="h-full overflow-y-auto custom-scrollbar bg-cyan-50/40 p-2 lg:p-4">
      
      {/* MAX WIDTH REMOVED/SCALED, ROUNDING REDUCED */}
      <div className="w-full mx-auto bg-white/40 backdrop-blur-xl rounded-2xl p-3 lg:p-5 border border-white/80 shadow-lg shadow-cyan-900/5">
        
        {/* GAP REDUCED: gap-4 */}
        <div className="flex flex-col xl:flex-row gap-4">
            
            {/* --- LEFT COLUMN (Profile & Agenda) --- */}
            {/* WIDTH REDUCED: xl:w-[240px] */}
            <div className="xl:w-[240px] shrink-0 flex flex-col gap-3 animate-slide-up">
                
                {/* 1. Identity Card (Compact) */}
                <div className="bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-3 rounded-xl border border-white/60 shadow-sm">
                    <div className="flex flex-row xl:flex-col items-center gap-3">
                        <div className={`w-12 h-12 xl:w-16 xl:h-16 shrink-0 rounded-xl shadow-md flex items-center justify-center text-white text-lg font-black ring-2 ring-white ${getAvatarGradient(state.currentUser?.name || '')}`}>
                            {state.currentUser?.avatarUrl ? (
                                <img src={state.currentUser.avatarUrl} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                state.currentUser?.name.charAt(0)
                            )}
                        </div>
                        <div className="text-left xl:text-center">
                            <h2 className="text-sm font-black text-slate-800 leading-tight">{state.currentUser?.name.split(' ')[0]}</h2>
                            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wide">{currentTenant?.name}</p>
                            <div className="mt-1 xl:mt-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[9px] font-bold text-emerald-700 uppercase">Online</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Today's Agenda (Compact) */}
                <div className="flex-1 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 p-3 rounded-xl border border-white/60 shadow-sm flex flex-col relative overflow-hidden min-h-[250px] max-h-[400px]">
                    <div className="flex justify-between items-end mb-3 z-10 relative">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{new Date().getDate()}</h3>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide">{new Date().toLocaleString('default', { month: 'short', weekday: 'short' })}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                            <Calendar className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="absolute left-[2.25rem] top-20 bottom-0 w-[1px] bg-indigo-100 z-0 dashed"></div>

                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 z-10">
                        {todayAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 opacity-50">
                                <Clock className="w-6 h-6 text-indigo-300 mb-1"/>
                                <p className="text-[10px] font-bold text-indigo-400">No appointments</p>
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
                                        <div className={`w-12 text-[9px] font-bold text-right mr-4 shrink-0 tabular-nums ${isNext ? 'text-indigo-600' : 'text-slate-400'}`}>{time}</div>
                                        
                                        <div className={`absolute left-[2rem] w-2 h-2 rounded-full border-[1.5px] z-20 ${isNext ? 'bg-indigo-500 border-indigo-200' : 'bg-white border-slate-300'}`}></div>
                                        
                                        <div className={`flex-1 p-2 rounded-lg border transition-all shadow-sm relative overflow-hidden ${isNext ? 'bg-white border-indigo-100' : 'bg-white/60 border-transparent hover:bg-white'}`}>
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getAvatarGradient(pet?.name || 'A')}`}></div>
                                            <div className="flex items-center gap-2 pl-1.5">
                                                <div className="overflow-hidden">
                                                    <p className="text-[11px] font-bold text-slate-800 truncate">{pet?.name || apt.walkInName || 'Guest'}</p>
                                                    <p className="text-[9px] text-slate-500 truncate font-medium leading-none">{apt.reason}</p>
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

            {/* --- CENTER COLUMN (Hero & Grid) --- */}
            <div className="flex-1 flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
                
                {/* 1. Hero / Action Center (Compact) */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-50 via-white to-rose-50 p-4 shadow-sm ring-1 ring-white border border-teal-50/50 group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{greetingTime}</span>
                            </div>
                            <h1 className="text-2xl font-black mb-1 text-slate-800">{displayName}</h1>
                            <p className="text-slate-600 font-medium text-xs leading-relaxed">
                                You have <span className="font-bold text-teal-600">{todayAppointments.length} appointments</span> today. 
                                {pendingLabs > 0 && <span> <span className="font-bold text-rose-500">{pendingLabs} lab results</span> pending.</span>}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onNavigate('logs')}
                                className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:scale-105 active:scale-95 transition-all"
                            >
                                <FileClock className="w-3 h-3 stroke-white" />
                                <span>Logs</span>
                                <ChevronRight className="w-3 h-3 opacity-50" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Application Grid (NAV BAR) 
                    - HIDDEN on PC (lg:hidden) as requested 
                    - SHOWN on Mobile 
                */}
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 lg:hidden">
                    <ModuleAppCard title="Patients" desc="Records" icon={Users} colorTheme="blue" onClick={() => onNavigate('patients')} count={state.pets.length} />
                    <ModuleAppCard title="Consults" desc="Medical" icon={Stethoscope} colorTheme="emerald" onClick={() => onNavigate('treatments')} />
                    <ModuleAppCard title="Schedule" desc="Booking" icon={Calendar} colorTheme="indigo" onClick={() => onNavigate('appointments')} />
                    <ModuleAppCard title="Clients" desc="Owners" icon={Search} colorTheme="rose" onClick={() => onNavigate('clients')} />
                    <ModuleAppCard title="POS" desc="Checkout" icon={ShoppingCart} colorTheme="purple" onClick={() => onNavigate('pos')} />
                    <ModuleAppCard title="Inventory" desc="Stock" icon={Package} colorTheme="amber" onClick={() => onNavigate('inventory')} />
                    <ModuleAppCard title="Labs" desc="Tests" icon={FlaskConical} colorTheme="cyan" onClick={() => onNavigate('lab')} count={pendingLabs} />
                    <ModuleAppCard title="Finance" desc="Money" icon={Wallet} colorTheme="orange" onClick={() => onNavigate('expenses')} />
                    <ModuleAppCard title="Reports" desc="Data" icon={TrendingUp} colorTheme="teal" onClick={() => onNavigate('reports')} />
                    <ModuleAppCard title="Settings" desc="Setup" icon={Settings} colorTheme="slate" onClick={() => onNavigate('settings')} />
                </div>
                
                {/* On PC, showing a placeholder graphic since the nav grid is hidden, 
                    to ensure the layout doesn't look empty if there's no sidebar. 
                    If you have a sidebar, this column will just fill naturally. */}
                <div className="hidden lg:flex flex-1 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="text-center opacity-40">
                        <Activity className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm font-bold text-slate-500">Overview Mode</p>
                    </div>
                </div>
            </div>

            {/* --- RIGHT COLUMN (Stats & Alerts) --- */}
            {/* WIDTH REDUCED: xl:w-[240px] */}
            <div className="xl:w-[240px] shrink-0 flex flex-col gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
                
                {/* 1. Stat Widgets (Compact) */}
                <div className="flex flex-col gap-3">
                    <CompactStatWidget 
                        label="Revenue (Today)" 
                        value={formatCurrency(todayRevenue, currency)} 
                        icon={DollarSign} 
                        colorTheme="teal"
                        trendPercent={revenuePercentChange}
                    />
                    <CompactStatWidget 
                        label="Active Patients" 
                        value={state.pets.length.toString()} 
                        icon={Users} 
                        colorTheme="gold"
                    />
                </div>

                {/* 2. Chart Card (Compact) */}
                <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col min-h-[160px] relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-1 z-10">
                        <h3 className="text-xs font-black text-slate-700">Financials</h3>
                        <div className="p-1 bg-teal-50 text-teal-600 rounded">
                            <Activity className="w-3 h-3" />
                        </div>
                    </div>
                    
                    <div className="flex-1 -ml-4 absolute bottom-0 left-0 right-0 top-8 z-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorGraph" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px' }}
                                    formatter={(val: number) => [formatCurrency(val, currency), '']}
                                    labelStyle={{ display: 'none' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="v" 
                                    stroke="#0d9488" 
                                    strokeWidth={2} 
                                    fill="url(#colorGraph)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Alerts (Compact) */}
                {lowStockCount > 0 && (
                    <button 
                        onClick={() => onNavigate('inventory')}
                        className="p-2 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 hover:bg-rose-100 transition-all text-left"
                    >
                        <div className="w-8 h-8 shrink-0 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-rose-700 uppercase">Attention</p>
                            <p className="text-[10px] font-bold text-rose-900/80 leading-tight">{lowStockCount} items low</p>
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
