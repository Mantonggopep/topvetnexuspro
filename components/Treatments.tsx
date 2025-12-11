import React, { useState, useEffect, useRef } from 'react';
import { Pet, Appointment, Consultation, Owner, PrescriptionItem, Attachment, LabResult, ClinicSettings, SubscriptionTier, Species, Reminder } from '../types';
import { 
  Stethoscope, Activity, FileText, Plus, Search, ChevronRight, 
  Brain, Sparkles, DollarSign, Calendar, 
  Thermometer, Heart, Wind, Weight,
  Pill, Clock, Printer, Trash2, Eye, ChevronLeft, CreditCard, Banknote, Smartphone, AlertCircle, User, ArrowLeft
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { suggestDiagnosis } from '../services/geminiService';
import { formatCurrency, getCurrencySymbol } from '../utils/uiUtils';
import { useReactToPrint } from 'react-to-print';

interface TreatmentsProps {
  activePatients: Pet[];
  appointments: Appointment[];
  consultations: Consultation[];
  owners: Owner[];
  settings: ClinicSettings;
  plan?: SubscriptionTier;
  onSelectPatient: (id: string) => void;
  onAddConsultation: (consultation: Consultation) => void;
  onAddLabRequest: (result: LabResult) => void;
  onAddPatient: (pet: any) => void;
}

// --- HELPER: Safely parse JSON strings or return arrays ---
const safeArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }
    return [];
};

// --- SUB-COMPONENT: DETAIL VIEW (Responsive) ---
const TreatmentDetail: React.FC<{
    consult: Consultation;
    pet: Pet | undefined;
    owner: Owner | undefined;
    settings: ClinicSettings;
    onBack: () => void;
}> = ({ consult, pet, owner, settings, onBack }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Medical_Receipt_${pet?.name || 'Patient'}_${new Date().toISOString().split('T')[0]}`,
    });

    return (
        <div className="bg-slate-50 h-[calc(100dvh-5rem)] md:h-[calc(100vh-6rem)] flex flex-col md:rounded-3xl overflow-hidden relative border-t md:border border-slate-200">
             <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-30 shadow-sm">
                 <button onClick={onBack} className="text-slate-600 hover:text-slate-900 flex items-center text-xs md:text-sm font-bold transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg">
                     <ChevronLeft className="w-4 h-4 mr-1"/> Back
                 </button>
                 <button onClick={() => handlePrint()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center shadow-lg transition-all active:scale-95">
                     <Printer className="w-4 h-4 mr-2"/> Print Record
                 </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 md:p-8 flex justify-center bg-slate-100">
                <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-4 md:p-12 h-fit">
                    <PrintableContent pet={pet || null} owner={owner || null} consult={consult} settings={settings} />
                </div>
            </div>

            <div style={{ display: 'none' }}>
                <div ref={printRef} className="print-container p-8">
                     <PrintableContent pet={pet || null} owner={owner || null} consult={consult} settings={settings} isPrint={true} />
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const Treatments: React.FC<TreatmentsProps> = ({ activePatients, appointments, consultations, owners, settings, plan, onSelectPatient, onAddConsultation, onAddLabRequest, onAddPatient }) => {
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  
  // Selection State
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [previousConsultation, setPreviousConsultation] = useState<Consultation | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Modal State
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ name: '', species: 'Dog', gender: 'Male', age: '', breed: '' });
  
  // Data State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [labRequests, setLabRequests] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [newRx, setNewRx] = useState({ name: '', dosage: '', frequency: '', duration: '' });

  // Reminder State
  const [createReminder, setCreateReminder] = useState(false);
  const [reminderType, setReminderType] = useState<'Vaccination' | 'Follow-up' | 'Deworming'>('Vaccination');
  const [reminderDuration, setReminderDuration] = useState(365);

  // Form State
  const [formData, setFormData] = useState({
      weightKg: '', temperatureC: '', heartRateBpm: '', respiratoryRate: '',
      chiefComplaint: '', history: '',
      exam: { general: '', respiratory: '', cardiovascular: '', digestive: '', musculoskeletal: '', nervous: '', integumentary: '', eyes: '', ears: '', lymphNodes: '' },
      diagnosis: { tentative: '', differentials: '', confirmatory: '' },
      plan: '',
      serviceFee: '', discount: '', amountPaid: '', paymentMethod: 'Cash' as const
  });

  const ownerOptions = owners.map(o => ({ id: o.id, label: o.name, subLabel: o.phone }));
  const patientOptions = activePatients
    .filter(p => p.ownerId === selectedOwnerId)
    .map(p => ({ id: p.id, label: p.name, subLabel: `${p.species} • ${p.breed}`, image: p.imageUrl }));

  useEffect(() => {
    if (selectedPet) {
        const petConsults = consultations
            .filter(c => c.petId === selectedPet.id && c.status === 'Finalized')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPreviousConsultation(petConsults.length > 0 ? petConsults[0] : null);
    }
  }, [selectedPet, consultations]);

  const handleAddPrescription = () => {
    if (!newRx.name) return;
    const item: PrescriptionItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: newRx.name,
        dosage: newRx.dosage,
        frequency: newRx.frequency,
        duration: newRx.duration
    };
    setPrescriptions([...prescriptions, item]);
    setNewRx({ name: '', dosage: '', frequency: '', duration: '' });
  };

  const removePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const handleAiDiagnose = async () => {
      if (!selectedPet) return;
      setIsAiLoading(true);
      const locationContext = settings.currency === 'NGN' ? 'Nigeria' : (settings.currency === 'GBP' ? 'UK' : 'USA');
      
      const resultJson = await suggestDiagnosis(
          selectedPet.species,
          selectedPet.age + " years",
          `Location: ${locationContext}. Complaint: ${formData.chiefComplaint}. History: ${formData.history}. Exam: ${JSON.stringify(formData.exam)}`,
          previousConsultation ? `Previous condition: ${previousConsultation.diagnosis.tentative}` : "No previous history."
      );
      try {
          const result = JSON.parse(resultJson);
          setFormData(prev => ({
              ...prev,
              diagnosis: {
                  ...prev.diagnosis,
                  tentative: result.tentative || prev.diagnosis.tentative,
                  differentials: result.differentials ? result.differentials.join(', ') : prev.diagnosis.differentials
              },
              plan: result.treatment_suggestion || prev.plan
          }));
      } catch (e) { console.error("Failed to parse AI response"); }
      setIsAiLoading(false);
  };

  const handleCreateConsultation = (status: 'Draft' | 'Finalized') => {
      if (!selectedPet) return;
      
      const fee = parseFloat(String(formData.serviceFee || 0));
      const discount = parseFloat(String(formData.discount || 0));
      const amountPaid = parseFloat(String(formData.amountPaid || 0));
      
      const total = Math.max(0, fee - discount);
      const balance = Math.max(0, total - amountPaid);
      
      let paymentStatus: 'Paid' | 'Pending' | 'Partially Paid' = 'Pending';
      if (total > 0) {
          if (balance <= 0.01) paymentStatus = 'Paid';
          else if (amountPaid > 0) paymentStatus = 'Partially Paid';
      } else {
          paymentStatus = 'Paid';
      }

      const consultationId = editingId || `c-${Date.now()}`;
      
      let reminderObj: Reminder | undefined = undefined;
      if (createReminder && status === 'Finalized') {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + reminderDuration);
          reminderObj = {
              id: `rem-${Date.now()}`,
              tenantId: selectedPet.tenantId,
              patientId: selectedPet.id,
              ownerId: selectedPet.ownerId,
              consultationId: consultationId,
              type: reminderType,
              description: reminderType === 'Vaccination' ? 'Annual Vaccination Due' : 'Medical Follow-up',
              dueDate: dueDate.toISOString(),
              status: 'Pending',
              method: 'SMS'
          };
      }

      const newConsult: Consultation = {
          id: consultationId,
          tenantId: selectedPet.tenantId,
          petId: selectedPet.id,
          ownerId: selectedPet.ownerId,
          date: new Date().toISOString(),
          vetName: 'Dr. Active Vet', 
          status: status,
          vitals: {
              date: new Date().toISOString(),
              weightKg: Number(formData.weightKg),
              temperatureC: Number(formData.temperatureC),
              heartRateBpm: Number(formData.heartRateBpm),
              respiratoryRate: Number(formData.respiratoryRate)
          },
          chiefComplaint: formData.chiefComplaint,
          history: formData.history,
          previousTreatmentId: previousConsultation?.id,
          previousDiagnosis: previousConsultation?.diagnosis.tentative,
          exam: formData.exam,
          diagnosis: {
              tentative: formData.diagnosis.tentative,
              differentials: typeof formData.diagnosis.differentials === 'string' ? (formData.diagnosis.differentials as string).split(',') : [],
              confirmatory: formData.diagnosis.confirmatory
          },
          plan: formData.plan,
          labRequests: labRequests,
          prescription: prescriptions,
          attachments: attachments,
          reminder: reminderObj,
          financials: {
              serviceFee: fee,
              discount: discount,
              total: total,
              amountPaid: amountPaid,
              paymentMethod: formData.paymentMethod,
              paymentStatus: paymentStatus,
              invoiceId: status === 'Finalized' ? `${settings.invoicePrefix}${Date.now().toString().slice(-6)}` : undefined,
              receiptId: undefined
          }
      };

      onAddConsultation(newConsult);
      resetForm();
      setView('list');
  };

  const handleQuickAddPatient = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPatientForm.name || !selectedOwnerId) return;
      onAddPatient({
          name: newPatientForm.name,
          species: newPatientForm.species as Species,
          breed: newPatientForm.breed,
          age: Number(newPatientForm.age) || 0,
          gender: newPatientForm.gender as 'Male' | 'Female',
          ownerId: selectedOwnerId,
          type: 'Single',
          color: 'Unknown',
          allergies: [],
          medicalConditions: []
      });
      setIsAddPatientModalOpen(false);
      setNewPatientForm({ name: '', species: 'Dog', gender: 'Male', age: '', breed: '' });
  };

  const resetForm = () => {
      setFormData({
          weightKg: '', temperatureC: '', heartRateBpm: '', respiratoryRate: '', chiefComplaint: '', history: '',
          exam: { general: '', respiratory: '', cardiovascular: '', digestive: '', musculoskeletal: '', nervous: '', integumentary: '', eyes: '', ears: '', lymphNodes: '' },
          diagnosis: { tentative: '', differentials: '', confirmatory: '' }, plan: '', 
          serviceFee: '', discount: '', amountPaid: '', paymentMethod: 'Cash'
      });
      setLabRequests([]);
      setPrescriptions([]);
      setCreateReminder(false);
      setSelectedPet(null);
      setSelectedOwnerId('');
      setEditingId(null);
  };

  const handleViewDetail = (consult: Consultation) => {
      setSelectedConsultation(consult);
      const pet = activePatients.find(p => p.id === consult.petId);
      if(pet) setSelectedPet(pet);
      setView('detail');
  };

  const currentServiceFee = parseFloat(String(formData.serviceFee || 0));
  const currentDiscount = parseFloat(String(formData.discount || 0));
  const currentAmountPaid = parseFloat(String(formData.amountPaid || 0));
  const currentTotal = Math.max(0, currentServiceFee - currentDiscount);
  const currentBalance = Math.max(0, currentTotal - currentAmountPaid);

  // --- RENDER ---

  if (view === 'detail' && selectedConsultation) {
      const pet = activePatients.find(p => p.id === selectedConsultation!.petId);
      const owner = owners.find(o => o.id === selectedConsultation!.ownerId);
      return <TreatmentDetail consult={selectedConsultation} pet={pet} owner={owner} settings={settings} onBack={() => setView('list')} />;
  }

  // LIST VIEW (Mobile Optimized)
  if (view === 'list') {
      return (
          <div className="bg-white md:bg-slate-50 md:rounded-3xl h-[calc(100dvh-5rem)] md:h-[calc(100vh-6rem)] flex flex-col font-sans overflow-hidden border border-slate-200 shadow-xl">
              <div className="px-4 py-3 md:px-6 md:py-5 border-b border-slate-200 bg-white sticky top-0 z-20 flex justify-between items-center shrink-0">
                  <div className="flex flex-col">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center">
                        <Stethoscope className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-600" /> 
                        Records
                    </h2>
                    <p className="text-xs text-slate-500 font-medium hidden md:block mt-0.5">Manage consultations & billing</p>
                  </div>
                  <button 
                    onClick={() => { resetForm(); setView('new'); }} 
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                      <Plus className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Start New Consultation</span> <span className="md:hidden">New</span>
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 bg-slate-50 md:bg-slate-100/50 pb-20 md:pb-0">
                  <div className="grid grid-cols-1 gap-3">
                      {consultations.map(consult => {
                          const pet = activePatients.find(p => p.id === consult.petId);
                          return (
                              <div key={consult.id} onClick={() => handleViewDetail(consult)} className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.99] transition-all duration-300 flex items-center justify-between cursor-pointer">
                                  <div className="flex items-center space-x-3 md:space-x-5">
                                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base md:text-lg border-2 border-slate-200 group-hover:border-blue-500 group-hover:text-blue-600 transition-colors shrink-0">
                                          {pet?.name.charAt(0)}
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-slate-800 text-sm md:text-base group-hover:text-blue-700 transition-colors">{pet?.name || 'Unknown'}</h3>
                                          <div className="flex items-center text-xs text-slate-500 mt-1 space-x-2 md:space-x-3">
                                              <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{new Date(consult.date).toLocaleDateString()}</span>
                                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                              <span className="truncate max-w-[80px] md:max-w-none">{consult.vetName}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex items-center space-x-2 md:space-x-6">
                                      {consult.financials && (
                                          <div className="text-right block">
                                              <p className={`text-xs md:text-sm font-bold ${consult.financials.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                  {consult.financials.paymentStatus}
                                              </p>
                                              <p className="text-[10px] md:text-xs text-slate-400 font-mono">
                                                  {formatCurrency(consult.financials.total, settings.currency)}
                                              </p>
                                          </div>
                                      )}
                                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  // 3. NEW CONSULTATION VIEW (Fully Responsive)
  return (
      <div className="flex flex-col md:flex-row h-[calc(100dvh-5rem)] md:h-[calc(100vh-6rem)] gap-4 bg-[#F1F5F9] md:rounded-3xl overflow-hidden md:p-2 font-sans">
          
          {/* MOBILE: HEADER NAV */}
          <div className="md:hidden bg-white p-3 border-b border-slate-200 flex justify-between items-center sticky top-0 z-40 shrink-0">
               <button onClick={() => setView('list')} className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <ArrowLeft className="w-5 h-5" />
               </button>
               <h3 className="font-bold text-slate-800">New Consultation</h3>
               <button onClick={() => handleCreateConsultation('Finalized')} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md">
                   Save
               </button>
          </div>

          {/* SIDEBAR (Stacked on Mobile) */}
          <div className="w-full md:w-80 flex flex-col space-y-4 shrink-0">
              <div className="bg-white p-4 md:p-5 rounded-none md:rounded-3xl shadow-sm border-b md:border border-slate-200 flex flex-col">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 md:mb-4 flex items-center">
                      <User className="w-3 h-3 mr-2"/> Patient Selection
                  </h3>
                  <div className="space-y-3 md:space-y-4">
                      <SearchableSelect 
                          label="Client"
                          options={ownerOptions}
                          value={selectedOwnerId}
                          onChange={setSelectedOwnerId}
                          placeholder="Find Owner..."
                      />
                      {selectedOwnerId && (
                          <div className="animate-[slideDown_0.3s_ease-out]">
                              <SearchableSelect 
                                  label="Patient"
                                  options={patientOptions}
                                  value={selectedPet?.id || ''}
                                  onChange={(val) => setSelectedPet(activePatients.find(p => p.id === val) || null)}
                                  placeholder="Select Patient..."
                              />
                              <button onClick={() => setIsAddPatientModalOpen(true)} className="mt-3 w-full py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
                                  <Plus className="w-3 h-3 mr-1"/> New Patient
                              </button>
                          </div>
                      )}
                  </div>

                  {selectedPet && (
                      <div className="mt-4 md:mt-8 flex-1 flex flex-col animate-[fadeIn_0.5s_ease-out]">
                          <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-lg mb-4 md:mb-6 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-20 -translate-y-10 translate-x-10"></div>
                              <div className="flex items-center space-x-3 relative z-10">
                                  <img src={selectedPet.imageUrl || `https://ui-avatars.com/api/?name=${selectedPet.name}`} className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-800 border-2 border-slate-700 object-cover" />
                                  <div>
                                      <h3 className="font-bold text-base md:text-lg leading-tight">{selectedPet.name}</h3>
                                      <p className="text-slate-400 text-[10px] md:text-xs font-medium">{selectedPet.species} • {selectedPet.breed}</p>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar">
                              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Last Visit</h4>
                              {previousConsultation ? (
                                  <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
                                      <div className="relative group cursor-pointer">
                                          <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white"></div>
                                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 group-hover:bg-blue-50 transition-colors">
                                              <div className="flex justify-between text-xs text-slate-500 font-bold mb-1">
                                                  <span>{new Date(previousConsultation.date).toLocaleDateString()}</span>
                                              </div>
                                              <p className="font-bold text-slate-800 text-sm mb-1">{previousConsultation.diagnosis.tentative}</p>
                                              <p className="text-xs text-slate-500 line-clamp-2">{previousConsultation.history}</p>
                                              <button 
                                                onClick={() => setFormData(prev => ({...prev, history: `[History from ${new Date(previousConsultation.date).toLocaleDateString()}]: ${previousConsultation.history}\n\n` + prev.history }))}
                                                className="text-[10px] text-blue-600 font-bold mt-2 uppercase hover:underline"
                                              >
                                                  Use History
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ) : <p className="text-xs text-slate-400 italic text-center mt-10 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">No previous history found.</p>}
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {/* MAIN FORM AREA */}
          <div className="flex-1 bg-white md:rounded-3xl shadow-sm border-x border-b md:border border-slate-200 flex flex-col overflow-hidden">
              {/* Desktop Header (Hidden on Mobile) */}
              <div className="hidden md:flex px-8 py-4 border-b border-slate-100 justify-between items-center bg-white sticky top-0 z-20">
                  <div className="flex items-center">
                      <button onClick={() => setView('list')} className="mr-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
                          <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-bold text-slate-900">New Consultation</h2>
                  </div>
                  <div className="flex space-x-3">
                      <button onClick={() => handleCreateConsultation('Draft')} className="px-5 py-2 text-slate-600 hover:bg-slate-50 rounded-xl font-bold border border-slate-300 text-sm transition-all">Draft</button>
                      <button onClick={() => handleCreateConsultation('Finalized')} className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-600/20 text-sm transform active:scale-95 transition-all">
                         Finalize
                      </button>
                  </div>
              </div>

              {/* SCROLLABLE FORM CONTENT */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-6 md:space-y-8 bg-slate-50/50 pb-24 md:pb-8">
                  
                  {/* 1. VITALS */}
                  <section className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
                      <h3 className="text-xs font-extrabold text-cyan-700 uppercase tracking-widest mb-4 flex items-center">
                          <Activity className="w-4 h-4 mr-2"/> Clinical Vitals
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                          {[
                              { key: 'weightKg', label: 'Weight', unit: 'kg', icon: Weight },
                              { key: 'temperatureC', label: 'Temp', unit: '°C', icon: Thermometer },
                              { key: 'heartRateBpm', label: 'Heart Rate', unit: 'bpm', icon: Heart },
                              { key: 'respiratoryRate', label: 'Resp. Rate', unit: 'rpm', icon: Wind }
                          ].map((item) => (
                              <div key={item.key} className="relative p-3 md:p-4 flex flex-col items-center bg-cyan-50/50 rounded-xl border border-cyan-100">
                                  <label className="text-[10px] font-bold text-cyan-900 uppercase tracking-wider mb-1">{item.label}</label>
                                  <div className="relative w-full">
                                      <input 
                                          type="number" 
                                          className="w-full bg-white border border-cyan-200 rounded-lg text-center py-2 text-base md:text-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow placeholder:text-slate-300"
                                          placeholder="0"
                                          value={(formData as any)[item.key]}
                                          onChange={e => setFormData({...formData, [item.key]: e.target.value})}
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">{item.unit}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </section>

                  {/* 2. HISTORY */}
                  <section className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
                        <h3 className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest mb-4 flex items-center">
                            <FileText className="w-4 h-4 mr-2"/> History & Exam
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Chief Complaint</label>
                                <textarea 
                                    className="w-full p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl text-sm font-medium text-slate-800 outline-none" 
                                    rows={2}
                                    placeholder="Reason for visit..." 
                                    value={formData.chiefComplaint} 
                                    onChange={e => setFormData({...formData, chiefComplaint: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Detailed History</label>
                                <textarea 
                                    className="w-full p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl text-sm font-medium text-slate-800 outline-none" 
                                    rows={4}
                                    placeholder="Patient history..." 
                                    value={formData.history} 
                                    onChange={e => setFormData({...formData, history: e.target.value})} 
                                />
                            </div>
                        </div>
                  </section>

                  {/* 3. DIAGNOSIS (AI) */}
                  <section className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-5 border-b border-purple-100 pb-2">
                          <h3 className="text-xs font-extrabold text-purple-700 uppercase tracking-widest flex items-center">
                              <Brain className="w-4 h-4 mr-2"/> Diagnosis
                          </h3>
                          <button 
                              onClick={handleAiDiagnose} 
                              disabled={isAiLoading || !formData.chiefComplaint}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-md active:scale-95 disabled:opacity-50"
                          >
                              {isAiLoading ? 'Thinking...' : 'AI Suggest'}
                          </button>
                      </div>
                      <div className="space-y-4 relative z-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1 block">Tentative</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-3 bg-purple-50/20 border border-purple-200 rounded-xl text-sm font-bold text-slate-800 outline-none" 
                                    placeholder="e.g. Parvovirus" 
                                    value={formData.diagnosis.tentative} 
                                    onChange={e => setFormData({...formData, diagnosis: { ...formData.diagnosis, tentative: e.target.value }})} 
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1 block">Treatment Plan</label>
                                  <textarea 
                                      className="w-full p-3 bg-purple-50/20 border border-purple-200 rounded-xl text-sm font-medium text-slate-800 h-24 outline-none resize-none" 
                                      placeholder="Treatment steps..." 
                                      value={formData.plan} 
                                      onChange={e => setFormData({...formData, plan: e.target.value})} 
                                  />
                              </div>
                          </div>
                      </div>
                  </section>

                  {/* 4. FINANCIALS */}
                  <section className="bg-white rounded-2xl p-4 md:p-6 shadow-md shadow-slate-200/50 border border-emerald-100">
                      <h3 className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest mb-5 flex items-center">
                          <DollarSign className="w-4 h-4 mr-2"/> Billing
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-4">
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fee</label>
                                  <input type="number" className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm font-bold" value={formData.serviceFee} onChange={e => setFormData({...formData, serviceFee: e.target.value})} placeholder="0.00"/>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                  <label className="block text-[10px] font-bold text-rose-500 uppercase mb-1">Discount</label>
                                  <input type="number" className="w-full p-2 bg-white border border-rose-200 rounded-lg text-sm font-bold text-rose-600" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} placeholder="0.00"/>
                              </div>
                          </div>

                          <div className="bg-slate-900 p-6 rounded-xl flex flex-col justify-center items-end shadow-xl text-right">
                              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Balance Due</p>
                              <span className="text-3xl font-mono font-bold text-white block">
                                  {formatCurrency(currentBalance, settings.currency)}
                              </span>
                          </div>
                      </div>
                  </section>
                  
                  {/* 5. PRESCRIPTION & REMINDERS (Stacked on Mobile) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <section className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
                          <h3 className="text-xs font-extrabold text-rose-600 uppercase tracking-widest mb-4 flex items-center">
                              <Pill className="w-4 h-4 mr-2"/> Prescription
                          </h3>
                          <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 mb-4 space-y-2">
                              <input type="text" placeholder="Drug Name" className="w-full p-2 text-xs border rounded-lg" value={newRx.name} onChange={e => setNewRx({...newRx, name: e.target.value})} />
                              <div className="flex space-x-2">
                                  <input type="text" placeholder="Dose" className="w-1/3 p-2 text-xs border rounded-lg" value={newRx.dosage} onChange={e => setNewRx({...newRx, dosage: e.target.value})} />
                                  <input type="text" placeholder="Freq" className="w-1/3 p-2 text-xs border rounded-lg" value={newRx.frequency} onChange={e => setNewRx({...newRx, frequency: e.target.value})} />
                                  <input type="text" placeholder="Dur." className="w-1/3 p-2 text-xs border rounded-lg" value={newRx.duration} onChange={e => setNewRx({...newRx, duration: e.target.value})} />
                              </div>
                              <button onClick={handleAddPrescription} className="w-full py-2 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-colors shadow-sm">Add</button>
                          </div>
                          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                              {prescriptions.map((rx) => (
                                  <div key={rx.id} className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded-lg shadow-sm text-xs">
                                      <span className="font-bold text-slate-700">{rx.name}</span>
                                      <button onClick={() => removePrescription(rx.id)} className="text-rose-400"><Trash2 className="w-3 h-3"/></button>
                                  </div>
                              ))}
                          </div>
                      </section>
                  </div>
              </div>
          </div>

          {/* Quick Add Patient Modal */}
          {isAddPatientModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-lg text-slate-800">Quick Add Patient</h3>
                          <button onClick={() => setIsAddPatientModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                      </div>
                      <form onSubmit={handleQuickAddPatient} className="space-y-4">
                          <input type="text" placeholder="Patient Name" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newPatientForm.name} onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})} />
                          <div className="grid grid-cols-2 gap-4">
                              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newPatientForm.species} onChange={e => setNewPatientForm({...newPatientForm, species: e.target.value})}>
                                  {Object.values(Species).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newPatientForm.gender} onChange={e => setNewPatientForm({...newPatientForm, gender: e.target.value})}>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                              </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <input type="text" placeholder="Breed" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newPatientForm.breed} onChange={e => setNewPatientForm({...newPatientForm, breed: e.target.value})} />
                              <input type="number" placeholder="Age" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newPatientForm.age} onChange={e => setNewPatientForm({...newPatientForm, age: e.target.value})} />
                          </div>
                          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg mt-2">Create Record</button>
                      </form>
                  </div>
              </div>
          )}
      </div>
  );
};

// --- HELPER COMPONENT FOR PRINTING ---
const PrintableContent = ({ pet, owner, consult, settings, isPrint = false }: { pet: Pet | null, owner: Owner | null, consult: Consultation | null, settings: ClinicSettings, isPrint?: boolean }) => {
    if (!consult || !pet || !owner) return <div>Data Missing</div>;

    const total = consult.financials?.total || 0;
    const paid = consult.financials?.amountPaid || 0;
    const balance = Math.max(0, total - paid);
    const prescriptionList = safeArray(consult.prescription);

    return (
        <div className={`font-serif text-slate-900 ${isPrint ? 'w-full max-w-[210mm]' : 'p-2 md:p-4'}`}>
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-slate-800">{settings.name}</h1>
                    <p className="text-xs md:text-sm mt-2 text-slate-600">{settings.address}</p>
                    <p className="text-xs md:text-sm text-slate-600">{settings.phone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg md:text-xl font-bold text-slate-400 uppercase">Invoice</h2>
                    <p className="text-xs md:text-sm font-mono mt-2">#{consult.financials?.invoiceId || 'N/A'}</p>
                    <p className="text-xs md:text-sm font-mono">{new Date(consult.date).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="flex justify-between mb-8 text-xs md:text-sm">
                <div>
                    <h3 className="font-bold text-slate-400 uppercase mb-1">Billed To</h3>
                    <p className="font-bold text-base md:text-lg">{owner.name}</p>
                    <p>{owner.phone}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-bold text-slate-400 uppercase mb-1">Patient</h3>
                    <p className="font-bold text-base md:text-lg">{pet.name}</p>
                    <p>{pet.species} ({pet.gender})</p>
                </div>
            </div>

            <div className="mb-8 overflow-x-auto">
                <table className="w-full text-xs md:text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="py-2 px-4 text-left font-bold text-slate-600">Description</th>
                            <th className="py-2 px-4 text-right font-bold text-slate-600">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-100">
                            <td className="py-3 px-4">Consultation & Services</td>
                            <td className="py-3 px-4 text-right">{formatCurrency(consult.financials?.serviceFee || 0, settings.currency)}</td>
                        </tr>
                        {prescriptionList.map((rx: any, i: number) => (
                            <tr key={i} className="border-b border-slate-100 text-slate-500">
                                <td className="py-2 px-4 italic pl-8">Rx: {rx.name} - {rx.dosage}</td>
                                <td className="py-2 px-4 text-right">-</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="py-3 px-4 text-right font-bold uppercase">Total</td>
                            <td className="py-3 px-4 text-right font-bold text-lg">{formatCurrency(total, settings.currency)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="border-t border-slate-200 pt-8 mt-4 text-xs md:text-sm">
                <h3 className="font-bold uppercase tracking-widest mb-4 text-slate-500 border-b border-slate-200 pb-2">Medical Summary</h3>
                <p><span className="font-bold">Diagnosis:</span> {consult.diagnosis.tentative}</p>
                <p className="mt-2 whitespace-pre-wrap">{consult.plan}</p>
            </div>
        </div>
    );
};

export default Treatments;
