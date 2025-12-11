import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Package, Search, Plus, AlertTriangle, AlertCircle, Filter, Edit2 } from 'lucide-react';
import { formatCurrency } from '../utils/uiUtils';

interface InventoryProps {
  items: InventoryItem[];
  currency: string;
  onAddItem: (item: InventoryItem) => Promise<void>;
  onUpdateItem: (item: InventoryItem) => Promise<void>;
}

const Inventory: React.FC<InventoryProps> = ({ items, currency, onAddItem, onUpdateItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Medicine',
    sku: '',
    stock: 0,
    unit: 'vial',
    purchasePrice: 0,
    retailPrice: 0,
    reorderLevel: 5,
    expiryDate: '',
    supplier: '',
    location: '',
    batchNumber: ''
  });

  const categories = ['Medicine', 'Food', 'Equipment', 'Consumable', 'Vaccine', 'Service'];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await onUpdateItem({ ...editingItem, ...formData } as InventoryItem);
      } else {
        await onAddItem({
          ...formData,
          id: crypto.randomUUID(),
          type: 'Product',
          wholesalePrice: 0,
        } as InventoryItem);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({
        name: '', category: 'Medicine', sku: '', stock: 0, unit: 'vial',
        purchasePrice: 0, retailPrice: 0, reorderLevel: 5, expiryDate: '',
        supplier: '', location: '', batchNumber: ''
      });
    } catch (error) {
      console.error("Error saving inventory item:", error);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
          <p className="text-slate-500">Track stock, expiry dates, and pricing.</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center shadow-lg hover:shadow-indigo-500/30 transition-all w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, SKU..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            <Filter className="w-5 h-5 text-slate-400 flex-shrink-0" />
            {['All', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterCategory === cat 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price ({currency})</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const isLowStock = item.stock <= item.reorderLevel;
                const isExpired = item.expiryDate ? new Date(item.expiryDate) < new Date() : false;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">SKU: {item.sku || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                          {item.stock} {item.unit}
                        </span>
                        {isLowStock && <AlertCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {formatCurrency(item.retailPrice, currency)}
                    </td>
                    <td className="px-4 py-3">
                      {isExpired ? (
                        <span className="inline-flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Expired
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                           Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                           In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
             <div className="text-center py-12">
               <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
               <p className="text-slate-500 font-medium">No items found</p>
             </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {editingItem ? 'Edit Item' : 'Add Inventory Item'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Item Name</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">SKU / Barcode</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.sku}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Stock</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Unit</label>
                      <input
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                      />
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Retail Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currency === 'NGN' ? '₦' : '$'}</span>
                    <input
                      type="number"
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.retailPrice}
                      onChange={e => setFormData({...formData, retailPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Purchase Price</label>
                  <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currency === 'NGN' ? '₦' : '$'}</span>
                     <input
                      type="number"
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.purchasePrice}
                      onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.expiryDate ? formData.expiryDate.split('T')[0] : ''}
                    onChange={e => setFormData({...formData, expiryDate: new Date(e.target.value).toISOString()})}
                  />
                </div>
                
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Reorder Level</label>
                   <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.reorderLevel}
                      onChange={e => setFormData({...formData, reorderLevel: Number(e.target.value)})}
                   />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md">
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
