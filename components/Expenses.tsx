import React, { useState } from 'react';
import { Expense, ClinicSettings } from '../types';
import { DollarSign, Plus, Calendar, Tag, FileText, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/uiUtils';

interface ExpensesProps {
  expenses: Expense[];
  settings: ClinicSettings;
  onAddExpense: (expense: Omit<Expense, 'id' | 'tenantId'>) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, settings, onAddExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      category: 'Utilities',
      description: '',
      amount: '',
      paymentMethod: 'Cash',
      notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAddExpense({
          date: new Date(formData.date).toISOString(),
          category: formData.category,
          description: formData.description,
          amount: Number(formData.amount),
          paymentMethod: formData.paymentMethod,
          notes: formData.notes
      });
      setIsModalOpen(false);
      setFormData({ date: new Date().toISOString().split('T')[0], category: 'Utilities', description: '', amount: '', paymentMethod: 'Cash', notes: '' });
  };

  const categories = ['Utilities', 'Rent', 'Salaries', 'Supplies', 'Maintenance', 'Marketing', 'Other'];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4 md:space-y-6 flex flex-col h-[calc(100dvh-5rem)] md:h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4 bg-white p-4 md:p-0 rounded-xl md:bg-transparent shadow-sm md:shadow-none border border-slate-100 md:border-none">
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Expenses</h2>
                <p className="text-xs md:text-sm text-slate-500">Track clinic expenditures</p>
            </div>
            <div className="flex w-full md:w-auto items-center gap-3">
                <div className="flex-1 md:flex-none bg-red-50 text-red-700 px-4 py-2.5 rounded-xl border border-red-100 font-bold shadow-sm text-center text-sm">
                    {formatCurrency(totalExpenses, settings.currency)}
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center shadow-lg transition-colors active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-2" /> Record
                </button>
            </div>
        </div>

        {/* Content Container */}
        <div className="bg-transparent md:bg-white md:rounded-xl md:shadow-sm md:border border-slate-100 flex-1 overflow-hidden flex flex-col">
            
            {/* DESKTOP TABLE (Hidden on Mobile) */}
            <div className="hidden md:block flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {expenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-6 text-sm text-slate-600">{new Date(expense.date).toLocaleDateString()}</td>
                                <td className="py-4 px-6"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">{expense.category}</span></td>
                                <td className="py-4 px-6 text-sm font-medium text-slate-800">{expense.description}</td>
                                <td className="py-4 px-6 text-sm text-slate-500">{expense.paymentMethod}</td>
                                <td className="py-4 px-6 text-right font-bold text-red-600 font-mono">{formatCurrency(expense.amount, settings.currency)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MOBILE LIST (Cards) */}
            <div className="md:hidden flex-1 overflow-y-auto space-y-3 pb-20 px-1">
                {expenses.map(expense => (
                    <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(expense.date).toLocaleDateString()}</span>
                                <span className="font-bold text-slate-800">{expense.description}</span>
                            </div>
                            <span className="font-mono font-bold text-red-600 text-lg">
                                {formatCurrency(expense.amount, settings.currency)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-2">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                {expense.category}
                            </span>
                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                <Tag className="w-3 h-3" /> {expense.paymentMethod}
                            </span>
                        </div>
                    </div>
                ))}
                {expenses.length === 0 && (
                     <div className="text-center py-10 text-slate-400 opacity-60">
                        <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                        <p>No expenses yet</p>
                     </div>
                )}
            </div>
        </div>

        {/* Mobile-Responsive Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md animate-slide-up md:animate-scale-up max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-lg text-slate-800">Record Expense</h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">✕</button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                <input type="date" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                            <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder="e.g. Electric Bill" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount</label>
                                <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-800" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Method</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                                    <option>Cash</option>
                                    <option>Bank Transfer</option>
                                    <option>Card</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-20 outline-none resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-lg mt-2">Save Record</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Expenses;
