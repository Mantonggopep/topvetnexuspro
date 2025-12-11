import React, { useState } from 'react';
import { LabResult, Pet, Owner } from '../types';
import { FlaskConical, Clock, CheckCircle2, FileText, Download, Plus, Search, Microscope, Upload, Save, Filter } from 'lucide-react';

interface LabProps {
    results: LabResult[];
    pets: Pet[];
    owners: Owner[];
    onAddResult: (result: LabResult) => void;
    onUpdateResult: (result: LabResult) => void;
}

const Lab: React.FC<LabProps> = ({ results, pets, owners, onAddResult, onUpdateResult }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Completed'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ petId: '', testName: '', notes: '' });

  // File Result Modal State
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [resultData, setResultData] = useState({ result: '', notes: '' });

  const filteredResults = results.filter(r => {
      const matchesSearch = r.testName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'All' || r.status === (activeTab === 'Completed' ? 'Completed' : 'Pending');
      if (activeTab === 'Pending') {
          return matchesSearch && (r.status === 'Pending' || r.status === 'Processing');
      }
      return matchesSearch && matchesTab;
  });

  const handleCreateRequest = () => {
      if (!newRequest.petId || !newRequest.testName) return;
      const pet = pets.find(p => p.id === newRequest.petId);
      const owner = owners.find(o => o.id === pet?.ownerId);

      const newItem: LabResult = {
          id: `lr-${Date.now()}`,
          tenantId: pet?.tenantId || '',
          petId: newRequest.petId,
          patientName: pet?.name,
          ownerName: owner?.name,
          testName: newRequest.testName,
          requestDate: new Date().toISOString(),
          status: 'Pending',
          requestedBy: 'Current User', 
          notes: newRequest.notes
      };

      onAddResult(newItem);
      setIsRequestModalOpen(false);
      setNewRequest({ petId: '', testName: '', notes: '' });
  };

  const openFileModal = (lab: LabResult) => {
      setSelectedResult(lab);
      setResultData({ result: lab.result || '', notes: lab.notes || '' });
      setIsFileModalOpen(true);
  };

  const handleSaveResult = () => {
      if (!selectedResult) return;
      
      const updated: LabResult = {
          ...selectedResult,
          status: 'Completed',
          completionDate: new Date().toISOString(),
          result: resultData.result,
          notes: resultData.notes,
          conductedBy: 'Lab Tech'
      };

      onUpdateResult(updated);
      setIsFileModalOpen(false);
      setSelectedResult(null);
  };

  return (
    <div className="bg-white md:rounded-xl shadow-sm border border-slate-100 flex flex-col h-[calc(100dvh-5rem)] md:h-[calc(100vh-8rem)]">
       {/* Mobile Header */}
       <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-20 space-y-3">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                    <FlaskConical className="w-5 h-5 mr-2 text-indigo-600" /> 
                    <span className="hidden md:inline">Lab & Diagnostics</span>
                    <span className="md:hidden">Lab</span>
                </h2>
                <button 
                    onClick={() => setIsRequestModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-1" /> New Test
                </button>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search patient or test..." 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Scrollable Tabs */}
            <div className="flex space-x-1 overflow-x-auto no-scrollbar pb-1">
                {['All', 'Pending', 'Completed'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            activeTab === tab 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
       </div>

       <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-20 md:pb-0">
                {filteredResults.map(lab => (
                    <div key={lab.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.99] transition-transform">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    lab.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                    {lab.status === 'Completed' ? <CheckCircle2 className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{lab.testName}</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{lab.patientName}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                lab.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100' : 
                                'bg-orange-50 text-orange-600 border-orange-100'
                            }`}>
                                {lab.status}
                            </span>
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-2.5 mb-3 space-y-1">
                             <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Date</span>
                                <span className="font-medium text-slate-700">{new Date(lab.requestDate).toLocaleDateString()}</span>
                             </div>
                             <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Owner</span>
                                <span className="font-medium text-slate-700 truncate max-w-[120px]">{lab.ownerName}</span>
                             </div>
                        </div>

                        {lab.status !== 'Completed' ? (
                            <button 
                                onClick={() => openFileModal(lab)}
                                className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors flex items-center justify-center border border-indigo-200"
                            >
                                <Microscope className="w-3.5 h-3.5 mr-2" /> Enter Results
                            </button>
                        ) : (
                            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="font-bold text-slate-800 block mb-1">Findings:</span>
                                <p className="line-clamp-2">{lab.result}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {filteredResults.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <FlaskConical className="w-16 h-16 mb-4 stroke-1"/>
                    <p>No records found</p>
                </div>
            )}
       </div>

       {/* New Request Modal - Mobile Optimized */}
       {isRequestModalOpen && (
           <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
               <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md animate-slide-up md:animate-scale-up max-h-[90vh] flex flex-col">
                   <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                       <h3 className="font-bold text-lg text-slate-800">New Lab Request</h3>
                       <button onClick={() => setIsRequestModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">✕</button>
                   </div>
                   <div className="p-6 space-y-4 overflow-y-auto">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Patient</label>
                           <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newRequest.petId}
                            onChange={(e) => setNewRequest({...newRequest, petId: e.target.value})}
                           >
                               <option value="">Choose...</option>
                               {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Test Name</label>
                           <input 
                            type="text" 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. CBC, Urinalysis"
                            value={newRequest.testName}
                            onChange={(e) => setNewRequest({...newRequest, testName: e.target.value})}
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                           <textarea 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-24 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Reason for test..."
                            value={newRequest.notes}
                            onChange={(e) => setNewRequest({...newRequest, notes: e.target.value})}
                           />
                       </div>
                       <button onClick={handleCreateRequest} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200">Send Request</button>
                   </div>
               </div>
           </div>
       )}

       {/* File Result Modal */}
       {isFileModalOpen && selectedResult && (
           <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
               <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up md:animate-scale-up max-h-[90vh] flex flex-col">
                   <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                       <h3 className="font-bold text-slate-800 truncate pr-4">Result: {selectedResult.testName}</h3>
                       <button onClick={() => setIsFileModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 shrink-0">✕</button>
                   </div>
                   <div className="p-5 space-y-4 overflow-y-auto">
                       <div className="bg-indigo-50 p-3 rounded-xl text-xs space-y-1 border border-indigo-100">
                           <div className="flex justify-between"><span className="text-indigo-400 font-bold uppercase">Patient</span> <span className="font-bold text-indigo-900">{selectedResult.patientName}</span></div>
                           <div className="flex justify-between"><span className="text-indigo-400 font-bold uppercase">Date</span> <span className="font-bold text-indigo-900">{new Date(selectedResult.requestDate).toLocaleDateString()}</span></div>
                       </div>

                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Result Summary</label>
                           <textarea 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-32 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Enter findings..."
                            value={resultData.result}
                            onChange={(e) => setResultData({...resultData, result: e.target.value})}
                           />
                       </div>
                       
                       <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs hover:bg-slate-50 transition-colors">
                           <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                           <p>Tap to upload PDF/Image</p>
                       </div>

                       <div className="grid grid-cols-2 gap-3 pt-2">
                            <button onClick={() => setIsFileModalOpen(false)} className="py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Cancel</button>
                            <button onClick={handleSaveResult} className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200">
                                Save Result
                            </button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default Lab;
