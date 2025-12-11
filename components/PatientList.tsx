import React, { useState, useEffect } from 'react';
import { Pet, Owner, Species, MedicalNote } from '../types'; 
import { Search, Filter, ChevronRight, Plus, Stethoscope, User, AlertCircle, Activity } from 'lucide-react';
import { PatientService, OwnerService } from '../services/api'; 

const PatientList: React.FC<{ pets: Pet[]; owners: Owner[]; onSelectPatient: (id: string) => void; onAddPatient: (petData: any) => Promise<void>; }> = ({ pets, owners, onSelectPatient, onAddPatient }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<string>('All');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [formData, setFormData] = useState({
      name: '',
      species: Species.Dog,
      breed: '',
      age: '',
      gender: 'Male',
      type: 'Single',
      color: '',
      initialWeight: '',
      allergies: '',
      medicalConditions: ''
  });

  const handleSelectPatient = (id: string) => {
    onSelectPatient(id);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedOwner || !formData.name) return;

      const newPetPayload = {
          tenantId: selectedOwner.tenantId || 'system', 
          name: formData.name,
          species: formData.species as Species,
          breed: formData.breed,
          age: Number(formData.age),
          gender: formData.gender as 'Male' | 'Female',
          ownerId: selectedOwner.id,
          type: formData.type as 'Single' | 'Herd',
          color: formData.color,
          allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
          medicalConditions: formData.medicalConditions ? formData.medicalConditions.split(',').map(s => s.trim()) : [],
          imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200',
          initialWeight: formData.initialWeight ? Number(formData.initialWeight) : 0
      };

      try {
        await onAddPatient(newPetPayload);
        handleCloseModal();
      } catch (error) {
        console.error("Failed to save patient", error);
        alert("Failed to create patient. Please check your connection.");
      }
  };

  const handleCloseModal = () => {
      setIsAddModalOpen(false);
      setSelectedOwner(null);
      setOwnerSearch('');
      setFormData({
        name: '', species: Species.Dog, breed: '', age: '', gender: 'Male',
        type: 'Single', color: '', initialWeight: '', allergies: '', medicalConditions: ''
      });
  };

  const filteredPets = pets.filter(pet => {
    const owner = owners.find(o => o.id === pet.ownerId);
    const matchesSearch = 
        pet.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        owner?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSpecies === 'All' || pet.species === filterSpecies;
    return matchesSearch && matchesFilter;
  });

  const filteredOwners = owners.filter(o => 
      o.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
      o.phone?.includes(ownerSearch) ||
      o.clientNumber?.toLowerCase().includes(ownerSearch.toLowerCase())
  );

  return (
    <>
      <style>{`
        :root { --ios-primary: 0, 122, 255; --ios-bg: 242, 242, 247; --ios-card: 255, 255, 255; }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className={`bg-white/80 backdrop-blur-xl md:rounded-[32px] rounded-xl shadow-2xl border border-white/60 overflow-hidden flex flex-col h-full animate-fade-in-up font-sans transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* Header & Controls - Stack on mobile */}
        <div className="p-4 md:p-6 border-b border-slate-100/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex flex-col w-full md:w-auto">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Patient Registry</h2>
            <span className="text-xs font-medium text-slate-500 mt-0.5">{filteredPets.length} Active Records</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[rgb(var(--ios-primary))] transition-colors" />
                  <input 
                      type="text" 
                      placeholder="Search..." 
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ios-primary))] transition-all shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 md:flex-none">
                    <select 
                        className="w-full appearance-none bg-white/80 border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ios-primary))] shadow-sm"
                        value={filterSpecies}
                        onChange={(e) => setFilterSpecies(e.target.value)}
                    >
                        <option value="All">All Species</option>
                        {Object.values(Species).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[rgb(var(--ios-primary))] hover:brightness-110 text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center transition-all shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4 mr-2 stroke-[3]" /> Add
                </button>
              </div>
          </div>
        </div>

        {/* List Content - Horizontal Scroll on Mobile */}
        <div className="flex-1 overflow-y-auto p-0 md:p-4 bg-gradient-to-b from-slate-50 to-white">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
                  <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur">
                      <tr>
                          <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-20">Patient Identity</th>
                          <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Medical Profile</th>
                          <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client Details</th>
                          <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                      {filteredPets.map((pet, idx) => {
                          const owner = owners.find(o => o.id === pet.ownerId);
                          return (
                              <tr 
                                  key={pet.id} 
                                  onClick={() => handleSelectPatient(pet.id)}
                                  className="hover:bg-blue-50/30 cursor-pointer transition-all duration-300 group animate-fade-in-up"
                                  style={{animationDelay: `${idx * 40}ms`}}
                              >
                                  <td className="py-4 px-6 rounded-l-2xl">
                                      <div className="flex items-center space-x-4">
                                          <div className="relative">
                                              <img src={pet.imageUrl || 'https://via.placeholder.com/150'} alt={pet.name} className="w-14 h-14 rounded-2xl object-cover bg-slate-100 shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow" />
                                              {pet.type === 'Herd' && (
                                                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                                                      <Activity className="w-3 h-3 text-white" />
                                                  </span>
                                              )}
                                          </div>
                                          <div>
                                              <p className="font-bold text-slate-900 text-base group-hover:text-[rgb(var(--ios-primary))] transition-colors">{pet.name}</p>
                                              <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md tracking-wide">{pet.species}</span>
                                                <span className="text-xs text-slate-400 font-medium">• {pet.gender}</span>
                                              </div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="py-4 px-6">
                                      <div className="flex flex-col">
                                          <span className="text-sm font-semibold text-slate-700">{pet.breed}</span>
                                          <span className="text-xs text-slate-500">{pet.age} Years • {pet.color}</span>
                                      </div>
                                  </td>
                                  <td className="py-4 px-6">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                              <User className="w-4 h-4" />
                                          </div>
                                          <div>
                                              <span className="block text-sm font-bold text-slate-800">{owner?.name || 'Unknown'}</span>
                                              <span className="block text-[11px] text-slate-500 font-mono tracking-wide">{owner?.phone}</span>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="py-4 px-6">
                                      <span className="text-sm text-slate-600">
                                          {pet.notes && pet.notes.length > 0 ? (
                                              <span className="flex items-center text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg font-bold w-fit border border-emerald-100/50">
                                                  Last Visit: {new Date(pet.notes[pet.notes.length - 1].date).toLocaleDateString()}
                                              </span>
                                          ) : (
                                              <span className="flex items-center text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded-lg font-bold w-fit border border-orange-100/50">
                                                  <AlertCircle className="w-3 h-3 mr-1" /> New Record
                                              </span>
                                          )}
                                      </span>
                                  </td>
                                  <td className="py-4 px-6 text-right rounded-r-2xl pr-8">
                                      <div className="flex justify-end items-center space-x-3">
                                          <button 
                                              className="text-[rgb(var(--ios-primary))] bg-blue-50 hover:bg-[rgb(var(--ios-primary))] hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center transition-all shadow-sm active:scale-95"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleSelectPatient(pet.id);
                                              }}
                                          >
                                              <Stethoscope className="w-4 h-4 mr-1.5" /> Consult
                                          </button>
                                          <div className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-300 group-hover:text-[rgb(var(--ios-primary))]">
                                              <ChevronRight className="w-5 h-5" />
                                          </div>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
          
          {filteredPets.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                  <div className={`w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner`}>
                      <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">No Patients Found</h3>
                  <p className="text-sm mt-1 max-w-xs mx-auto text-slate-400">Add a new patient or adjust your search filters.</p>
              </div>
          )}
        </div>

        {/* Add Patient Modal */}
        {isAddModalOpen && (
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
                <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in border border-white/50">
                    <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                        <h3 className="font-bold text-lg md:text-xl text-slate-900 flex items-center">
                            <Plus className="w-5 h-5 md:w-6 md:h-6 mr-2 text-[rgb(var(--ios-primary))]" />
                            Add New Patient
                        </h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500">✕</button>
                    </div>
                    
                    <form onSubmit={handleSavePatient} className="p-4 md:p-8 space-y-6 md:space-y-8">
                        {/* Step 1: Owner Selection */}
                        <div className="space-y-4 p-4 md:p-6 bg-slate-50/80 rounded-3xl border border-slate-100">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">1. Select Client (Owner)</label>
                            
                            {owners.length === 0 && !selectedOwner && (
                                <div className="p-3 bg-yellow-50 text-yellow-700 text-xs rounded-xl mb-2 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    No clients in database.
                                </div>
                            )}

                            {selectedOwner ? (
                                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-green-100 shadow-sm animate-scale-in">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold mr-4 shadow-sm shrink-0">
                                            <User className="w-5 h-5"/>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-slate-800 truncate">{selectedOwner.name}</p>
                                            <p className="text-xs text-slate-500 font-medium">{selectedOwner.phone}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setSelectedOwner(null)} className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Change</button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[rgb(var(--ios-primary))] text-sm shadow-sm transition-all focus:border-transparent"
                                        placeholder="Search client by name or phone..."
                                        value={ownerSearch}
                                        onChange={(e) => setOwnerSearch(e.target.value)}
                                        autoFocus
                                    />
                                    {ownerSearch && (
                                        <div className="absolute z-20 w-full bg-white border border-slate-100 mt-2 rounded-2xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                                            {filteredOwners.map(owner => (
                                                <div 
                                                    key={owner.id} 
                                                    className="p-3 px-4 hover:bg-blue-50 cursor-pointer text-sm border-b border-slate-50 last:border-0 transition-colors"
                                                    onClick={() => { setSelectedOwner(owner); setOwnerSearch(''); }}
                                                >
                                                    <div className="font-bold text-slate-800">{owner.name}</div>
                                                    <div className="text-xs text-slate-500">{owner.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step 2: Patient Details */}
                        <div className="space-y-6">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">2. Patient Details</label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 ml-1">Name <span className="text-red-500">*</span></label>
                                    <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-[rgb(var(--ios-primary))] transition-all" 
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Pet Name" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 ml-1">Species</label>
                                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-[rgb(var(--ios-primary))] transition-all"
                                        value={formData.species} onChange={e => setFormData({...formData, species: e.target.value as Species})}>
                                        {Object.values(Species).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            {/* ... kept logic but ensured grid-cols-1 on mobile for inputs ... */}
                            <div className="grid grid-cols-2 gap-4 md:gap-5">
                                {/* Breed/Color */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 ml-1">Breed</label>
                                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 ml-1">Color</label>
                                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                                </div>
                            </div>
                             
                            <div className="grid grid-cols-3 gap-3 md:gap-5">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 ml-1">Age</label>
                                    <input type="number" step="0.1" className="w-full px-3 md:px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 ml-1">Weight</label>
                                    <input type="number" step="0.1" className="w-full px-3 md:px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={formData.initialWeight} onChange={e => setFormData({...formData, initialWeight: e.target.value})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 ml-1">Gender</label>
                                    <select className="w-full px-3 md:px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">Cancel</button>
                            <button type="submit" disabled={!selectedOwner} className="px-8 py-3 bg-[rgb(var(--ios-primary))] hover:brightness-110 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 transition-all">Save Patient</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </>
  );
};

export default PatientList;
