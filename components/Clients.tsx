import React, { useState, useEffect, useRef } from 'react';
import { Owner, Pet, SaleRecord } from '../types'; // Removed Species if not used, or keep if needed
import { 
  Search, Mail, Phone, MapPin, ChevronRight, ArrowLeft, Plus, 
  PawPrint, User, Key, Shield, Send, MessageSquare, PlusCircle, Lock
} from 'lucide-react';
import { formatCurrency } from '../utils/uiUtils';
import { OwnerService, PatientService, SaleService } from '../services/api'; 

// Extended Interface to handle Portal properties if not in your main types
interface ExtendedOwner extends Owner {
    isPortalActive?: boolean;
    portalUsername?: string;
}

interface ClientsProps {
  currency?: string;
}

interface ChatMessage {
    id: string;
    sender: 'Clinic' | 'Client';
    text: string;
    timestamp: Date;
}

const Clients: React.FC<ClientsProps> = ({ currency = 'USD' }) => {
  // --- DATA STATE ---
  const [owners, setOwners] = useState<ExtendedOwner[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // --- UI STATE ---
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<'patients' | 'financials' | 'communication'>('patients');
  const [searchTerm, setSearchTerm] = useState('');

  // --- MODAL STATE ---
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);

  // --- FORM STATE ---
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });
  const [newPatient, setNewPatient] = useState({ 
      name: '', species: 'Dog', breed: '', age: '', gender: 'Male', allergies: '', color: '', initialWeight: ''
  });
  const [portalForm, setPortalForm] = useState({ password: '', isActive: false });

  // --- CHAT STATE ---
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]); 
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- INITIALIZATION ---
  const refreshData = async () => {
      setIsLoading(true);
      try {
          const [ownersRes, petsRes, salesRes] = await Promise.all([
              OwnerService.getAll(),
              PatientService.getAll(),
              SaleService.getAll()
          ]);
          setOwners(Array.isArray(ownersRes.data) ? ownersRes.data : []);
          setPets(Array.isArray(petsRes.data) ? petsRes.data : []);
          setSales(Array.isArray(salesRes.data) ? salesRes.data : []);
      } catch (error) {
          console.error("Failed to fetch client data", error);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => { refreshData(); }, []);

  // --- NAVIGATION HANDLERS ---
  const handleSelectClient = (id: string) => {
      setIsAnimating(true);
      setSelectedClientId(id);
      setActiveTab('patients'); 
      setMessages([]); // Cleared mock data. Fetch real history here if available.
      setTimeout(() => setIsAnimating(false), 300);
  };

  const handleBackToList = () => {
      setIsAnimating(true);
      setSelectedClientId(null);
      setTimeout(() => setIsAnimating(false), 300);
  };

  // --- ACTION HANDLERS ---
  const handleSaveClient = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newClient.name || !newClient.phone || !newClient.email) {
          alert("Name, Phone and Email are required.");
          return;
      }
      try {
          const { data } = await OwnerService.create(newClient);
          setOwners([data, ...owners]);
          setNewClient({ name: '', email: '', phone: '', address: '' });
          setIsAddClientModalOpen(false);
      } catch (error) {
          console.error("Failed to create client", error);
          alert("Failed to create client");
      }
  };

  const handleSavePatient = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedClientId || !newPatient.name) return;
      try {
          const payload = {
              ...newPatient,
              tenantId: 'system', // Adjust based on your auth logic
              age: Number(newPatient.age) || 0,
              initialWeight: Number(newPatient.initialWeight) || 0,
              ownerId: selectedClientId,
              allergies: newPatient.allergies ? newPatient.allergies.split(',') : [],
              type: 'Single',
              imageUrl: `https://ui-avatars.com/api/?name=${newPatient.name}&background=random`
          };
          const { data } = await PatientService.create(payload);
          setPets([data, ...pets]);
          // Reset form
          setNewPatient({ name: '', species: 'Dog', breed: '', age: '', gender: 'Male', allergies: '', color: '', initialWeight: '' });
          setIsAddPatientModalOpen(false);
      } catch (error) {
          console.error("Failed to create patient", error);
          alert("Failed to add pet. Please try again.");
      }
  };

  const handleSendChat = (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatMessage.trim()) return;
      
      const newMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'Clinic',
          text: chatMessage,
          timestamp: new Date()
      };
      
      setMessages([...messages, newMsg]);
      setChatMessage('');
      // API call to send message would go here
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleNewChat = () => {
      if(confirm("Start a new conversation thread?")) {
          setMessages([]);
      }
  }

  // --- PORTAL HANDLERS ---
  const handleOpenPortalModal = () => {
    const client = owners.find(o => o.id === selectedClientId);
    if (client) {
        setPortalForm({ password: '', isActive: client.isPortalActive || false });
        setIsPortalModalOpen(true);
    }
  };

  const handleUpdatePortalAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    try {
      await OwnerService.updatePortalAccess(selectedClientId, {
        password: portalForm.password || undefined,
        isActive: portalForm.isActive
      });
      
      // Optimistically update local state so UI reflects immediately
      setOwners(prev => prev.map(o => 
        o.id === selectedClientId ? { ...o, isPortalActive: portalForm.isActive } : o
      ));

      setIsPortalModalOpen(false);
      // refreshData(); // Optional: fetch fresh from server
    } catch (error) {
      alert("Failed to update portal settings.");
    }
  };

  // --- FILTERING ---
  const filteredOwners = owners.filter(owner => 
    (owner.name && owner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (owner.email && owner.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (owner.phone && owner.phone.includes(searchTerm))
  );

  const selectedClient = owners.find(o => o.id === selectedClientId);

  // ==================================================================================
  // RENDER: DETAIL VIEW
  // ==================================================================================
  if (selectedClientId && selectedClient) {
      const clientPets = pets.filter(p => p.ownerId === selectedClientId);
      const clientSales = sales.filter(s => s.clientId === selectedClientId);

      return (
          <div className="animate-fade-in-up h-full flex flex-col bg-white md:bg-transparent">
              {/* Header */}
              <div className="bg-white/90 backdrop-blur-xl border-b border-slate-100 p-4 sticky top-0 z-40 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                   <div className="flex items-center w-full md:w-auto">
                       <button onClick={handleBackToList} className="group flex items-center text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all">
                           <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                           <span className="font-bold">Back to List</span>
                       </button>
                   </div>
                   
                   {/* High Quality Tabs */}
                   <div className="flex p-1.5 bg-slate-100/80 rounded-2xl w-full md:w-auto overflow-x-auto">
                       {(['patients', 'financials', 'communication'] as const).map(tab => (
                           <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)} 
                                className={`
                                    flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-300
                                    ${activeTab === tab 
                                        ? 'bg-white text-indigo-600 shadow-md transform scale-105' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                                `}
                           >
                               {tab}
                           </button>
                       ))}
                   </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 scroll-smooth">
                  <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">
                      
                      {/* SIDEBAR: Client Profile */}
                      <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-4">
                          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                              <div className="relative z-10 pt-8">
                                <div className="w-24 h-24 mx-auto rounded-full bg-white p-1.5 shadow-lg mb-4">
                                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-3xl font-black">
                                        {selectedClient.name.charAt(0)}
                                    </div>
                                </div>
                                <h1 className="text-2xl font-black text-slate-800">{selectedClient.name}</h1>
                                <p className="text-sm font-semibold text-slate-400 mt-1">{selectedClient.clientNumber}</p>
                                
                                <div className="mt-8 flex flex-col gap-3 text-left">
                                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-4 hover:bg-slate-100 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Phone className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Phone</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedClient.phone}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-4 hover:bg-slate-100 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Mail className="w-5 h-5" /></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                                            <p className="text-sm font-bold text-slate-700 truncate">{selectedClient.email || 'No email'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-4 hover:bg-slate-100 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5" /></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Address</p>
                                            <p className="text-sm font-bold text-slate-700 truncate">{selectedClient.address || 'No Address'}</p>
                                        </div>
                                    </div>

                                    <hr className="border-slate-100 my-2" />

                                    <button 
                                        onClick={handleOpenPortalModal}
                                        className="w-full p-3 bg-indigo-50 rounded-2xl flex items-center justify-between group/btn hover:bg-indigo-100 transition-colors border border-indigo-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover/btn:bg-indigo-200">
                                                <Key className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-xs font-bold text-slate-700">Client Portal</span>
                                                <span className={`text-[10px] font-bold uppercase ${selectedClient.isPortalActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                    {selectedClient.isPortalActive ? 'Active' : 'Not Configured'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-indigo-300 group-hover/btn:text-indigo-500" />
                                    </button>
                                </div>
                              </div>
                          </div>
                      </div>

                      {/* MAIN CONTENT AREA */}
                      <div className="col-span-12 md:col-span-8 lg:col-span-9">
                          
                          {/* TAB: PATIENTS */}
                          {activeTab === 'patients' && (
                              <div className="space-y-6 animate-fade-in-up">
                                  <div className="flex justify-between items-center">
                                      <div>
                                        <h3 className="text-xl font-black text-slate-800">Pets</h3>
                                        <p className="text-sm text-slate-400">Registered animals for this client</p>
                                      </div>
                                      <button onClick={() => setIsAddPatientModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center">
                                          <Plus className="w-4 h-4 mr-2" /> Add Pet
                                      </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {clientPets.map(pet => (
                                          <div key={pet.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group cursor-pointer">
                                              <img src={pet.imageUrl || `https://ui-avatars.com/api/?name=${pet.name}&background=random`} className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shadow-inner group-hover:scale-110 transition-transform" />
                                              <div>
                                                  <h4 className="text-lg font-black text-slate-800">{pet.name}</h4>
                                                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{pet.species} • {pet.age} yrs</p>
                                                  <span className="inline-block mt-2 px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase">{pet.gender}</span>
                                              </div>
                                          </div>
                                      ))}
                                      {clientPets.length === 0 && (
                                          <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                                              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                                                  <PawPrint className="w-8 h-8" />
                                              </div>
                                              <p className="text-slate-400 font-medium">No pets recorded yet.</p>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          )}

                          {/* TAB: FINANCIALS */}
                          {activeTab === 'financials' && (
                              <div className="space-y-6 animate-fade-in-up">
                                  <div>
                                      <h3 className="text-xl font-black text-slate-800">Financial History</h3>
                                      <p className="text-sm text-slate-400">Invoices and payment records</p>
                                  </div>
                                  <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
                                      <table className="w-full text-left">
                                          <thead className="bg-slate-50 border-b border-slate-100">
                                              <tr>
                                                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                                                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-50">
                                              {clientSales.map(sale => (
                                                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                                      <td className="px-8 py-5 text-sm font-bold text-slate-600">{new Date(sale.date).toLocaleDateString()}</td>
                                                      <td className="px-8 py-5 text-sm text-slate-500">{sale.items.length} Items</td>
                                                      <td className="px-8 py-5 text-sm font-bold text-slate-800">{formatCurrency(sale.total, currency)}</td>
                                                      <td className="px-8 py-5">
                                                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                                              sale.status === 'Paid' 
                                                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                              : 'bg-orange-50 text-orange-600 border-orange-100'
                                                          }`}>
                                                              {sale.status}
                                                          </span>
                                                      </td>
                                                  </tr>
                                              ))}
                                              {clientSales.length === 0 && (
                                                  <tr><td colSpan={4} className="py-12 text-center text-slate-400 italic">No financial records found</td></tr>
                                              )}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          )}

                          {/* TAB: COMMUNICATION (CHAT) */}
                          {activeTab === 'communication' && (
                              <div className="h-[600px] flex flex-col bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in-up">
                                  {/* Portal Check */}
                                  {!selectedClient.isPortalActive ? (
                                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                                          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                                              <Lock className="w-10 h-10 text-slate-400" />
                                          </div>
                                          <h3 className="text-xl font-black text-slate-800 mb-2">Portal Access Needed</h3>
                                          <p className="text-slate-500 max-w-md mb-8">
                                              Communication features are disabled because this client does not have an active Portal account. 
                                              Please configure portal access to enable messaging.
                                          </p>
                                          <button 
                                            onClick={handleOpenPortalModal}
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all"
                                          >
                                              Configure Access
                                          </button>
                                      </div>
                                  ) : (
                                    <>
                                        {/* Chat Header */}
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                    <MessageSquare className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">Direct Message</h4>
                                                    <p className="text-xs text-slate-500">Chat with {selectedClient.name}</p>
                                                </div>
                                            </div>
                                            <button onClick={handleNewChat} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center">
                                                <PlusCircle className="w-3 h-3 mr-1" /> New Thread
                                            </button>
                                        </div>

                                        {/* Messages Area */}
                                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                                            {messages.map((msg) => {
                                                const isMe = msg.sender === 'Clinic';
                                                return (
                                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[70%] ${isMe ? 'order-1' : 'order-2'}`}>
                                                            <div className={`p-4 rounded-2xl text-sm shadow-sm ${
                                                                isMe 
                                                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                                                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                                                            }`}>
                                                                {msg.text}
                                                            </div>
                                                            <p className={`text-[10px] mt-1 opacity-50 font-bold ${isMe ? 'text-right' : 'text-left'}`}>
                                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {messages.length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                    <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                                                    <p className="text-sm">Start a conversation with {selectedClient.name}</p>
                                                </div>
                                            )}
                                            <div ref={chatEndRef} />
                                        </div>

                                        {/* Input Area */}
                                        <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-slate-100 flex gap-3">
                                            <input 
                                                type="text" 
                                                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                                placeholder="Type a message..."
                                                value={chatMessage}
                                                onChange={(e) => setChatMessage(e.target.value)}
                                            />
                                            <button type="submit" disabled={!chatMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200">
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </form>
                                    </>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // ==================================================================================
  // RENDER: LIST VIEW
  // ==================================================================================
  return (
      <div className={`bg-white md:bg-white/80 md:backdrop-blur-xl md:rounded-[2rem] md:shadow-2xl md:border md:border-white/60 overflow-hidden flex flex-col h-full animate-fade-in-up font-sans transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col gap-6 bg-white/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex justify-between items-center">
             <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Clients</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-400">{filteredOwners.length} Active Records</span>
                </div>
             </div>
             <button onClick={() => setIsAddClientModalOpen(true)} className="md:hidden bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-95"><Plus className="w-6 h-6" /></button>
          </div>
          
          <div className="flex gap-4">
              <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <input type="text" placeholder="Search by name, email, phone..." className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => setIsAddClientModalOpen(true)} className="hidden md:flex bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-sm font-bold items-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"><Plus className="w-5 h-5 mr-2" /> Add Client</button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto bg-slate-50 md:bg-transparent pb-24 md:pb-0">
          
          {/* MOBILE LIST */}
          <div className="md:hidden flex flex-col gap-3 p-4">
              {filteredOwners.map((owner) => (
                  <div key={owner.id} onClick={() => handleSelectClient(owner.id)} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-4 active:scale-[0.98] transition-transform">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner shrink-0 border border-indigo-100/50">
                          {owner.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate text-lg">{owner.name}</h3>
                          <div className="flex items-center text-xs text-slate-500 font-bold mt-1">
                              <Phone className="w-3 h-3 mr-1" /> {owner.phone}
                          </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                  </div>
              ))}
          </div>

          {/* DESKTOP TABLE */}
          <table className="w-full text-left hidden md:table">
              <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
                  <tr>
                      <th className="py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-wider pl-10">Client Profile</th>
                      <th className="py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</th>
                      <th className="py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-wider">Pets</th>
                      <th className="py-4 px-8 text-right"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                  {filteredOwners.map((owner) => {
                      const ownerPets = pets.filter(p => p.ownerId === owner.id);
                      return (
                          <tr key={owner.id} onClick={() => handleSelectClient(owner.id)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                              <td className="py-5 px-8 pl-10">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                          {owner.name.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-bold text-slate-900 text-base">{owner.name}</p>
                                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500 font-bold mt-1 inline-block">{owner.clientNumber}</span>
                                      </div>
                                  </div>
                              </td>
                              <td className="py-5 px-8">
                                  <div className="flex flex-col gap-1">
                                      <div className="flex items-center text-sm font-bold text-slate-700"><Phone className="w-3 h-3 mr-2 text-slate-400" /> {owner.phone}</div>
                                      <div className="flex items-center text-xs text-slate-500 font-medium"><Mail className="w-3 h-3 mr-2 text-slate-400" /> {owner.email || 'No email'}</div>
                                  </div>
                              </td>
                              <td className="py-5 px-8">
                                  <div className="flex -space-x-3 hover:space-x-1 transition-all">
                                      {ownerPets.slice(0, 4).map(pet => (
                                          <img key={pet.id} src={pet.imageUrl || `https://ui-avatars.com/api/?name=${pet.name}&background=random`} className="w-10 h-10 rounded-full border-[3px] border-white bg-slate-100 shadow-sm" title={pet.name} />
                                      ))}
                                      {ownerPets.length === 0 && <span className="text-xs text-slate-300 font-bold italic py-2">No pets</span>}
                                  </div>
                              </td>
                              <td className="py-5 px-8 text-right">
                                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center ml-auto group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                      <ChevronRight className="w-5 h-5" />
                                  </div>
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
          
          {filteredOwners.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <User className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">No clients found</h3>
                  <p className="text-slate-400 text-sm mt-1">Try adjusting your search terms</p>
              </div>
          )}
        </div>

        {/* ======================= */}
        {/* ADD CLIENT MODAL        */}
        {/* ======================= */}
        {isAddClientModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 animate-scale-in shadow-2xl border border-white/20">
                    <h3 className="font-black text-2xl mb-2 text-slate-900">New Client</h3>
                    <p className="text-slate-500 text-sm mb-6">Enter the client's details to create a profile.</p>
                    
                    <form onSubmit={handleSaveClient} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Full Name <span className="text-red-500">*</span></label>
                            <input required placeholder="e.g. Jane Doe" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all border border-transparent focus:border-indigo-100" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Phone <span className="text-red-500">*</span></label>
                                <input required placeholder="(555) 123-4567" type="tel" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all border border-transparent focus:border-indigo-100" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Email <span className="text-red-500">*</span></label>
                                <input required placeholder="jane@example.com" type="email" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all border border-transparent focus:border-indigo-100" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Address</label>
                            <input placeholder="123 Main St, City, State" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all border border-transparent focus:border-indigo-100" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} />
                        </div>

                        <div className="pt-6 flex gap-3">
                            <button type="button" onClick={() => setIsAddClientModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 active:scale-95 transition-all">Create Profile</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* ======================= */}
        {/* ADD PATIENT MODAL       */}
        {/* ======================= */}
        {isAddPatientModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 animate-scale-in shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
                    <h3 className="font-black text-2xl mb-2 text-slate-900">Add New Pet</h3>
                    <p className="text-slate-500 text-sm mb-6">Enter the patient details below.</p>
                    
                    <form onSubmit={handleSavePatient} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Name <span className="text-red-500">*</span></label>
                                <input required placeholder="Pet Name" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Species</label>
                                <select className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newPatient.species} onChange={e => setNewPatient({...newPatient, species: e.target.value})}>
                                    <option>Dog</option>
                                    <option>Cat</option>
                                    <option>Bird</option>
                                    <option>Rabbit</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Breed</label>
                                <input placeholder="e.g. Golden Retriever" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newPatient.breed} onChange={e => setNewPatient({...newPatient, breed: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Gender</label>
                                <select className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})}>
                                    <option>Male</option>
                                    <option>Female</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Age (Years)</label>
                                <input type="number" placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Weight (kg)</label>
                                <input type="number" step="0.1" placeholder="0.0" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newPatient.initialWeight} onChange={e => setNewPatient({...newPatient, initialWeight: e.target.value})} />
                            </div>
                        </div>
                        
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Color / Markings</label>
                            <input placeholder="e.g. Brown with white spots" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newPatient.color} onChange={e => setNewPatient({...newPatient, color: e.target.value})} />
                        </div>

                        <div className="pt-6 flex gap-3">
                            <button type="button" onClick={() => setIsAddPatientModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 active:scale-95 transition-all">Add Pet</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* PORTAL MODAL */}
        {isPortalModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 animate-scale-in border-t-4 border-indigo-500 shadow-2xl">
                        <div className="flex flex-col items-center mb-6">
                        <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h3 className="font-black text-xl text-slate-900">Portal Access</h3>
                        <p className="text-xs text-slate-400 font-bold mt-1 text-center">Manage login for {selectedClient?.name}</p>
                        </div>
                        
                        <form onSubmit={handleUpdatePortalAccess} className="space-y-5">
                        <div className="bg-slate-50 p-5 rounded-2xl flex items-center justify-between border border-slate-100">
                            <span className="text-sm font-bold text-slate-700">Enable Access</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={portalForm.isActive}
                                    onChange={e => setPortalForm({...portalForm, isActive: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">New Password</label>
                            <input 
                                type="text" 
                                placeholder="Enter password..." 
                                className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={portalForm.password}
                                onChange={e => setPortalForm({...portalForm, password: e.target.value})}
                            />
                            <p className="text-[10px] text-slate-400 font-medium ml-1">Leave blank to keep current password.</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setIsPortalModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Save Changes</button>
                        </div>
                        </form>
                </div>
            </div>
        )}
      </div>
  );
};

export default Clients;
