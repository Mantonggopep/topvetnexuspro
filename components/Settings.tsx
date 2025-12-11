import React, { useState, useEffect } from 'react';
import { ClinicSettings, StaffMember, SubscriptionTier, UserRole, UserProfile, Tenant } from '../types';
import { User, Building, Users, MapPin, Save, Plus, Trash2, Edit, Image as ImageIcon, Eye } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';

interface SettingsProps {
    settings: ClinicSettings;
    staff: StaffMember[];
    plan: SubscriptionTier;
    currentUser: UserProfile;
    tenants: Tenant[];
    branches?: Tenant[];
    onUpdateSettings: (s: ClinicSettings) => void;
    onAddStaff: (s: StaffMember) => void;
    onUpdateStaff: (s: StaffMember) => void;
    onDeleteStaff: (id: string) => void;
    onTransferStaff: (staffId: string, targetTenantId: string) => void;
    onUpdateProfile: (p: Partial<UserProfile>, password?: string) => void;
    onAddBranch?: (branchData: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    settings, staff, plan, currentUser, tenants, branches = [],
    onUpdateSettings, onAddStaff, onUpdateStaff, onDeleteStaff, onTransferStaff, onUpdateProfile, onAddBranch 
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'staff' | 'branches'>('clinic');
  const [clinicForm, setClinicForm] = useState<ClinicSettings>(settings);
  
  // Sync state when props change
  useEffect(() => { setClinicForm(settings); }, [settings]);
  
  // Staff State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState<{
      name: string; email: string; password: string; confirmPass: string; roles: UserRole[]; isSuspended: boolean;
  }>({ name: '', email: '', password: '', confirmPass: '', roles: ['Veterinarian'], isSuspended: false });

  // Branch State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({
      name: '', adminName: '', email: '', password: '', country: 'Nigeria'
  });

  // Profile State
  const [profileForm, setProfileForm] = useState({
      name: currentUser.name || '',
      password: '',
      confirmPassword: '',
      avatarUrl: currentUser.avatarUrl || ''
  });

  const availableRoles: UserRole[] = ['Admin', 'Veterinarian', 'Veterinary Assistant', 'Receptionist', 'Accountant', 'Security'];

  // Helper to preview the numbering format
  const getFormatPreview = (pattern: string | undefined) => {
      if (!pattern) return 'N/A';
      const currentYear = new Date().getFullYear().toString();
      // Replace 'year' with 2025
      let preview = pattern.replace(/year/gi, currentYear);
      // Replace sequence of zeros (e.g. 000) with 001
      preview = preview.replace(/(0+)/g, (match) => '1'.padStart(match.length, '0'));
      return preview;
  };

  const handleSaveClinic = () => {
      onUpdateSettings(clinicForm);
  };

  const handleStaffSubmit = () => {
      if (!staffForm.name || !staffForm.email) return;
      if (!editingStaffId && (!staffForm.password || staffForm.password !== staffForm.confirmPass)) {
          alert("Passwords do not match or are empty.");
          return;
      }

      if (editingStaffId) {
          // Edit Mode
          const existing = staff.find(s => s.id === editingStaffId);
          if (existing) {
              onUpdateStaff({
                  ...existing,
                  name: staffForm.name,
                  email: staffForm.email,
                  roles: staffForm.roles,
                  isSuspended: staffForm.isSuspended,
                  password: staffForm.password || existing.password 
              });
          }
      } else {
          // Add Mode
          onAddStaff({
              id: '', 
              tenantId: currentUser.tenantId, 
              name: staffForm.name,
              email: staffForm.email,
              password: staffForm.password,
              roles: staffForm.roles,
              isSuspended: staffForm.isSuspended
          });
      }
      setIsStaffModalOpen(false);
      resetStaffForm();
  };

  const handleBranchSubmit = () => {
      if (!onAddBranch) return;
      onAddBranch(branchForm);
      setIsBranchModalOpen(false);
      setBranchForm({ name: '', adminName: '', email: '', password: '', country: 'Nigeria' });
  };

  const resetStaffForm = () => {
      setStaffForm({ name: '', email: '', password: '', confirmPass: '', roles: ['Veterinarian'], isSuspended: false });
      setEditingStaffId(null);
  };

  const openEditStaff = (member: StaffMember) => {
      setStaffForm({
          name: member.name,
          email: member.email,
          password: '',
          confirmPass: '',
          roles: member.roles,
          isSuspended: member.isSuspended
      });
      setEditingStaffId(member.id);
      setIsStaffModalOpen(true);
  };

  const toggleRole = (role: UserRole) => {
      setStaffForm(prev => {
          const exists = prev.roles.includes(role);
          if (exists) return { ...prev, roles: prev.roles.filter(r => r !== role) };
          return { ...prev, roles: [...prev.roles, role] };
      });
  };

  const handleProfileUpdate = () => {
      if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
          alert("Passwords do not match");
          return;
      }
      onUpdateProfile({ name: profileForm.name, avatarUrl: profileForm.avatarUrl }, profileForm.password);
      setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      alert("Profile updated successfully!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          setProfileForm(prev => ({ ...prev, avatarUrl: url }));
      }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'clinic', label: 'Clinic Details', icon: Building },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'branches', label: 'Clinic Branches', icon: MapPin },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6">
        <div className="w-full md:w-64 bg-white rounded-3xl shadow-sm border border-slate-100 p-2 h-fit md:sticky md:top-0">
            {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all mb-1 btn-press ${
                            activeTab === tab.id 
                            ? 'bg-teal-50 text-teal-700 font-bold shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                    </button>
                )
            })}
        </div>

        <div className="flex-1 bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-slate-100 p-8 overflow-y-auto custom-scrollbar">
            {activeTab === 'clinic' && (
                <div className="animate-fade-in max-w-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Clinic Details</h2>
                        <button onClick={handleSaveClinic} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-teal-700 shadow-lg shadow-teal-200 btn-press">
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                        </button>
                    </div>
                    
                    <div className="space-y-8">
                         <section className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">General Information</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Clinic Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 bg-white" 
                                        value={clinicForm.name || ''} 
                                        onChange={e => setClinicForm({...clinicForm, name: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Address</label>
                                    <textarea 
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm h-24 focus:ring-2 focus:ring-teal-500 bg-white" 
                                        value={clinicForm.address || ''} 
                                        onChange={e => setClinicForm({...clinicForm, address: e.target.value})} 
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Phone</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 bg-white" 
                                            value={clinicForm.phone || ''} 
                                            onChange={e => setClinicForm({...clinicForm, phone: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 bg-white" 
                                            value={clinicForm.email || ''} 
                                            onChange={e => setClinicForm({...clinicForm, email: e.target.value})} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                             <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Numbering Formats</h3>
                                <div className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">Use '000' for sequence, 'year' for current year</div>
                             </div>
                             
                             <div className="grid grid-cols-1 gap-4">
                                 {/* Client Pattern */}
                                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                     <div className="flex justify-between mb-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Client ID Pattern</label>
                                        <span className="text-xs text-teal-600 font-bold flex items-center"><Eye className="w-3 h-3 mr-1"/> Preview: {getFormatPreview(clinicForm.clientPrefix)}</span>
                                     </div>
                                     <input 
                                        type="text" 
                                        placeholder="e.g., HH/000/year"
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500 bg-white" 
                                        value={clinicForm.clientPrefix || ''} 
                                        onChange={e => setClinicForm({...clinicForm, clientPrefix: e.target.value})} 
                                     />
                                 </div>

                                 {/* Invoice Pattern */}
                                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                     <div className="flex justify-between mb-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Invoice ID Pattern</label>
                                        <span className="text-xs text-teal-600 font-bold flex items-center"><Eye className="w-3 h-3 mr-1"/> Preview: {getFormatPreview(clinicForm.invoicePrefix)}</span>
                                     </div>
                                     <input 
                                        type="text" 
                                        placeholder="e.g., HH/INV/0000"
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500 bg-white" 
                                        value={clinicForm.invoicePrefix || ''} 
                                        onChange={e => setClinicForm({...clinicForm, invoicePrefix: e.target.value})} 
                                     />
                                 </div>

                                 {/* Receipt Pattern */}
                                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                     <div className="flex justify-between mb-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Receipt ID Pattern</label>
                                        <span className="text-xs text-teal-600 font-bold flex items-center"><Eye className="w-3 h-3 mr-1"/> Preview: {getFormatPreview(clinicForm.receiptPrefix)}</span>
                                     </div>
                                     <input 
                                        type="text" 
                                        placeholder="e.g., RCPT-0000-year"
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500 bg-white" 
                                        value={clinicForm.receiptPrefix || ''} 
                                        onChange={e => setClinicForm({...clinicForm, receiptPrefix: e.target.value})} 
                                    />
                                 </div>
                             </div>

                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 pt-4">Financial Settings</h3>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Tax Rate (%)</label>
                                     <input 
                                        type="number" 
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 bg-white" 
                                        value={clinicForm.taxRate ?? 0} 
                                        onChange={e => setClinicForm({...clinicForm, taxRate: parseFloat(e.target.value) || 0})} 
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Currency</label>
                                     <input 
                                        type="text" 
                                        readOnly
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed" 
                                        value={clinicForm.currency || ''} 
                                     />
                                 </div>
                             </div>

                             <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1 mt-2">Bank Details</label>
                             <textarea 
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm h-24 font-mono bg-slate-50 focus:ring-2 focus:ring-teal-500" 
                                    placeholder="Bank Name, Account Number..."
                                    value={clinicForm.bankDetails || ''} 
                                    onChange={e => setClinicForm({...clinicForm, bankDetails: e.target.value})} 
                             />
                        </section>
                    </div>
                </div>
            )}

            {activeTab === 'staff' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Staff Management</h2>
                            <p className="text-sm text-slate-500">Manage users, roles, and access.</p>
                        </div>
                        <button 
                            onClick={() => { resetStaffForm(); setIsStaffModalOpen(true); }}
                            className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-teal-200 hover:bg-teal-700 btn-press"
                        >
                            <Plus className="w-4 h-4 mr-2"/> Add Staff
                        </button>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-200 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role(s)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staff.map(member => (
                                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold mr-3 border border-teal-200 shadow-sm">
                                                    {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full rounded-2xl object-cover"/> : member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">{member.name}</p>
                                                    <p className="text-xs text-slate-500">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {member.roles.map(r => (
                                                    <span key={r} className="bg-white text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 uppercase shadow-sm">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${member.isSuspended ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                {member.isSuspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => openEditStaff(member)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition-colors"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => onDeleteStaff(member.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                ))}
                                {staff.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-500">No staff members found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'branches' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Clinic Branches</h2>
                            <p className="text-sm text-slate-500">Manage multiple locations.</p>
                        </div>
                        {plan === 'Premium' || plan === 'Enterprise' ? (
                            <button 
                                onClick={() => setIsBranchModalOpen(true)}
                                className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-teal-200 hover:bg-teal-700 btn-press"
                            >
                                <Plus className="w-4 h-4 mr-2"/> Add Branch
                            </button>
                        ) : (
                            <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500 border border-slate-200 font-bold">Upgrade to Premium to add branches</span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {branches.map(branch => (
                            <div key={branch.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-teal-600 transition-colors">{branch.name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${branch.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            {branch.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">{branch.settings.email}</p>
                                    <p className="text-xs text-slate-400 mt-2 font-mono">ID: {branch.id.slice(0, 8)}...</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">{branch.plan}</span>
                                    <button className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1 rounded-lg transition-colors">Manage</button>
                                </div>
                            </div>
                        ))}
                        {branches.length === 0 && (
                            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-slate-50/50">
                                No branches created yet.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="animate-fade-in max-w-lg mx-auto">
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 relative group overflow-hidden border-4 border-white shadow-xl">
                            {profileForm.avatarUrl ? (
                                <img src={profileForm.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                                <label className="cursor-pointer text-white flex flex-col items-center text-xs font-bold">
                                    <ImageIcon className="w-5 h-5 mb-1" /> Change
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{currentUser.name}</h2>
                        <p className="text-slate-500 text-sm">{currentUser.email}</p>
                    </div>

                    <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Edit Profile</h3>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Display Name</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                                value={profileForm.name}
                                onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                            />
                        </div>
                        <div className="pt-2">
                             <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">New Password (Optional)</label>
                             <input 
                                type="password" 
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm mb-3 focus:ring-2 focus:ring-teal-500"
                                placeholder="Leave blank to keep current"
                                value={profileForm.password}
                                onChange={e => setProfileForm({...profileForm, password: e.target.value})}
                             />
                             <input 
                                type="password" 
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                                placeholder="Confirm New Password"
                                value={profileForm.confirmPassword}
                                onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})}
                             />
                        </div>
                        <button onClick={handleProfileUpdate} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 mt-4 btn-press transition-all">
                            Update Profile
                        </button>
                    </div>
                </div>
            )}

            {/* Staff Modal */}
            {isStaffModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-scale-up border border-white/50">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                            <h3 className="font-bold text-xl text-slate-800">{editingStaffId ? 'Edit Staff' : 'Add New Staff'}</h3>
                            <button onClick={() => setIsStaffModalOpen(false)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-colors">✕</button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Full Name</label>
                                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Email</label>
                                    <input type="email" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} />
                                </div>
                            </div>
                            
                            {!editingStaffId && (
                                <div className="grid grid-cols-2 gap-4 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                    <div>
                                        <label className="block text-xs font-bold text-amber-800 mb-1.5 ml-1">Password</label>
                                        <input type="password" className="w-full p-3 border border-amber-200 rounded-xl text-sm bg-white" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-amber-800 mb-1.5 ml-1">Confirm</label>
                                        <input type="password" className="w-full p-3 border border-amber-200 rounded-xl text-sm bg-white" value={staffForm.confirmPass} onChange={e => setStaffForm({...staffForm, confirmPass: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 ml-1">Assign Roles</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableRoles.map(role => (
                                        <button 
                                            key={role}
                                            onClick={() => toggleRole(role)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                staffForm.roles.includes(role) 
                                                ? 'bg-teal-600 text-white border-teal-600 shadow-md' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                                            }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {editingStaffId && (
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <span className="text-sm font-bold text-slate-700">Account Status</span>
                                    <div className="flex items-center space-x-3">
                                        <span className={`text-xs font-bold ${staffForm.isSuspended ? 'text-red-500' : 'text-green-600'}`}>
                                            {staffForm.isSuspended ? 'Suspended' : 'Active'}
                                        </span>
                                        <ToggleSwitch 
                                            checked={!staffForm.isSuspended} 
                                            onChange={(checked) => setStaffForm(prev => ({ ...prev, isSuspended: !checked }))} 
                                        />
                                    </div>
                                </div>
                            )}

                            <button onClick={handleStaffSubmit} className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold hover:bg-teal-700 mt-2 shadow-lg shadow-teal-200 btn-press">
                                {editingStaffId ? 'Update Staff Member' : 'Create Staff Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Branch Modal */}
            {isBranchModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-scale-up border border-white/50">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                            <h3 className="font-bold text-xl text-slate-800">Add New Branch</h3>
                            <button onClick={() => setIsBranchModalOpen(false)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-colors">✕</button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Branch Name</label>
                                <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500" value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Branch Admin Name</label>
                                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500" value={branchForm.adminName} onChange={e => setBranchForm({...branchForm, adminName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Admin Email</label>
                                    <input type="email" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500" value={branchForm.email} onChange={e => setBranchForm({...branchForm, email: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Password</label>
                                    <input type="password" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500" value={branchForm.password} onChange={e => setBranchForm({...branchForm, password: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Country</label>
                                    <select className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 bg-white" value={branchForm.country} onChange={e => setBranchForm({...branchForm, country: e.target.value})}>
                                        <option value="Nigeria">Nigeria</option>
                                        <option value="USA">USA</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleBranchSubmit} className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold hover:bg-teal-700 mt-4 shadow-lg shadow-teal-200 btn-press">
                                Create Branch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Settings;