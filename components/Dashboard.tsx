import React from 'react';
import { 
  Users, Calendar, DollarSign, Activity, 
  TrendingUp, TrendingDown, Clock, AlertCircle, 
  CheckCircle, Package, ArrowRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { AppState, ViewType } from '../types';
import { formatCurrency, getAvatarGradient } from '../utils/uiUtils';

interface DashboardProps {
  state: AppState;
  onNavigate: (view: ViewType) => void;
  onSelectPatient: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, onSelectPatient }) => {
  // --- 1. SAFE DATA EXTRACTION (Prevents Crashes) ---
  const appointments = state.appointments || [];
  const sales = state.sales || [];
  const pets = state.pets || [];
  const owners = state.owners || [];
  const inventory = state.inventory || [];
  const currentUser = state.currentUser;

  // --- 2. CALCULATE STATS ---
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  // Appointments Today
  const todaysAppointments = appointments.filter(apt => {
    if (!apt.date) return false;
    const aptDate = new Date(apt.date);
    return aptDate >= startOfDay && aptDate < new Date(today.setHours(23, 59, 59, 999));
  });

  // Active Patients (Not deceased)
  // Check for 'Deceased' case-insensitively just in case
  const activePatients = pets.filter(p => p.status?.toLowerCase() !== 'deceased').length;

  // Monthly Revenue
  const currentMonth = new Date().getMonth();
  const monthlyRevenue = sales
    .filter(s => s.date && new Date(s.date).getMonth() === currentMonth)
    .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

  // Low Stock Items
  const lowStockCount = inventory.filter(i => (i.stock || 0) <= (i.minStock || 5)).length;

  // --- 3. CHART DATA PREPARATION ---
  const revenueData = [
    { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 }, 
    { name: 'Wed', value: 0 }, { name: 'Thu', value: 0 }, 
    { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 }, { name: 'Sun', value: 0 }
  ];
  
  // Simple mock distribution for visualization if no real data exists yet
  if (sales.length > 0) {
      // Logic to map real sales to days would go here
      // For now, we ensure the chart doesn't break
  }

  // --- 4. RENDER HELPERS ---
  const StatCard = ({ title, value, icon: Icon, trend, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center px-2 py-1 rounded-lg text-xs font-bold ${Number(trend) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {Number(trend) >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
      <div className="text-2xl font-black text-slate-800">{value}</div>
      {subtext && <div className="text-xs text-slate-400 mt-2 font-medium">{subtext}</div>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* WELCOME BANNER */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black mb-2">
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Doctor'}! 👋
          </h1>
          <p className="text-slate-300 font-medium max-w-lg leading-relaxed">
            You have <strong className="text-white">{todaysAppointments.length} appointments</strong> scheduled for today. 
            {lowStockCount > 0 && <span> Warning: <strong className="text-red-300">{lowStockCount} items</strong> are low on stock.</span>}
          </p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => onNavigate('appointments')} className="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-lg shadow-white/10">
              View Calendar
            </button>
            <button onClick={() => onNavigate('pos')} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors border border-slate-700">
              New Sale
            </button>
          </div>
        </div>
        {/* Background Decoration */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 right-20 w-40 h-40 bg-teal-500 rounded-full blur-3xl opacity-20 -mb-10 pointer-events-none"></div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Revenue (Month)" 
          value={formatCurrency(monthlyRevenue, state.tenants[0]?.settings?.currency || 'USD')} 
          icon={DollarSign} 
          color="bg-emerald-500" 
          trend="12.5" 
          subtext="Vs last month"
        />
        <StatCard 
          title="Active Patients" 
          value={activePatients} 
          icon={Activity} 
          color="bg-blue-500" 
          trend="5.2" 
          subtext="Total registered pets"
        />
        <StatCard 
          title="Today's Visits" 
          value={todaysAppointments.length} 
          icon={Calendar} 
          color="bg-violet-500" 
          subtext={`${appointments.filter(a => a.status === 'Completed').length} Completed so far`}
        />
        <StatCard 
          title="Low Stock" 
          value={lowStockCount} 
          icon={Package} 
          color="bg-amber-500" 
          trend={lowStockCount > 0 ? "-2.5" : "0"}
          subtext="Items requiring reorder"
        />
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: APPOINTMENTS */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="font-black text-slate-800 text-lg">Today's Schedule</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{new Date().toLocaleDateString()}</p>
            </div>
            <button onClick={() => onNavigate('appointments')} className="text-indigo-600 text-xs font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">View All</button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {todaysAppointments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Calendar className="w-12 h-12 mb-3" />
                    <p className="text-sm font-bold">No appointments for today</p>
                </div>
            ) : (
                todaysAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center p-4 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all group">
                    <div className="flex-shrink-0 w-16 text-center mr-4">
                      <div className="text-sm font-black text-slate-700">
                        {new Date(apt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md mt-1 inline-block
                        ${apt.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                          apt.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                          'bg-amber-100 text-amber-700'}`}>
                        {apt.status}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <h4 className="font-bold text-slate-800 truncate mr-2">{apt.patient?.name || 'Unknown Pet'}</h4>
                        <span className="text-xs text-slate-500 font-medium bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{apt.patient?.species || 'Pet'}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {apt.client?.name || owners.find(o => o.id === apt.ownerId)?.name || 'Unknown Owner'}
                        <span className="mx-1.5">•</span>
                        {apt.reason}
                      </p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => onSelectPatient(apt.petId)} className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm border border-slate-100 hover:scale-110 transition-transform">
                            <ArrowRight className="w-4 h-4" />
                         </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITY / ALERTS */}
        <div className="space-y-6">
            {/* INVENTORY ALERTS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                        Inventory Alerts
                    </h3>
                </div>
                
                <div className="space-y-3">
                    {lowStockCount === 0 ? (
                        <div className="text-center py-6">
                            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-400">Stock levels look good</p>
                        </div>
                    ) : (
                        inventory
                           .filter(i => (i.stock || 0) <= (i.minStock || 5))
                           .slice(0, 3)
                           .map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                                <div>
                                    <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                                    <div className="text-[10px] font-bold text-red-600">{item.stock} remaining</div>
                                </div>
                                <button onClick={() => onNavigate('inventory')} className="text-xs font-bold bg-white text-slate-700 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">
                                    Restock
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RECENT SALES */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex-1">
                 <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-indigo-500" />
                    Recent Activity
                 </h3>
                 <div className="space-y-4">
                    {sales.slice(0, 4).map(sale => (
                        <div key={sale.id} className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 mr-3">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-800 text-sm truncate">
                                    Sale #{sale.id.slice(-4)}
                                </div>
                                <div className="text-xs text-slate-400 font-medium">
                                    {new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                            <div className="font-black text-slate-800 text-sm">
                                {formatCurrency(sale.total, state.tenants[0]?.settings?.currency || 'USD')}
                            </div>
                        </div>
                    ))}
                    {sales.length === 0 && (
                        <p className="text-center text-xs text-slate-400 py-4 font-bold">No recent activity</p>
                    )}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
