import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, Owner, SaleRecord, SaleItem, Payment, ClinicSettings, SubscriptionTier } from '../types';
import { 
    Search, ShoppingCart, Trash2, Receipt, Printer, FileText, 
    CheckCircle2, X, Plus, Minus, ChevronDown, Eye, AlertTriangle, CreditCard, History, Store, Wallet
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { formatCurrency } from '../utils/uiUtils';

interface POSProps {
  sales: SaleRecord[];
  owners: Owner[];
  settings: ClinicSettings;
  inventory: InventoryItem[];
  plan?: SubscriptionTier;
  onSaveSale: (sale: SaleRecord) => void;
  onDeleteSale: (id: string, reason: string) => void;
}

const POS: React.FC<POSProps> = ({ sales = [], owners = [], settings, inventory = [], plan, onSaveSale, onDeleteSale }) => {
  // --- STATE ---
  const [mobileTab, setMobileTab] = useState<'Shop' | 'Cart' | 'History'>('Shop');
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [clientType, setClientType] = useState<'Walk-in' | 'Registered'>('Walk-in');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Payment State
  const [payMethod, setPayMethod] = useState<'Cash' | 'Card' | 'Transfer' | 'Credit'>('Transfer');
  const [payAmount, setPayAmount] = useState<string>('');
  const [discount, setDiscount] = useState('');

  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<SaleRecord | null>(null);

  // --- STRICT CALCULATIONS ---
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.unitPrice.toString()) * parseFloat(item.quantity.toString())), 0);
  const taxRate = parseFloat(settings.taxRate?.toString() || '0');
  const tax = subtotal * (taxRate / 100);
  const discountVal = parseFloat(discount) || 0;
  const total = Math.max(0, (subtotal + tax) - discountVal);

  // --- MEMOS ---
  const searchResults = useMemo(() => {
      let results = inventory;
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          results = inventory.filter(i => i.name.toLowerCase().includes(lower) || i.sku.toLowerCase().includes(lower));
      }
      return results.slice(0, 15);
  }, [inventory, searchTerm]);

  const filteredHistory = useMemo(() => {
      let sorted = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (historyFilter !== 'All') sorted = sorted.filter(s => s.status === historyFilter);
      return sorted;
  }, [sales, historyFilter]);

  // --- EFFECTS ---
  useEffect(() => {
      if (total > 0) setPayAmount(total.toFixed(2));
      else setPayAmount('');
  }, [total, cart, discount]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchFocused(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- ACTIONS ---
  const addToCart = (item: InventoryItem) => {
      const price = parseFloat(item.retailPrice.toString());
      setCart(prev => {
          const existing = prev.find(i => i.inventoryItemId === item.id);
          if (existing) {
              const newQty = existing.quantity + 1;
              return prev.map(i => i.inventoryItemId === item.id ? { ...i, quantity: newQty, total: newQty * price } : i);
          }
          return [...prev, { inventoryItemId: item.id, name: item.name, sku: item.sku, quantity: 1, unitPrice: price, total: price }];
      });
      setSearchTerm('');
      setIsSearchFocused(false);
      // Optional: Auto-switch to cart on mobile?
      // setMobileTab('Cart'); 
  };

  const updateQty = (id: string, newQty: number) => {
      if (isNaN(newQty) || newQty < 0) return;
      if (newQty === 0) { removeItem(id); return; }
      setCart(prev => prev.map(i => i.inventoryItemId === id ? { ...i, quantity: newQty, total: newQty * i.unitPrice } : i));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.inventoryItemId !== id));

  // --- HISTORY ACTIONS ---
  const handleEditInvoice = (sale: SaleRecord) => {
      if (cart.length > 0 && !window.confirm("Current cart will be replaced. Continue?")) return;
      setCart(sale.items);
      setDiscount(sale.discount.toString());
      setPayMethod(sale.payments[0]?.method || 'Transfer');
      setSelectedSale(sale);
      if (sale.clientId) { setClientType('Registered'); setSelectedClientId(sale.clientId); } 
      else { setClientType('Walk-in'); setSelectedClientId(''); }
      setMobileTab('Cart'); // Switch view
  };

  const handleViewReceipt = (sale: SaleRecord) => { setPrintData(sale); setShowPrintModal(true); };

  const handleDeleteInvoice = (id: string) => {
      const reason = window.prompt("Reason for deletion (required for logs):");
      if (reason) { onDeleteSale(id, reason); if (selectedSale?.id === id) resetPOS(); }
  };

  // --- CHECKOUT LOGIC ---
  const handleProcessTransaction = (type: 'Invoice' | 'Receipt') => {
      if (cart.length === 0) return;
      const isReceipt = type === 'Receipt';
      const status = isReceipt ? 'Paid' : 'Pending';
      if (!isReceipt && clientType === 'Walk-in') if (!window.confirm("Generating an unpaid Invoice for a Walk-in client is risky. Continue?")) return;

      const finalAmount = parseFloat(payAmount) || 0;
      if (isReceipt) {
          if (finalAmount <= 0 && total > 0) { alert("Amount paid cannot be 0."); return; }
          if (finalAmount < total) if(!window.confirm(`Payment (${formatCurrency(finalAmount, settings.currency)}) is less than Total. Proceed?`)) return;
      }

      const payments: Payment[] = isReceipt ? [{ id: `pay-${Date.now()}`, method: payMethod, amount: finalAmount, date: new Date().toISOString() }] : [];
      const saleId = selectedSale?.id || `sale-${Date.now()}`;
      const registeredOwner = owners.find(o => o.id === selectedClientId);
      
      const newSale: SaleRecord = {
          id: saleId, tenantId: '', date: new Date().toISOString(),
          clientId: clientType === 'Registered' ? selectedClientId : undefined,
          clientName: clientType === 'Registered' && registeredOwner ? registeredOwner.name : 'Walk-in Client',
          clientAddress: clientType === 'Registered' && registeredOwner ? registeredOwner.address : '',
          items: cart, subtotal, discount: discountVal, tax, total, status, payments,
          invoiceNumber: selectedSale?.invoiceNumber || `${settings.invoicePrefix}${Date.now().toString().slice(-6)}`,
          receiptNumber: status === 'Paid' ? (selectedSale?.receiptNumber || `${settings.receiptPrefix}${Date.now().toString().slice(-6)}`) : undefined
      };
      onSaveSale(newSale);
      resetPOS();
  };

  const resetPOS = () => {
      setCart([]); setDiscount(''); setPayAmount(''); setSelectedSale(null);
      setClientType('Walk-in'); setSelectedClientId(''); setPayMethod('Transfer');
  };

  // --- PRINT FUNCTION ---
  const handlePrint = () => {
      if (!printData) return;
      const isPaid = printData.status === 'Paid';
      const color = isPaid ? '#10b981' : '#f59e0b';
      const clinicName = settings.name || settings.clinicName || "Veterinary Clinic";
      const printContent = `<html><head><title>Receipt</title><style>body{font-family:sans-serif;padding:20px;}</style></head><body>
        <div style="text-align:center;color:${color}"><h1>${clinicName}</h1><p>${isPaid ? 'PAYMENT RECEIPT' : 'INVOICE'}</p></div>
        <p>Client: ${printData.clientName}</p>
        <p>Total: ${formatCurrency(printData.total, settings.currency)}</p>
        <script>window.print();</script></body></html>`;
      const win = window.open('', '', 'width=800,height=600');
      if (win) { win.document.write(printContent); win.document.close(); }
  };

  // Height Calculation: 100vh - (Header 64px + MobileNav 64px + Padding)
  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-6rem)] h-[calc(100dvh-9rem)] md:gap-6 font-sans bg-transparent">
        
        {/* MOBILE TABS */}
        <div className="md:hidden grid grid-cols-3 gap-2 bg-white p-1 rounded-xl shadow-sm mb-2 shrink-0">
            {['Shop', 'Cart', 'History'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setMobileTab(tab as any)} 
                    className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${mobileTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    {tab === 'Shop' && <Store className="w-4 h-4" />}
                    {tab === 'Cart' && <ShoppingCart className="w-4 h-4" />}
                    {tab === 'History' && <History className="w-4 h-4" />}
                    {tab} {tab === 'Cart' && cart.length > 0 && <span className="bg-emerald-500 text-white text-[10px] px-1.5 rounded-full">{cart.length}</span>}
                </button>
            ))}
        </div>

        {/* --- LEFT PANEL: SEARCH & HISTORY --- */}
        <div className={`flex-1 flex-col gap-4 md:gap-6 h-full relative ${mobileTab === 'Cart' ? 'hidden md:flex' : 'flex'} ${mobileTab === 'History' ? 'hidden md:flex' : ''}`}>
            
            {/* SEARCH AREA */}
            <div className={`flex flex-col gap-4 z-40 ${mobileTab === 'History' ? 'hidden md:flex' : ''}`}>
                <div className="relative w-full" ref={searchRef}>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search Item or SKU..." 
                            value={searchTerm}
                            onFocus={() => setIsSearchFocused(true)}
                            onChange={(e) => { setSearchTerm(e.target.value); setIsSearchFocused(true); }}
                            className="w-full pl-11 pr-4 py-3 md:py-4 bg-white border border-slate-200 rounded-2xl text-base font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none shadow-sm transition-all"
                        />
                    </div>
                    {/* RESULTS */}
                    {(isSearchFocused || mobileTab === 'Shop') && (
                        <div className={`${isSearchFocused ? 'absolute top-full left-0 right-0 mt-2 shadow-2xl border-slate-100 z-50 max-h-96' : 'static mt-4 shadow-none border-transparent h-full'} bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col`}>
                            <div className="overflow-y-auto custom-scrollbar flex-1">
                                {searchResults.length > 0 ? (
                                    searchResults.map(item => (
                                        <button 
                                            key={item.id}
                                            onClick={() => addToCart(item)}
                                            className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 text-left group"
                                        >
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-emerald-100 group-hover:text-emerald-600">
                                                    {item.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm group-hover:text-emerald-900">{item.name}</p>
                                                    <p className="text-xs text-slate-400">Stock: {item.stock}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-emerald-600 block">{formatCurrency(item.retailPrice, settings.currency)}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">No items found</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* HISTORY LIST */}
            <div className={`flex-1 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden relative flex flex-col ${mobileTab === 'Shop' ? 'hidden md:flex' : ''}`}>
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 className="font-bold text-slate-700">Recent Transactions</h3>
                    <div className="flex items-center gap-1">
                        {['All', 'Pending'].map((tab) => (
                            <button key={tab} onClick={() => setHistoryFilter(tab as any)} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${historyFilter === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                    {filteredHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><FileText className="w-16 h-16 mb-4 stroke-1"/><p>No records</p></div>
                    ) : (
                        filteredHistory.map((sale) => (
                            <div key={sale.id} className={`p-3 bg-white border border-slate-100 rounded-2xl transition-all active:scale-95 relative overflow-hidden ${selectedSale?.id === sale.id ? 'ring-2 ring-emerald-500' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sale.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {sale.status === 'Paid' ? <CheckCircle2 className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-xs truncate max-w-[100px]">{sale.clientName}</h4>
                                            <div className="text-[10px] text-slate-500 font-bold">{formatCurrency(sale.total, settings.currency)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleViewReceipt(sale)} className="p-1.5 bg-slate-50 text-slate-500 rounded hover:bg-slate-200"><Eye className="w-3.5 h-3.5"/></button>
                                        {sale.status === 'Pending' && <button onClick={() => handleEditInvoice(sale)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><CreditCard className="w-3.5 h-3.5"/></button>}
                                        <button onClick={() => handleDeleteInvoice(sale.id)} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* --- RIGHT PANEL: TRANSACTION CART --- */}
        <div className={`w-full md:w-[420px] flex flex-col h-full bg-white md:rounded-[2.5rem] rounded-xl shadow-none md:shadow-2xl md:border border-slate-200 overflow-hidden z-30 ${mobileTab === 'Cart' ? 'flex' : 'hidden md:flex'}`}>
            
            {/* Cart Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                        {selectedSale ? (selectedSale.status === 'Pending' ? 'Editing Invoice' : 'Receipt View') : 'Current Sale'}
                    </h3>
                    {selectedSale && <button onClick={resetPOS} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"><X className="w-3 h-3"/> Clear</button>}
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-3">
                    <button onClick={() => setClientType('Walk-in')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${clientType === 'Walk-in' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Walk-in</button>
                    <button onClick={() => setClientType('Registered')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${clientType === 'Registered' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Registered</button>
                </div>
                {clientType === 'Registered' && (
                     <SearchableSelect options={owners.map(o => ({ id: o.id, label: o.name, subLabel: o.phone }))} value={selectedClientId} onChange={setSelectedClientId} placeholder="Select Client..." />
                )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <ShoppingCart className="w-12 h-12 mb-3 opacity-20"/>
                        <p className="text-sm font-medium">Cart is empty</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.inventoryItemId} className="flex items-center justify-between group p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                            <div className="flex-1 pr-2">
                                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{formatCurrency(item.unitPrice, settings.currency)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="flex items-center bg-white border border-slate-200 rounded-lg h-8">
                                    <button onClick={() => updateQty(item.inventoryItemId, item.quantity - 1)} className="w-7 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-l-lg"><Minus className="w-3 h-3"/></button>
                                    <input type="number" min="1" className="w-8 h-full text-center text-xs font-bold text-slate-700 focus:outline-none focus:bg-slate-50" value={item.quantity} onChange={(e) => updateQty(item.inventoryItemId, parseInt(e.target.value) || 0)} />
                                    <button onClick={() => updateQty(item.inventoryItemId, item.quantity + 1)} className="w-7 h-full flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-r-lg"><Plus className="w-3 h-3"/></button>
                                </div>
                            </div>
                            <div className="text-right w-16 pl-1">
                                <p className="font-bold text-emerald-600 text-sm">{formatCurrency(item.total, settings.currency)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Cart Footer */}
            <div className="bg-slate-50 p-4 md:p-5 border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 pb-2 md:pb-5">
                 <div className="space-y-1 mb-4">
                     <div className="flex justify-between items-end pt-2 border-t border-slate-200 mt-2">
                         <span className="text-sm font-bold text-slate-800">Total Due</span>
                         <span className="text-2xl font-black text-slate-900">{formatCurrency(total, settings.currency)}</span>
                     </div>
                 </div>

                 <div className="grid grid-cols-5 gap-2 mb-4">
                    <div className="col-span-2 relative">
                         <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className="w-full h-full appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2 outline-none">
                             <option value="Transfer">Transfer</option><option value="Cash">Cash</option><option value="Card">Card</option><option value="Credit" disabled={clientType !== 'Registered'}>Credit</option>
                         </select>
                         <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"/>
                    </div>
                    <div className="col-span-3 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{settings.currency === 'NGN' ? '₦' : '$'}</span>
                        <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full bg-slate-900 text-white font-bold text-lg py-3 pl-7 pr-3 rounded-xl outline-none" placeholder="Amount..." />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => handleProcessTransaction('Invoice')} disabled={cart.length === 0} className="py-3 rounded-xl border border-slate-300 bg-white text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                         <FileText className="w-4 h-4" /> <span>Invoice</span>
                     </button>
                     <button onClick={() => handleProcessTransaction('Receipt')} disabled={cart.length === 0} className="py-3 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                         <Printer className="w-4 h-4" /> <span>Pay</span>
                     </button>
                 </div>
            </div>
        </div>

        {/* --- PRINT MODAL --- */}
        {showPrintModal && printData && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6 text-center">
                    <h2 className="font-bold text-xl mb-4">Print Receipt</h2>
                    <p className="mb-6">Total: {formatCurrency(printData.total, settings.currency)}</p>
                    <div className="flex gap-4">
                        <button onClick={() => setShowPrintModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Cancel</button>
                        <button onClick={handlePrint} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold">Print Now</button>
                    </div>
                </div>
            </div>
        )}

        <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }`}</style>
    </div>
  );
};

export default POS;
