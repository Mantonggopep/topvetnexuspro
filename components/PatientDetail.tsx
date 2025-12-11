import React, { useState, useEffect } from 'react';
import { Pet, Owner, MedicalNote } from '../types';
import { ChevronLeft, Activity, Plus, Sparkles, User, AlertTriangle, Info, Calendar, Clock, Heart, Thermometer, Weight, Bell, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts';
import { generateSOAPNote } from '../services/geminiService';

interface PatientDetailProps {
  pet: Pet;
  owner?: Owner;
  onBack: () => void;
  onAddNote: (petId: string, note: MedicalNote) => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ pet, owner, onBack, onAddNote }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'vitals' | 'reminders'>('overview');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState('');
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const handleGenerateNote = async () => {
    if (!noteInput.trim()) return;
    setIsGenerating(true);
    try {
        const result = await generateSOAPNote(noteInput, pet.name, pet.species);
        setGeneratedNote(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSaveNote = () => {
    const newNote: MedicalNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      vetName: "Dr. User",
      type: "SOAP",
      content: generatedNote || noteInput
    };
    onAddNote(pet.id, newNote);
    setIsNoteModalOpen(false);
    setNoteInput('');
    setGeneratedNote('');
    setActiveTab('notes');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/50 text-xs">
          <p className="font-bold text-gray-800 mb-1">{new Date(label).toLocaleDateString()}</p>
          <p className="text-[rgb(var(--ios-primary))] font-semibold">
            {payload[0].value} kg
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <style>{`
        :root { --ios-primary: 0, 122, 255; --ios-bg: 242, 242, 247; --ios-card: 255, 255, 255; }
        .ios-glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.05); }
        .slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .scale-up { animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* Added max-h for mobile consistency */}
      <div className={`flex flex-col h-full bg-[rgb(var(--ios-bg))] md:rounded-[32px] shadow-2xl overflow-hidden border border-white/40 ring-1 ring-black/5 font-sans transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* --- Top Navigation Bar --- */}
        <div className="px-4 md:px-6 py-3 md:py-4 flex items-center bg-white/50 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-20 shrink-0">
            <button 
                onClick={onBack} 
                className="group flex items-center text-[rgb(var(--ios-primary))] font-medium text-sm hover:opacity-70 transition-opacity"
            >
                <div className="bg-white/80 p-1.5 rounded-full shadow-sm mr-2 group-active:scale-90 transition-transform">
                     <ChevronLeft className="w-5 h-5" />
                </div>
                Back to Registry
            </button>
        </div>

        {/* --- Scrollable Content --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar">
            
            {/* 1. Header Identity Card */}
            <div className="ios-glass-card rounded-2xl md:rounded-3xl p-5 md:p-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start relative z-10">
                    {/* Image Area */}
                    <div className="relative group shrink-0">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] overflow-hidden shadow-lg ring-4 ring-white">
                            <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        {pet.type === 'Herd' && (
                             <span className="absolute -bottom-2 -right-2 bg-purple-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                                <User className="w-4 h-4" />
                            </span>
                        )}
                    </div>
                    
                    {/* Info Area */}
                    <div className="flex-1 w-full text-center md:text-left">
                        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-1">{pet.name}</h1>
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 text-sm font-medium text-gray-500 mb-4">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">{pet.species}</span>
                                    <span>•</span>
                                    <span>{pet.breed}</span>
                                    <span>•</span>
                                    <span>{pet.age} Years</span>
                                    <span>•</span>
                                    <span>{pet.gender}</span>
                                </div>
                            </div>
                            
                            {/* Owner Micro-Card */}
                            {owner && (
                                <div className="bg-white/60 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white shadow-sm flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white shadow-md">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Owner</p>
                                        <p className="text-sm font-bold text-gray-800">{owner.name}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                            {pet.medicalConditions.map((cond, idx) => (
                                <div key={idx} className="flex items-center bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-100/50 shadow-sm">
                                    <Info className="w-3.5 h-3.5 mr-1.5" /> {cond}
                                </div>
                            ))}
                            {pet.allergies.map((allergy, idx) => (
                                <div key={idx} className="flex items-center bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold border border-red-100/50 shadow-sm">
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Allergy: {allergy}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. iOS Segmented Control Tabs (Scrollable on Mobile) */}
            <div className="flex justify-center w-full">
                <div className="bg-gray-200/80 p-1 rounded-xl flex overflow-x-auto relative shadow-inner w-full md:w-auto no-scrollbar">
                    {['overview', 'notes', 'vitals', 'reminders'].map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`
                                    relative px-6 md:px-8 py-2 text-xs font-bold rounded-lg capitalize transition-all duration-300 z-10 whitespace-nowrap flex-1 md:flex-none
                                    ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}
                                `}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-white rounded-lg shadow-sm border border-black/5 -z-10 animate-ios-scale-in" />
                                )}
                                {tab === 'notes' ? 'History' : tab}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* 3. Tab Content Area */}
            <div className="slide-in-right pb-10">
                
                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        {/* Vitals Summary */}
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-[rgb(var(--ios-primary))] flex items-center justify-center mb-2">
                                    <Weight className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-black text-gray-800 tracking-tight">
                                    {pet.vitalsHistory.length > 0 ? pet.vitalsHistory[pet.vitalsHistory.length - 1].weightKg : '-'}
                                    <span className="text-sm text-gray-400 font-medium ml-1">kg</span>
                                </span>
                                <span className="text-xs font-semibold text-gray-400 mt-1">Latest Weight</span>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-black text-gray-800 tracking-tight">
                                    {pet.vitalsHistory.length > 0 && pet.vitalsHistory[pet.vitalsHistory.length - 1].heartRateBpm > 0 
                                     ? pet.vitalsHistory[pet.vitalsHistory.length - 1].heartRateBpm : '-'}
                                    <span className="text-sm text-gray-400 font-medium ml-1">bpm</span>
                                </span>
                                <span className="text-xs font-semibold text-gray-400 mt-1">Heart Rate</span>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-2">
                                    <Thermometer className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-black text-gray-800 tracking-tight">
                                    {pet.vitalsHistory.length > 0 && pet.vitalsHistory[pet.vitalsHistory.length - 1].temperatureC > 0 
                                     ? pet.vitalsHistory[pet.vitalsHistory.length - 1].temperatureC : '-'}
                                    <span className="text-sm text-gray-400 font-medium ml-1">°C</span>
                                </span>
                                <span className="text-xs font-semibold text-gray-400 mt-1">Temperature</span>
                            </div>
                        </div>

                        {/* Action Card */}
                        <div className="bg-gradient-to-br from-[rgb(var(--ios-primary))] to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/30 flex flex-col justify-between relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                             
                             <div>
                                <h3 className="text-lg font-bold mb-1">Start Consultation</h3>
                                <p className="text-blue-100 text-xs font-medium leading-relaxed">
                                    Use AI assistance to generate SOAP notes or record new vitals manually.
                                </p>
                             </div>

                             <button 
                                onClick={() => setIsNoteModalOpen(true)}
                                className="mt-4 w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center"
                            >
                                <Sparkles className="w-4 h-4 mr-2" /> New Visit
                            </button>
                        </div>
                    </div>
                )}

                {/* --- NOTES / HISTORY TAB --- */}
                {activeTab === 'notes' && (
                    <div className="space-y-6 pl-4 border-l-2 border-gray-200 ml-2">
                        <div className="flex justify-between items-center -ml-6 mb-8">
                            <h3 className="font-bold text-gray-800 pl-6 text-lg">Medical Timeline</h3>
                            <button onClick={() => setIsNoteModalOpen(true)} className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center transition-colors shadow-lg">
                                <Plus className="w-3 h-3 mr-2" /> Add Entry
                            </button>
                        </div>

                        {pet.notes.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 italic bg-white rounded-2xl border border-dashed border-gray-300">
                                No medical history recorded yet.
                            </div>
                        ) : (
                            pet.notes.slice().reverse().map((note, idx) => (
                                <div key={note.id} className="relative pl-2 md:pl-6 animate-ios-slide-up" style={{animationDelay: `${idx * 100}ms`}}>
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-white border-4 border-[rgb(var(--ios-primary))] shadow-sm z-10"></div>
                                    
                                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                                        <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className={`
                                                    px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
                                                    ${note.type === 'SOAP' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}
                                                `}>
                                                    {note.type}
                                                </div>
                                                <div className="flex items-center text-xs text-gray-400 font-medium">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {new Date(note.date).toLocaleDateString()}
                                                    <Clock className="w-3 h-3 ml-3 mr-1" />
                                                    {new Date(note.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                {note.vetName}
                                            </span>
                                        </div>
                                        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line font-medium">
                                            {note.content}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- REMINDERS TAB --- */}
                {activeTab === 'reminders' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {pet.reminders && pet.reminders.length > 0 ? (
                            pet.reminders.map(rem => {
                                const isOverdue = new Date(rem.dueDate) < new Date();
                                return (
                                    <div key={rem.id} className={`p-4 md:p-5 rounded-2xl border shadow-sm flex items-start justify-between ${isOverdue ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                                        <div className="flex items-start">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 ${isOverdue ? 'bg-red-100 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                                <Bell className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className={`font-bold ${isOverdue ? 'text-red-700' : 'text-gray-800'}`}>{rem.description}</h4>
                                                <div className="flex items-center mt-1 text-xs text-gray-500 font-medium">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    Due: {new Date(rem.dueDate).toLocaleDateString()}
                                                    {isOverdue && <span className="ml-2 text-red-600 font-bold uppercase tracking-wider text-[10px] bg-red-100 px-2 py-0.5 rounded-full">Overdue</span>}
                                                </div>
                                                <span className="inline-block mt-2 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-md uppercase">{rem.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="col-span-2 text-center py-12 text-gray-400 italic bg-white rounded-2xl border border-dashed border-gray-300">
                                No active reminders.
                            </div>
                        )}
                    </div>
                )}

                {/* --- VITALS CHART TAB --- */}
                {activeTab === 'vitals' && (
                    <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 h-[350px] md:h-[400px]">
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-[rgb(var(--ios-primary))]" />
                            Weight Progression
                        </h3>
                        <div className="w-full h-[250px] md:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={pet.vitalsHistory}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="rgb(var(--ios-primary))" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="rgb(var(--ios-primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})} 
                                        tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis 
                                        tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                                        axisLine={false}
                                        tickLine={false}
                                        domain={['auto', 'auto']}
                                        dx={-10}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgb(var(--ios-primary))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="weightKg" 
                                        stroke="rgb(var(--ios-primary))" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#colorWeight)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- ADD NOTE MODAL --- */}
        {isNoteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" onClick={() => setIsNoteModalOpen(false)} />
                <div className="relative bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col scale-up border border-white/50">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0">
                        <div>
                            <h3 className="font-bold text-xl text-gray-900 flex items-center">
                                <Sparkles className="w-5 h-5 mr-2 text-[rgb(var(--ios-primary))]" />
                                AI Clinical Assistant
                            </h3>
                        </div>
                        <button onClick={() => setIsNoteModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors">✕</button>
                    </div>
                    <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Observations</label>
                            <textarea
                                className="w-full h-32 p-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-[rgb(var(--ios-primary))] transition-all text-sm font-medium resize-none shadow-sm"
                                placeholder="Describe symptoms, vitals, and observations..."
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleGenerateNote} 
                                disabled={isGenerating || !noteInput.trim()}
                                className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center disabled:opacity-50 transition-all shadow-lg active:scale-95"
                            >
                                {isGenerating ? (
                                    <><div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div> Processing...</>
                                ) : (
                                    <><Sparkles className="w-3.5 h-3.5 mr-2 text-yellow-300" /> Generate SOAP Note</>
                                )}
                            </button>
                        </div>
                        {generatedNote && (
                            <div className="animate-ios-slide-up">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Formatted Result</label>
                                <textarea
                                    className="w-full h-56 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-mono text-gray-800 focus:ring-0 resize-none"
                                    value={generatedNote}
                                    onChange={(e) => setGeneratedNote(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-[32px]">
                        <button onClick={() => setIsNoteModalOpen(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                        <button onClick={handleSaveNote} disabled={!noteInput && !generatedNote} className="px-8 py-3 bg-[rgb(var(--ios-primary))] hover:brightness-110 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95">Save Record</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </>
  );
};

export default PatientDetail;
