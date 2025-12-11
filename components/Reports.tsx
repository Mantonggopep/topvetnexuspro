import React, { useMemo, useState } from 'react';
import { SaleRecord, InventoryItem, Pet, Consultation } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Download, DollarSign, TrendingUp, Users, Package } from 'lucide-react';
import { formatCurrency } from '../utils/uiUtils';

interface ReportsProps {
    sales: SaleRecord[];
    inventory: InventoryItem[];
    pets: Pet[];
    consultations: Consultation[];
    currency: string;
}

const Reports: React.FC<ReportsProps> = ({ sales, inventory, pets, consultations, currency }) => {
  const [timeRange, setTimeRange] = useState<'30days' | 'Year' | 'All'>('Year');

  const totalRevenue = sales.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.total, 0);
  const outstandingInvoices = sales.filter(s => s.status === 'Pending').reduce((sum, s) => sum + (s.total - s.payments.reduce((pSum, p) => pSum + p.amount, 0)), 0);
  
  const inventoryValue = inventory.reduce((sum, i) => sum + (i.stock * i.retailPrice), 0);
  const inventoryCost = inventory.reduce((sum, i) => sum + (i.stock * i.purchasePrice), 0);
  const projectedProfit = inventoryValue - inventoryCost;

  const revenueData = useMemo(() => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const data = months.map(m => ({ name: m, value: 0 }));
      
      sales.forEach(sale => {
          if (sale.status === 'Paid') {
              const d = new Date(sale.date);
              const monthIdx = d.getMonth();
              data[monthIdx].value += sale.total;
          }
      });
      if (totalRevenue === 0) {
          return [
            { name: 'Jan', value: 0 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 },
            { name: 'Apr', value: 0 }, { name: 'May', value: 0 }, { name: 'Jun', value: 0 }
          ];
      }
      return data;
  }, [sales, totalRevenue]);

  const speciesData = useMemo(() => {
      const counts: Record<string, number> = {};
      pets.forEach(p => {
          counts[p.species] = (counts[p.species] || 0) + 1;
      });
      return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [pets]);

  const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];

  const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
              {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-lg ${color} text-white`}>
              <Icon className="w-6 h-6" />
          </div>
      </div>
  );

  return (
    <div className="space-y-6 pb-10">
        <div className="flex justify-between items-center">
             <div>
                <h2 className="text-2xl font-bold text-slate-800">Practice Analytics</h2>
                <p className="text-sm text-slate-500">Financial performance and clinical insights</p>
             </div>
             <div className="flex space-x-3">
                 <select 
                    className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm focus:outline-none"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                 >
                     <option value="30days">Last 30 Days</option>
                     <option value="Year">This Year</option>
                     <option value="All">All Time</option>
                 </select>
                 <button className="flex items-center space-x-2 bg-primary-50 text-primary-600 border border-primary-100 px-4 py-2 rounded-lg hover:bg-primary-100 shadow-sm text-sm font-bold transition-colors">
                    <Download className="w-4 h-4" /> <span>Export Report</span>
                 </button>
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Total Revenue" 
                value={formatCurrency(totalRevenue, currency)} 
                sub="Paid Invoices"
                icon={DollarSign} 
                color="bg-green-500" 
            />
            <StatCard 
                title="Pending Payments" 
                value={formatCurrency(outstandingInvoices, currency)} 
                sub="Outstanding Balance"
                icon={TrendingUp} 
                color="bg-orange-400" 
            />
            <StatCard 
                title="Active Patients" 
                value={pets.length} 
                sub={`${consultations.length} Consultations`}
                icon={Users} 
                color="bg-blue-500" 
            />
            <StatCard 
                title="Inventory Value" 
                value={formatCurrency(inventoryValue, currency)} 
                sub={`Est. Profit: ${formatCurrency(projectedProfit, currency)}`}
                icon={Package} 
                color="bg-purple-500" 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-6">Revenue Trend</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                            {/* FIXED: Removed 'prefix' prop, used tickFormatter instead */}
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(val) => `${currency} ${val}`} />
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                formatter={(value: number) => [formatCurrency(value, currency), 'Revenue']}
                            />
                            <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-6">Patient Species Distribution</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={speciesData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {speciesData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {speciesData.map((entry, index) => (
                        <div key={index} className="flex items-center text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                            <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                            {entry.name}: <span className="font-bold ml-1">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-4 border-b border-slate-100">
                 <h3 className="font-bold text-slate-800">Profit & Loss Summary (Estimated)</h3>
             </div>
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50">
                     <tr>
                         <th className="px-6 py-3 font-semibold text-slate-500">Category</th>
                         <th className="px-6 py-3 font-semibold text-slate-500 text-right">Amount</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     <tr>
                         <td className="px-6 py-3 text-slate-700">Total Sales Revenue</td>
                         <td className="px-6 py-3 text-right font-bold text-green-600">+{formatCurrency(totalRevenue, currency)}</td>
                     </tr>
                     <tr>
                         <td className="px-6 py-3 text-slate-700">Cost of Goods Sold (Inventory)</td>
                         <td className="px-6 py-3 text-right font-medium text-red-500">-{formatCurrency(totalRevenue * 0.4, currency)}</td>
                     </tr>
                     <tr>
                         <td className="px-6 py-3 text-slate-700">Operational Expenses (Est. 30%)</td>
                         <td className="px-6 py-3 text-right font-medium text-red-500">-{formatCurrency(totalRevenue * 0.3, currency)}</td>
                     </tr>
                     <tr className="bg-slate-50">
                         <td className="px-6 py-4 font-bold text-slate-900">Net Profit</td>
                         <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(totalRevenue - (totalRevenue * 0.7), currency)}</td>
                     </tr>
                 </tbody>
             </table>
        </div>
    </div>
  );
};

export default Reports;
