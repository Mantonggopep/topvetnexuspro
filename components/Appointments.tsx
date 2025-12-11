import React, { useState } from 'react';
import { Appointment, AppointmentStatus, Pet, Owner } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Filter, 
  Plus, 
  Search, 
  CalendarCheck, 
  Stethoscope, 
  ChevronRight,
  MapPin,
  PawPrint,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import SegmentedControl from './SegmentedControl';

interface AppointmentsProps {
  appointments: Appointment[];
  pets: Pet[];
  owners: Owner[];
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'tenantId'>) => void;
}

const Appointments: React.FC<AppointmentsProps> = ({ appointments, pets, owners, onAddAppointment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientMode, setClientMode] = useState('Registered Client');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    ownerId: '',
    walkInName: '',
    petId: '',
    reason: '',
    doctorName: '' 
  });
  
  const [ownerSearch, setOwnerSearch] = useState('');
  
  const filteredOwners = owners.filter(o => 
    o.name.toLowerCase().includes(ownerSearch.toLowerCase()) || 
    o.phone.includes(ownerSearch)
  );

  const selectedOwner = owners.find(o => o.id === formData.ownerId);
  const ownerPets = pets.filter(p => p.ownerId === formData.ownerId);
  const isWalkIn = clientMode === 'Walk-in Guest';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWalkIn && !formData.ownerId) return;
    if (isWalkIn && !formData.walkInName) return;

    const dateTime = new Date(`${formData.date}T${formData.time}`);
    
    onAddAppointment({
      ownerId: isWalkIn ? null : formData.ownerId,
      walkInName: isWalkIn ? formData.walkInName : undefined,
      petId: isWalkIn ? undefined : (formData.petId || undefined),
      date: dateTime.toISOString(),
      reason: formData.reason,
      status: AppointmentStatus.Scheduled,
      doctorName: formData.doctorName || 'Unassigned'
    });

    setIsModalOpen(false);
    setFormData(prev => ({ 
      ...prev, 
      ownerId: '', 
      petId: '', 
      reason: '', 
      walkInName: '',
      doctorName: '' 
    }));
    setOwnerSearch('');
  };

  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

  const getAppointmentsForHour = (hour: number) => {
    return appointments.filter(apt => {
        const d = new Date(apt.date);
        return d.getHours() === hour;
    });
  };

  const getCardStyles = (status: AppointmentStatus, isGuest: boolean) => {
    if (isGuest) {
        return {
            card: 'bg-gradient-to-br from-amber-50/50 to-teal-50/30 border-amber-200/80 shadow-sm hover:shadow-md',
            text: 'text-amber-950',
            icon: 'text-amber-600',
            tag: 'bg-white text-amber-700 border border-amber-200',
            border: 'border-l-[3px] border-l-amber-500',
            statusColor: 'text-amber-600'
        };
    }

    switch (status) {
      case AppointmentStatus.CheckedIn:
        return {
            card: 'bg-gradient-to-br from-teal-50 to-amber-50/40 border-teal-200 shadow-sm hover:shadow-md',
            text: 'text-teal-900',
            icon: 'text-teal-600',
            tag: 'bg-white text-teal-700 border border-teal-200',
            border: 'border-l-[3px] border-l-teal-500',
            statusColor: 'text-teal-700'
        };
      case AppointmentStatus.Cancelled:
        return {
            card: 'bg-slate-50 border-slate-200 opacity-70 grayscale',
            text: 'text-slate-500',
            icon: 'text-slate-400',
            tag: 'bg-slate-100 text-slate-400 border border-slate-200',
            border: 'border-l-[3px] border-l-slate-400',
            statusColor: 'text-slate-400'
        };
      default: // Scheduled
        return {
            card: 'bg-white border-teal-100/80 shadow-sm hover:shadow-md',
            text: 'text-slate-800',
            icon: 'text-teal-500',
            tag: 'bg-teal-50 text-teal-700 border border-teal-100',
            border: 'border-l-[3px] border-l-teal-400',
            statusColor: 'text-teal-600'
        };
    }
  };

  return (
    <div className="bg-[#F8FAFC] h-full flex flex-col rounded-xl md:rounded-3xl overflow-hidden font-sans border border-slate-300 shadow-xl relative">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-400/5 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

      {/* Header */}
      <div className="px-4 py-4 md:px-6 md:py-5 border-b border-slate-300 flex flex-col md:flex-row justify-between items-start md:items-center bg-white/80 backdrop-blur-xl sticky top-0 z-30 gap-4">
        <div className="flex flex-col">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center flex-wrap gap-2">
                Schedule
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-teal-50 to-teal-100 text-teal-800 text-[10px] md:text-xs font-bold uppercase tracking-wider border border-teal-200">
                    Today
                </span>
            </h2>
            <div className="flex items-center space-x-2 mt-1">
               <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
               <span className="text-slate-600 text-xs md:text-sm font-semibold">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
               </span>
            </div>
        </div>
        <div className="flex w-full md:w-auto space-x-3">
            <button className="flex-1 md:flex-none justify-center px-4 py-2 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-teal-700 rounded-xl border border-slate-300 shadow-sm transition-all duration-200 flex items-center group active:scale-95">
                <Filter className="w-4 h-4 mr-2 text-slate-400 group-hover:text-teal-500" /> 
                Filter
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex-1 md:flex-none justify-center px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 rounded-xl shadow-lg shadow-teal-700/20 hover:shadow-teal-700/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center border-t border-white/20"
            >
                <Plus className="w-4 h-4 mr-2" /> 
                Add Visit
            </button>
        </div>
      </div>

      {/* Calendar Grid - Responsive Overflow */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-white/40">
        <div className="min-w-[350px]"> {/* Ensures min width on super small phones */}
            <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] divide-x divide-slate-300">
                {hours.map(hour => (
                    <React.Fragment key={hour}>
                        {/* Time Column */}
                        <div className="py-4 md:py-6 pr-2 md:pr-4 text-right relative bg-slate-50/50">
                            <span className="text-xs md:text-sm font-bold text-slate-500 font-mono sticky top-24 block">{hour}:00</span>
                        </div>
                        
                        {/* Event Column */}
                        <div className="py-2 px-2 md:px-3 min-h-[120px] md:min-h-[140px] border-b border-slate-300 relative group transition-colors duration-300 hover:bg-white/80">
                            {/* Grid Lines */}
                            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-300/70 pointer-events-none"></div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 h-full relative z-10">
                                {getAppointmentsForHour(hour).map(apt => {
                                    const pet = pets.find(p => p.id === apt.petId);
                                    const owner = owners.find(o => o.id === apt.ownerId);
                                    const isGuest = !!apt.walkInName;
                                    const displayName = pet ? pet.name : (apt.walkInName || 'Walk-in');
                                    const styles = getCardStyles(apt.status, isGuest);

                                    return (
                                        <div 
                                          key={apt.id} 
                                          className={`
                                            relative p-3 md:p-4 rounded-xl border transition-all duration-300 cursor-pointer
                                            flex flex-col justify-between group/card
                                            ${styles.card} ${styles.border} ${styles.text}
                                          `}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="font-bold text-sm md:text-base truncate">{displayName}</span>
                                                    <div className="flex items-center text-[10px] md:text-xs font-semibold opacity-80 mt-1 uppercase tracking-tight truncate">
                                                        {isGuest ? <MapPin className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                                                        {owner ? owner.name : (apt.walkInName || 'Guest')}
                                                    </div>
                                                </div>
                                                {apt.status === AppointmentStatus.CheckedIn && (
                                                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 ml-2" />
                                                )}
                                            </div>
                                            
                                            <div>
                                                <div className={`flex items-center text-[10px] md:text-xs font-bold mb-3 px-2 py-1 rounded-md w-fit backdrop-blur-md ${styles.tag}`}>
                                                  <Stethoscope className={`w-3 h-3 mr-1.5 ${styles.icon}`} />
                                                  <span className="truncate max-w-[100px] md:max-w-[120px]">{apt.reason}</span>
                                                </div>
                                                
                                                <div className="pt-2 border-t border-black/5 flex justify-between items-center">
                                                    <div className="flex items-center">
                                                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold mr-2 text-slate-500 ring-1 ring-slate-200">
                                                        Dr
                                                      </div>
                                                      <span className="text-[10px] md:text-xs font-semibold opacity-80 truncate max-w-[80px] text-slate-600">
                                                        {apt.doctorName || 'Assigned'}
                                                      </span>
                                                    </div>
                                                    <span className={`text-[9px] md:text-[10px] uppercase tracking-widest font-extrabold ${styles.statusColor}`}>
                                                      {apt.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-500">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-[scaleUp_0.3s_ease-out_forwards] ring-1 ring-white/20">
                  {/* ... Modal content kept largely same, it's already responsive enough via grid-cols-2 to grid-cols-1 ... */}
                  <div className="px-6 py-5 md:px-8 md:py-6 bg-gradient-to-r from-teal-700 via-teal-600 to-amber-500 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative z-10 flex justify-between items-center text-white">
                        <div>
                            <h3 className="text-lg md:text-xl font-bold flex items-center drop-shadow-sm">New Appointment</h3>
                            <p className="text-teal-50 text-xs font-medium mt-1 opacity-90">Enter details below</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-colors text-white shadow-sm">✕</button>
                      </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6 bg-white">
                      <div className="bg-slate-100 p-1.5 rounded-xl">
                           <SegmentedControl options={['Registered Client', 'Walk-in Guest']} value={clientMode} onChange={setClientMode} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 md:gap-6">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Date</label>
                              <input type="date" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Time</label>
                              <input type="time" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                          </div>
                      </div>

                      {/* ... rest of the form logic is responsive ... */}
                      {isWalkIn ? (
                           <div className="animate-[slideDown_0.2s_ease-out]">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Guest Name</label>
                              <div className="relative">
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input type="text" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400" placeholder="Enter guest full name" value={formData.walkInName} onChange={e => setFormData({...formData, walkInName: e.target.value})} />
                              </div>
                          </div>
                      ) : (
                          <div className="relative animate-[slideDown_0.2s_ease-out]">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Client Search</label>
                              {formData.ownerId ? (
                                  <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-100 rounded-xl group transition-colors">
                                      <div className="flex items-center overflow-hidden">
                                          <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm mr-3 shadow-md shadow-teal-200">{selectedOwner?.name.charAt(0)}</div>
                                          <div className="flex flex-col truncate">
                                            <span className="text-sm font-bold text-slate-900 truncate">{selectedOwner?.name}</span>
                                            <span className="text-xs text-teal-600/80 font-medium">Registered Client</span>
                                          </div>
                                      </div>
                                      <button type="button" onClick={() => setFormData({...formData, ownerId: '', petId: ''})} className="text-xs font-bold text-teal-600 bg-white px-3 py-1.5 rounded-lg border border-teal-100 ml-2">Change</button>
                                  </div>
                              ) : (
                                  <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input type="text" placeholder="Search owner by name..." className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-teal-500 outline-none" value={ownerSearch} onChange={e => setOwnerSearch(e.target.value)} />
                                    {ownerSearch && (
                                        <div className="absolute z-50 w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl mt-2 max-h-48 overflow-y-auto custom-scrollbar">
                                            {filteredOwners.map(owner => (
                                                <div key={owner.id} className="p-3 hover:bg-teal-50 cursor-pointer text-sm flex justify-between items-center border-b border-slate-100 last:border-0" onClick={() => { setFormData({...formData, ownerId: owner.id}); setOwnerSearch(''); }}>
                                                    <div className="flex items-center"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs mr-3">{owner.name.charAt(0)}</div><div className="font-bold text-slate-700">{owner.name}</div></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                  </div>
                              )}
                          </div>
                      )}

                      {!isWalkIn && formData.ownerId && (
                          <div className="animate-[fadeIn_0.3s_ease-out]">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Select Patient</label>
                              <div className="relative">
                                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none text-slate-700 appearance-none" value={formData.petId} onChange={e => setFormData({...formData, petId: e.target.value})}>
                                      <option value="">No specific patient / TBD</option>
                                      {ownerPets.map(pet => <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>)}
                                  </select>
                                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                              </div>
                          </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Reason</label>
                            <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Vaccination" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Provider</label>
                            <div className="relative">
                                <input type="text" className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500" placeholder="Enter doctor name" value={formData.doctorName} onChange={e => setFormData({...formData, doctorName: e.target.value})} />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4" /></div>
                            </div>
                        </div>
                      </div>

                      <div className="pt-2">
                          <button type="submit" disabled={!isWalkIn && !formData.ownerId} className="w-full bg-gradient-to-r from-teal-600 to-amber-500 hover:from-teal-700 hover:to-amber-600 text-white py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 transition-all flex justify-center items-center">
                              <CalendarCheck className="w-5 h-5 mr-2" /> Confirm Schedule
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      
      <style>{`
        @keyframes scaleUp { from { transform: scale(0.95) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(203, 213, 225, 0.6); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Appointments;
