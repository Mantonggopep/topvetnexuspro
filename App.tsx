import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import AIAssistant from './components/AIAssistant';
import Clients from './components/Clients';
import Appointments from './components/Appointments';
import Treatments from './components/Treatments';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Lab from './components/Lab';
import Reports from './components/Reports';
import ClinicLogs from './components/ClinicLogs';
import Settings from './components/Settings';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import Expenses from './components/Expenses';
import LoadingScreen from './components/LoadingScreen';
import PageTransition from './components/PageTransition';
import DynamicIsland, { ToastType } from './components/DynamicIsland';
import SpotlightSearch from './components/SpotlightSearch';
import MobileNavbar from './components/MobileNavbar'; 
import InstallPrompt from './components/InstallPrompt'; 
import { Auth } from './components/Auth';
import { LogOut, User as UserIcon, Search, Home, ChevronLeft } from 'lucide-react';
import { AuthService, PatientService, OwnerService, InventoryService, AppointmentService, SaleService, ConsultationService, LabService, ExpenseService, PlanService, UserService, BranchService, SettingsService, LogService } from './services/api';
import { getAvatarGradient } from './utils/uiUtils';

import { AppState, ViewType, SaleRecord, InventoryItem, LabResult, ClinicSettings, StaffMember, Tenant, UserProfile, Consultation } from './types';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string; visible: boolean }>({
      type: 'info', message: '', visible: false
  });

  const showToast = (type: ToastType, message: string) => {
      setToast({ type, message, visible: true });
  };

  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const [appState, setAppState] = useState<AppState>({
    currentUser: null,
    currentTenantId: '',
    tenants: [],
    pets: [],
    owners: [],
    appointments: [],
    consultations: [],
    sales: [],
    inventory: [],
    labResults: [],
    logs: [],
    staff: [],
    subscriptionPlans: [],
    supportTickets: [],
    expenses: [],
    branches: []
  });

  const fetchPlans = async () => {
    try {
        const { data } = await PlanService.getAll();
        if (Array.isArray(data)) {
            setAppState(prev => ({ ...prev, subscriptionPlans: data }));
        }
    } catch (error) {
        console.warn("Could not fetch subscription plans. Using defaults.");
    }
  };

  const fetchAllData = async () => {
      try {
          const [pets, owners, inventory, appointments, sales, consultations, labs, expenses, users, branches, logs] = await Promise.all([
              PatientService.getAll(), OwnerService.getAll(), InventoryService.getAll(), AppointmentService.getAll(),
              SaleService.getAll(), ConsultationService.getAll(), LabService.getAll(), ExpenseService.getAll(),
              UserService.getAll(), BranchService.getAll(), LogService.getAll()
          ]);
          setAppState(prev => ({
              ...prev, pets: pets.data, owners: owners.data, inventory: inventory.data, appointments: appointments.data,
              sales: sales.data, consultations: consultations.data, labResults: labs.data, expenses: expenses.data,
              staff: users.data, branches: branches.data, logs: logs.data
          }));
      } catch (error) {
          console.error("Failed to fetch clinic data", error);
          showToast('error', 'Failed to load clinic data');
      }
  };

  useEffect(() => {
    const restoreSession = async () => {
        try {
            await fetchPlans();
            const { data } = await AuthService.getMe();
            if (data && data.user && data.tenant) {
                setAppState(prev => ({ ...prev, currentUser: data.user, currentTenantId: data.tenant.id, tenants: [data.tenant] }));
                if (!data.user.roles.includes('SuperAdmin')) { await fetchAllData(); }
            }
        } catch (e) {} finally { setIsLoading(false); }
    };
    restoreSession();
  }, []);

  const withLoading = async (action: () => Promise<void>, successMessage?: string) => {
      setIsSaving(true);
      try { await action(); if (successMessage) showToast('success', successMessage); } catch (e) { showToast('error', 'Operation failed'); } finally { setIsSaving(false); }
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      try {
          const { data } = await AuthService.login({ email, password });
          setAppState(prev => ({ ...prev, currentUser: data.user, currentTenantId: data.tenant.id, tenants: [data.tenant] }));
          if (data.user.roles.includes('SuperAdmin')) { /* Admin logic */ } else { await fetchAllData(); }
          showToast('success', `Welcome back, ${data.user.name}`);
          return true;
      } catch (error) { console.error("Login failed", error); return false; } finally { setIsLoading(false); }
  };

  const handleSignup = async (user: UserProfile, tenant: Tenant, password: string, paymentRef?: string) => {
      await withLoading(async () => {
          try {
              await AuthService.signup({ name: user.name, email: user.email, password, clinicName: tenant.name, plan: tenant.plan, billingPeriod: tenant.billingPeriod, country: tenant.settings.currency === 'NGN' ? 'Nigeria' : 'USA' }, paymentRef);
              await handleLogin(user.email, password);
          } catch (error) { console.error("Signup failed", error); showToast('error', 'Registration failed. Please contact support.'); }
      }, 'Account created successfully!');
  };

  const handleLogout = async () => {
      setIsLoading(true);
      try { await AuthService.logout(); } catch (e) {}
      setAppState(prev => ({ ...prev, currentUser: null, currentTenantId: '' }));
      setIsProfileOpen(false);
      setIsLoading(false);
  };
  
  const handleAddPatient = async (petData: any) => withLoading(async () => { const { data } = await PatientService.create(petData); setAppState(prev => ({ ...prev, pets: [...prev.pets, data] })); }, 'Patient registered');
  const handleAddClient = async (clientData: any) => withLoading(async () => { const { data } = await OwnerService.create(clientData); setAppState(prev => ({ ...prev, owners: [...prev.owners, data] })); }, 'Client registered');
  const handleAddAppointment = async (apptData: any) => withLoading(async () => { const { data } = await AppointmentService.create(apptData); setAppState(prev => ({ ...prev, appointments: [...prev.appointments, data] })); }, 'Appointment scheduled');
  const handleSaveSale = async (sale: SaleRecord) => withLoading(async () => { const { data } = await SaleService.create(sale); setAppState(prev => { const existing = prev.sales.find(s => s.id === sale.id); if (existing) { return { ...prev, sales: prev.sales.map(s => s.id === sale.id ? data : s) }; } return { ...prev, sales: [data, ...prev.sales] }; }); if (sale.status === 'Paid') { const inv = await InventoryService.getAll(); setAppState(prev => ({ ...prev, inventory: inv.data })); } }, sale.status === 'Paid' ? 'Receipt generated & Stock updated' : 'Invoice generated successfully');
  const handleDeleteSale = async (id: string, reason: string) => withLoading(async () => { const sale = appState.sales.find(s => s.id === id); if (!sale) return; await SaleService.delete(id); const [updatedSales, updatedLogs, updatedInv] = await Promise.all([ SaleService.getAll(), LogService.getAll(), InventoryService.getAll() ]); setAppState(prev => ({ ...prev, sales: updatedSales.data, logs: updatedLogs.data, inventory: updatedInv.data })); }, 'Record deleted successfully');
  const handleAddConsultation = async (consult: Consultation) => withLoading(async () => { const { data } = await ConsultationService.create(consult); setAppState(prev => { const exists = prev.consultations.find(c => c.id === data.id); if (exists) return { ...prev, consultations: prev.consultations.map(c => c.id === data.id ? data : c) }; return { ...prev, consultations: [data, ...prev.consultations] }; }); }, consult.status === 'Draft' ? 'Draft saved' : 'Consultation finalized');
  const handleAddLabRequest = async (result: LabResult) => withLoading(async () => { const { data } = await LabService.create(result); setAppState(prev => ({ ...prev, labResults: [data, ...prev.labResults] })); }, 'Lab request sent');
  const handleUpdateLabResult = async (result: LabResult) => withLoading(async () => { const { data } = await LabService.update(result.id, result); setAppState(prev => ({ ...prev, labResults: prev.labResults.map(l => l.id === data.id ? data : l) })); }, 'Result filed');
  const handleAddInventory = async (item: InventoryItem) => withLoading(async () => { const { data } = await InventoryService.create(item); setAppState(prev => ({ ...prev, inventory: [...prev.inventory, data] })); }, 'Item added to inventory');
  const handleUpdateInventory = async (item: InventoryItem) => withLoading(async () => { const { data } = await InventoryService.update(item.id, item); setAppState(prev => ({ ...prev, inventory: prev.inventory.map(i => i.id === data.id ? data : i) })); }, 'Inventory updated');
  const handleAddExpense = async (expense: any) => withLoading(async () => { const { data } = await ExpenseService.create(expense); setAppState(prev => ({ ...prev, expenses: [data, ...prev.expenses] })); }, 'Expense recorded');
  const handleAddStaff = async (staffMember: StaffMember) => withLoading(async () => { const { data } = await UserService.create(staffMember); setAppState(prev => ({ ...prev, staff: [...prev.staff, data] })); }, 'Staff member added');
  const handleUpdateStaff = async (staffMember: StaffMember) => withLoading(async () => { const { data } = await UserService.update(staffMember.id, staffMember); setAppState(prev => ({ ...prev, staff: prev.staff.map(s => s.id === data.id ? data : s) })); }, 'Staff updated');
  const handleDeleteStaff = async (id: string) => withLoading(async () => { await UserService.delete(id); setAppState(prev => ({ ...prev, staff: prev.staff.filter(s => s.id !== id) })); }, 'Staff member removed');
  const handleAddBranch = async (branchData: any) => withLoading(async () => { const { data } = await BranchService.create(branchData); setAppState(prev => ({ ...prev, branches: [...(prev.branches || []), data] })); }, 'Branch created successfully');
  const handleUpdateSettings = async (settings: ClinicSettings) => withLoading(async () => { await SettingsService.update(settings); setAppState(prev => ({ ...prev, tenants: prev.tenants.map(t => t.id === prev.currentTenantId ? { ...t, settings } : t) })); }, 'Settings saved');
  
  const handleUpdateTicket = () => {};
  const handleSwitchTenant = (id: string) => setAppState(prev => ({ ...prev, currentTenantId: id }));
  const handlePatientSelect = (id: string) => { setSelectedPatientId(id); setCurrentView('patients'); };
  const handleAddNote = () => {}; 
  const handleTransferStaff = () => {};
  const handleUpdateProfile = () => {};
  const handleUpdateSubscriptionPlan = async () => await fetchPlans();

  if (isLoading) return <LoadingScreen message="Initializing Vet Nexus..." />;
  if (!appState.currentUser) return <Auth onLogin={handleLogin} onSignup={handleSignup} plans={appState.subscriptionPlans} />;
  if (appState.currentUser.roles.includes('SuperAdmin')) return <SuperAdminDashboard appState={appState} onUpdateTenant={()=>{}} onCreateTenant={()=>{}} onUpdatePlan={handleUpdateSubscriptionPlan} onUpdateTicket={handleUpdateTicket} onLogout={handleLogout} />;

  const currentTenant = appState.tenants.find(t => t.id === appState.currentTenantId) || appState.tenants[0];
  const currency = currentTenant?.settings?.currency || 'USD';

  // --- NEW IOS LAYOUT STRUCTURE ---
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#F2F2F7] font-sans overflow-hidden">
      <DynamicIsland type={toast.type} message={toast.message} isVisible={toast.visible} onClose={hideToast} />
      <SpotlightSearch isOpen={isSpotlightOpen} onClose={() => setIsSpotlightOpen(false)} onNavigate={setCurrentView} />
      <InstallPrompt />
      
      {isSaving && <LoadingScreen message="Saving changes..." />}
      
      {/* HEADER: Slim, Glassmorphic, Sticky */}
      <div className="sticky top-0 z-40 px-2 pt-2 md:pt-4 md:px-4">
        <header className="glass-panel rounded-2xl flex items-center justify-between px-3 py-2.5 shadow-ios-sm">
            <div className="flex items-center gap-2">
                {currentView !== 'dashboard' && (
                    <button 
                        onClick={() => setCurrentView('dashboard')} 
                        className="p-1.5 rounded-full bg-white text-slate-700 shadow-sm border border-slate-100 active:scale-95 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                <h2 className="text-lg font-black text-slate-800 capitalize tracking-tight truncate max-w-[200px]">
                    {selectedPatientId && currentView === 'patients' ? 'Patient Record' : currentView.replace('-', ' ')}
                </h2>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsSpotlightOpen(true)}
                    className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-white hover:text-blue-600 transition-colors"
                >
                    <Search className="w-5 h-5" />
                </button>
                
                <div className="relative">
                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="block focus:outline-none active:scale-95 transition-transform">
                        <div className={`w-9 h-9 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center text-white text-sm font-bold ${getAvatarGradient(appState.currentUser.name)}`}>
                            {appState.currentUser.avatarUrl ? <img src={appState.currentUser.avatarUrl} className="w-full h-full rounded-full object-cover" /> : appState.currentUser.name[0]}
                        </div>
                    </button>
                    {isProfileOpen && (
                        <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                        <div className="absolute right-0 mt-3 w-64 glass-card rounded-2xl shadow-ios-lg z-20 animate-scale-up overflow-hidden p-2">
                             <div className="px-3 py-2 border-b border-gray-100/50 mb-1">
                                <p className="text-sm font-bold text-slate-900 truncate">{appState.currentUser.name}</p>
                                <p className="text-xs text-slate-500 truncate">{currentTenant.name}</p>
                            </div>
                            <button onClick={() => { setCurrentView('settings'); setIsProfileOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-white rounded-xl transition-colors flex items-center gap-2"><UserIcon className="w-4 h-4" /> My Profile</button>
                            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign Out</button>
                        </div>
                        </>
                    )}
                </div>
            </div>
        </header>
      </div>
      
      {/* MAIN: Full Width, No Bezel Waste */}
      <main className="flex-1 w-full relative overflow-hidden">
         <div className="absolute inset-0 overflow-y-auto no-scrollbar pb-28 px-2 md:px-4 pt-3">
            <PageTransition view={currentView}>
                <div className="w-full max-w-full mx-auto min-h-full">
                    {/* Render Content Based on View */}
                    {currentView === 'dashboard' && <Dashboard state={appState} onNavigate={setCurrentView} onSelectPatient={handlePatientSelect} />}
                    {currentView === 'patients' && <PatientList pets={appState.pets} owners={appState.owners} onSelectPatient={handlePatientSelect} onAddPatient={handleAddPatient}/>}
                    {currentView === 'patients' && selectedPatientId && (
                            <PatientDetail pet={appState.pets.find(p => p.id === selectedPatientId)!} onBack={() => setSelectedPatientId(null)} onAddNote={handleAddNote} />
                    )}
                    {currentView === 'clients' && <Clients currency={currency} />}
                    {currentView === 'appointments' && <Appointments appointments={appState.appointments} pets={appState.pets} owners={appState.owners} onAddAppointment={handleAddAppointment} />}
                    {currentView === 'treatments' && <Treatments activePatients={appState.pets} appointments={appState.appointments} consultations={appState.consultations} owners={appState.owners} settings={currentTenant.settings} plan={currentTenant.plan} onSelectPatient={handlePatientSelect} onAddConsultation={handleAddConsultation} onAddLabRequest={handleAddLabRequest} onAddPatient={handleAddPatient} />}
                    {currentView === 'inventory' && <Inventory items={appState.inventory} currency={currency} onAddItem={handleAddInventory} onUpdateItem={handleUpdateInventory} />}
                    {currentView === 'pos' && <POS sales={appState.sales} owners={appState.owners} settings={currentTenant.settings} inventory={appState.inventory} plan={currentTenant.plan} onSaveSale={handleSaveSale} onDeleteSale={handleDeleteSale} />}
                    {currentView === 'lab' && <Lab results={appState.labResults} pets={appState.pets} owners={appState.owners} onAddResult={handleAddLabRequest} onUpdateResult={handleUpdateLabResult} />}
                    {currentView === 'reports' && <Reports sales={appState.sales} inventory={appState.inventory} pets={appState.pets} consultations={appState.consultations} currency={currency} />}
                    {currentView === 'logs' && <ClinicLogs logs={appState.logs} />}
                    {currentView === 'settings' && <Settings settings={currentTenant.settings} staff={appState.staff} plan={currentTenant.plan} currentUser={appState.currentUser!} tenants={appState.tenants} branches={appState.branches} onUpdateSettings={handleUpdateSettings} onAddStaff={handleAddStaff} onUpdateStaff={handleUpdateStaff} onDeleteStaff={handleDeleteStaff} onTransferStaff={handleTransferStaff} onUpdateProfile={handleUpdateProfile} onAddBranch={handleAddBranch} />}
                    {currentView === 'expenses' && <Expenses expenses={appState.expenses} settings={currentTenant.settings} onAddExpense={handleAddExpense} />}
                </div>
            </PageTransition>
         </div>
      </main>
      
      {/* NAV: Floating Dock Style */}
      <MobileNavbar 
          currentView={currentView} 
          onNavigate={setCurrentView} 
          onOpenMenu={() => setIsSpotlightOpen(true)} 
      />
      
      <AIAssistant plan={currentTenant?.plan} />
    </div>
  );
};

export default App;