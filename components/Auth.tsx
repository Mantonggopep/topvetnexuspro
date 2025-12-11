import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tenant, UserProfile, SubscriptionTier, BillingPeriod, SubscriptionPlan } from '../types';
import { Shield, Mail, Lock, AlertCircle, User, ShieldCheck, PawPrint } from 'lucide-react';
import { ClientPortalService } from '../services/api';

interface AuthProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSignup: (user: UserProfile, tenant: Tenant, password: string, paymentRef?: string) => void;
  plans?: SubscriptionPlan[];
}

// DEFINING PLANS
const DEFAULT_PLANS: SubscriptionPlan[] = [
    {
        id: 'Trial',
        name: 'Trial',
        price: { Monthly: 'NGN 100', Yearly: 'NGN 1,000' },
        features: ['Full Access for Testing', 'Limited Time', 'Single User'],
        limits: { maxUsers: 1, maxClients: 10, maxStorageGB: 0.5, modules: { pos: true, lab: true, ai: true, reports: true, multiBranch: false } }
    },
    {
        id: 'Starter',
        name: 'Starter',
        price: { Monthly: 'NGN 7,000', Yearly: 'NGN 70,000' },
        features: ['2 Users Max', 'Max 50 Clients', 'Basic Inventory & Sales', 'No Printing/Downloads', 'No AI Features'],
        limits: { 
            maxUsers: 2, 
            maxClients: 50, 
            maxStorageGB: 2, 
            modules: { pos: true, lab: false, ai: false, reports: false, multiBranch: false } 
        }
    },
    {
        id: 'Standard',
        name: 'Standard',
        price: { Monthly: 'NGN 30,000', Yearly: 'NGN 300,000' },
        features: ['7 Users Max', 'Unlimited Clients', 'Full Reports & Printing', 'Limited AI (200/mo)', 'Lab Module'],
        limits: { 
            maxUsers: 7, 
            maxClients: -1, 
            maxStorageGB: 10, 
            modules: { pos: true, lab: true, ai: true, reports: true, multiBranch: false } 
        }
    },
    {
        id: 'Premium',
        name: 'Premium',
        price: { Monthly: 'NGN 70,000', Yearly: 'NGN 700,000' },
        features: ['Unlimited Users', 'Unlimited AI', 'Multi-Branch Management', 'Staff Transfer', 'Priority Support'],
        limits: { 
            maxUsers: -1, 
            maxClients: -1, 
            maxStorageGB: 100, 
            modules: { pos: true, lab: true, ai: true, reports: true, multiBranch: true } 
        }
    }
];

// LIVE FLUTTERWAVE CONFIGURATION
const FLUTTERWAVE_CONFIG: Record<string, { id: number, amount: number }> = {
    'Trial_Monthly': { id: 149638, amount: 100 },
    'Trial_Yearly': { id: 149638, amount: 1000 }, 
    
    'Starter_Monthly': { id: 149600, amount: 7000 },
    'Starter_Yearly': { id: 149605, amount: 70000 },
    
    'Standard_Monthly': { id: 149601, amount: 30000 },
    'Standard_Yearly': { id: 149604, amount: 300000 },
    
    'Premium_Monthly': { id: 149602, amount: 70000 },
    'Premium_Yearly': { id: 149603, amount: 700000 },
};

declare global {
    interface Window {
        FlutterwaveCheckout: any;
    }
}

// HELPER: Map Countries to Currencies
const getCurrencyForCountry = (country: string): string => {
    const map: Record<string, string> = {
        'Nigeria': 'NGN', 'Ghana': 'GHS', 'Kenya': 'KES', 'South Africa': 'ZAR',
        'USA': 'USD', 'Canada': 'CAD', 'United Kingdom': 'GBP',
        
        // Eurozone
        'France': 'EUR', 'Germany': 'EUR', 'Italy': 'EUR', 'Spain': 'EUR', 
        'Netherlands': 'EUR', 'Belgium': 'EUR', 'Portugal': 'EUR', 'Ireland': 'EUR', 
        'Austria': 'EUR', 'Finland': 'EUR',
        
        // West African CFA Franc
        'Benin': 'XOF', 'Burkina Faso': 'XOF', 'Côte d\'Ivoire': 'XOF', 
        'Guinea-Bissau': 'XOF', 'Mali': 'XOF', 'Niger': 'XOF', 'Senegal': 'XOF', 'Togo': 'XOF',
        
        // Others
        'Switzerland': 'CHF', 'Sweden': 'SEK', 'Norway': 'NOK', 'Denmark': 'DKK'
    };
    return map[country] || 'USD'; // Default to USD
};

export const Auth: React.FC<AuthProps> = ({ onLogin, onSignup, plans = DEFAULT_PLANS }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // --- USER TYPE TOGGLE ---
  const [userType, setUserType] = useState<'STAFF' | 'CLIENT'>('STAFF');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [step, setStep] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [signupData, setSignupData] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      clinicName: '',
      country: 'Nigeria',
      plan: 'Starter' as SubscriptionTier,
      billingPeriod: 'Monthly' as BillingPeriod
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      setIsLoggingIn(true);

      try {
        // --- 1. CLIENT LOGIN LOGIC ---
        if (userType === 'CLIENT') {
            try {
                await ClientPortalService.login({ email: loginEmail, password: loginPass });
                navigate('/portal/dashboard');
            } catch (err: any) {
                setLoginError(err.message || 'Invalid Client Credentials');
            }
            return;
        }

        // --- 2. STAFF LOGIN LOGIC ---
        const success = await onLogin(loginEmail, loginPass);
        if (!success) {
            setLoginError('Invalid email or password.');
        }
      } catch (error) {
          setLoginError('An unexpected error occurred.');
      } finally {
          setIsLoggingIn(false);
      }
  };

  const handlePaymentAndSignup = async () => {
      const configKey = `${signupData.plan}_${signupData.billingPeriod}`;
      const planConfig = FLUTTERWAVE_CONFIG[configKey];

      if (!planConfig || planConfig.id === 0) {
          alert(`Configuration Error: Missing Plan ID for ${signupData.plan}. Contact support.`);
          return;
      }

      if (!signupData.email || !signupData.name || !signupData.clinicName) {
          alert('Please provide your full name, email and clinic name.');
          return;
      }

      // @ts-ignore
      let rawKey = import.meta.env?.VITE_FLUTTERWAVE_PUBLIC_KEY || import.meta.env?.VITE_FLW_PUBLIC_KEY || '';
      const publicKey = (rawKey || '').toString().replace(/['"\s]/g, '').trim();

      if (!publicKey) {
          alert("Payment Error: Public Key is missing in .env.");
          return;
      }

      if (!window || !window.FlutterwaveCheckout) {
          alert("Payment gateway failed to load.");
          return;
      }

      const selectedCurrency = getCurrencyForCountry(signupData.country);

      setIsProcessingPayment(true);
      const txRef = `vnx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      try {
          const modal = window.FlutterwaveCheckout({
              public_key: publicKey,
              tx_ref: txRef,
              amount: planConfig.amount,
              currency: selectedCurrency,
              payment_options: "card, banktransfer, ussd, account, mobilemoneyghana, mpesa",
              payment_plan: planConfig.id,
              customer: {
                  email: signupData.email,
                  name: signupData.name,
                  phone_number: "", 
              },
              customizations: {
                  title: "Vet Nexus Pro",
                  description: `${signupData.plan} ${signupData.billingPeriod}`,
                  logo: "https://placehold.co/100x100/teal/white?text=VN",
              },
              callback: (data: any) => {
                  try {
                      const paymentId = String(data.transaction_id || data.id || data.tx_ref || txRef);
                      completeSignup(paymentId);
                  } catch (cbErr) {
                      console.error("Error in callback:", cbErr);
                  } finally {
                      try { if (modal && typeof modal.close === 'function') modal.close(); } catch(e) {}
                      setIsProcessingPayment(false);
                  }
              },
              onclose: () => {
                  setIsProcessingPayment(false);
              },
          });
      } catch (err) {
          alert("Payment Error. Try again.");
          setIsProcessingPayment(false);
      }
  };

  const completeSignup = (paymentRef: string) => {
      const currency = getCurrencyForCountry(signupData.country);
      const tenantId = `tenant-${Date.now()}`;
      
      const newTenant: Tenant = {
          id: tenantId,
          name: signupData.clinicName,
          plan: signupData.plan,
          billingPeriod: signupData.billingPeriod,
          settings: {
              currency: currency,
              // Fixed: Removed 'timezone' property causing TS error
              // @ts-ignore
              name: signupData.clinicName, address: '', phone: '', email: signupData.email, website: '',
              taxRate: 7.5, bankDetails: '',
              clientPrefix: 'CL-', invoicePrefix: 'INV-', receiptPrefix: 'REC-', patientPrefix: 'P-'
          },
          status: 'Active',
          joinedDate: new Date().toISOString().split('T')[0],
          storageUsed: 0
      };

      const newUser: UserProfile = {
          id: `u-${Date.now()}`, 
          name: signupData.name, 
          email: signupData.email, 
          roles: ['Admin'], 
          tenantId: tenantId
          // Fixed: Removed 'preferences' property causing TS error
      };

      onSignup(newUser, newTenant, signupData.password, paymentRef);
  };

  // --- LOGIN VIEW ---
  if (mode === 'login') {
      return (
          <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center p-4">
              <div className="mb-8 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200">
                        {userType === 'CLIENT' ? <PawPrint className="w-8 h-8 text-white" /> : <Shield className="w-8 h-8 text-white" />}
                      </div>
                  </div>
                  <h1 className="text-3xl font-extrabold text-teal-900 tracking-tight mt-4">Vet Nexus Pro</h1>
                  <p className="text-teal-600 font-medium opacity-80">{userType === 'CLIENT' ? 'Pet Owner Portal' : 'Practice Management System'}</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-teal-100/50">
                  
                  {/* --- STAFF / CLIENT TOGGLE --- */}
                  <div className="bg-slate-100 p-1 rounded-xl flex mb-6 relative">
                    <button
                        type="button"
                        onClick={() => setUserType('STAFF')}
                        className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition-all relative z-10 ${
                            userType === 'STAFF' 
                            ? 'bg-white text-teal-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <ShieldCheck className={`w-4 h-4 mr-2 ${userType === 'STAFF' ? 'text-teal-600' : 'text-slate-400'}`} />
                        Clinic Staff
                    </button>
                    <button
                        type="button"
                        onClick={() => setUserType('CLIENT')}
                        className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition-all relative z-10 ${
                            userType === 'CLIENT' 
                            ? 'bg-white text-teal-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <User className={`w-4 h-4 mr-2 ${userType === 'CLIENT' ? 'text-teal-600' : 'text-slate-400'}`} />
                        Pet Owner
                    </button>
                  </div>

                  <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">
                    {userType === 'CLIENT' ? 'Welcome Back' : 'Staff Login'}
                  </h2>
                  <p className="text-center text-slate-400 text-sm mb-6">
                    {userType === 'CLIENT' ? 'Access your pet\'s records' : 'Enter your credentials to continue'}
                  </p>

                  {loginError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-sm font-bold animate-pulse">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {loginError}
                      </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email Address</label>
                          <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input type="email" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white border focus:border-teal-500 rounded-2xl focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-semibold text-slate-700" placeholder={userType === 'CLIENT' ? "owner@example.com" : "doctor@clinic.com"} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
                          <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input type="password" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white border focus:border-teal-500 rounded-2xl focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-semibold text-slate-700" placeholder="••••••••" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
                          </div>
                      </div>
                      <button type="submit" disabled={isLoggingIn} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-200 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                          {isLoggingIn ? 'Authenticating...' : (userType === 'CLIENT' ? 'Access Portal' : 'Log In')}
                      </button>
                  </form>
                  
                  {userType === 'STAFF' ? (
                      <div className="mt-8 text-center text-sm">
                          <span className="text-slate-500 font-medium">New to Vet Nexus? </span>
                          <button onClick={() => setMode('signup')} className="text-teal-600 font-bold hover:underline">Create Account</button>
                      </div>
                  ) : (
                      <div className="mt-8 text-center text-xs text-slate-400 px-4 leading-relaxed">
                          Don't have an account? Contact your veterinary clinic to receive your login credentials.
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // SIGNUP WIZARD
  return (
      <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl border border-teal-100 overflow-hidden flex flex-col md:flex-row h-[700px] animate-fade-in-up">
              <div className="bg-teal-900 text-white p-10 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
                   <div className="relative z-10">
                      <div className="w-12 h-12 bg-teal-800 rounded-xl flex items-center justify-center mb-6">
                          <Shield className="w-6 h-6" />
                      </div>
                      <h2 className="text-3xl font-black mb-4 leading-tight">Join 2,000+ Clinics</h2>
                      <p className="text-teal-200/80 font-medium leading-relaxed">Experience the future of veterinary practice management with AI-driven insights.</p>
                   </div>
                   
                   {/* Decorative Elements */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-teal-800 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                   <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-950 rounded-full blur-3xl -ml-16 -mb-16 opacity-50"></div>
              </div>

              <div className="p-10 md:w-2/3 overflow-y-auto bg-white relative">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-black text-slate-800">Create Account</h2>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step} of 4</div>
                  </div>

                  <form onSubmit={(e) => e.preventDefault()}>
                      {step === 1 && (
                          <div className="space-y-5 animate-fade-in">
                              <h3 className="font-bold text-teal-600 uppercase text-xs tracking-wide">Administrator Details</h3>
                              <input type="text" required className="w-full p-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-semibold" placeholder="Full Name" value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} />
                              <input type="email" required className="w-full p-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-semibold" placeholder="Email Address" value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} />
                              <input type="password" required className="w-full p-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-semibold" placeholder="Create Password" value={signupData.password} onChange={e => setSignupData({...signupData, password: e.target.value})} />
                              <button type="button" onClick={() => setStep(2)} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-bold mt-4 shadow-lg shadow-teal-200 transition-all">Continue</button>
                          </div>
                      )}
                      
                      {step === 2 && (
                          <div className="space-y-5 animate-fade-in">
                              <h3 className="font-bold text-teal-600 uppercase text-xs tracking-wide">Clinic Information</h3>
                              <input type="text" required className="w-full p-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-semibold" placeholder="Clinic Name" value={signupData.clinicName} onChange={e => setSignupData({...signupData, clinicName: e.target.value})} />
                              <div className="relative">
                                <select className="w-full p-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-semibold appearance-none" value={signupData.country} onChange={e => setSignupData({...signupData, country: e.target.value})}>
                                    <optgroup label="West Africa">
                                        <option value="Nigeria">Nigeria</option>
                                        <option value="Ghana">Ghana</option>
                                        <option value="Benin">Benin</option>
                                        <option value="Burkina Faso">Burkina Faso</option>
                                        <option value="Cape Verde">Cape Verde</option>
                                        <option value="Côte d'Ivoire">Côte d'Ivoire (Ivory Coast)</option>
                                        <option value="Gambia">Gambia</option>
                                        <option value="Guinea">Guinea</option>
                                        <option value="Guinea-Bissau">Guinea-Bissau</option>
                                        <option value="Liberia">Liberia</option>
                                        <option value="Mali">Mali</option>
                                        <option value="Niger">Niger</option>
                                        <option value="Senegal">Senegal</option>
                                        <option value="Sierra Leone">Sierra Leone</option>
                                        <option value="Togo">Togo</option>
                                    </optgroup>
                                    <optgroup label="Major Europe">
                                        <option value="United Kingdom">United Kingdom</option>
                                        <option value="France">France</option>
                                        <option value="Germany">Germany</option>
                                        <option value="Italy">Italy</option>
                                        <option value="Spain">Spain</option>
                                        <option value="Portugal">Portugal</option>
                                        <option value="Netherlands">Netherlands</option>
                                        <option value="Belgium">Belgium</option>
                                        <option value="Switzerland">Switzerland</option>
                                        <option value="Sweden">Sweden</option>
                                        <option value="Norway">Norway</option>
                                        <option value="Denmark">Denmark</option>
                                        <option value="Ireland">Ireland</option>
                                        <option value="Austria">Austria</option>
                                        <option value="Poland">Poland</option>
                                        <option value="Finland">Finland</option>
                                    </optgroup>
                                    <optgroup label="North America & Others">
                                        <option value="USA">USA</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Kenya">Kenya</option>
                                        <option value="South Africa">South Africa</option>
                                    </optgroup>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                              </div>
                              <div className="flex space-x-3 mt-4">
                                  <button onClick={() => setStep(1)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50">Back</button>
                                  <button onClick={() => setStep(3)} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-200">Next</button>
                              </div>
                          </div>
                      )}

                      {step === 3 && (
                          <div className="space-y-5 animate-fade-in">
                               <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-teal-600 uppercase text-xs tracking-wide">Select Plan</h3>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <button className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${signupData.billingPeriod === 'Monthly' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400'}`} onClick={() => setSignupData({...signupData, billingPeriod: 'Monthly'})}>Monthly</button>
                                        <button className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${signupData.billingPeriod === 'Yearly' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400'}`} onClick={() => setSignupData({...signupData, billingPeriod: 'Yearly'})}>Yearly</button>
                                    </div>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-3 h-64 overflow-y-auto pr-2 custom-scrollbar">
                                  {plans.map(p => (
                                      <div key={p.id} onClick={() => setSignupData({...signupData, plan: p.id as SubscriptionTier})} className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${signupData.plan === p.id ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-teal-200'}`}>
                                          <div className="font-black text-slate-800">{p.name}</div>
                                          <div className="text-teal-600 font-bold text-sm mt-1">{signupData.billingPeriod === 'Monthly' ? p.price.Monthly : p.price.Yearly}</div>
                                          <ul className="text-[10px] text-slate-500 mt-3 space-y-1.5 font-medium">
                                              {p.features.slice(0, 3).map((f, i) => <li key={i} className="flex items-center"><div className="w-1 h-1 bg-teal-400 rounded-full mr-1.5"></div> {f}</li>)}
                                          </ul>
                                      </div>
                                  ))}
                               </div>
                               <div className="flex space-x-3 mt-4">
                                  <button onClick={() => setStep(2)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50">Back</button>
                                  <button onClick={() => setStep(4)} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-200">Checkout</button>
                               </div>
                          </div>
                      )}

                      {step === 4 && (
                          <div className="space-y-6 text-center animate-fade-in pt-4">
                               <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <ShieldCheck className="w-10 h-10 text-green-600" />
                               </div>
                               <div>
                                    <h3 className="text-3xl font-black text-slate-800">{(plans.find(p=>p.id===signupData.plan)?.price as any)?.[signupData.billingPeriod]}</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wide">{signupData.plan} Plan • {signupData.billingPeriod}</p>
                               </div>
                               
                               <button onClick={handlePaymentAndSignup} disabled={isProcessingPayment} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold shadow-xl transition-all transform active:scale-[0.98]">
                                   {isProcessingPayment ? 'Processing Secure Payment...' : 'Complete Payment'}
                               </button>
                               <button onClick={() => setStep(3)} className="text-slate-400 text-xs font-bold hover:text-slate-600">Change Plan</button>
                          </div>
                      )}
                  </form>
                  <div className="absolute bottom-6 left-0 right-0 text-center">
                    <button onClick={() => setMode('login')} className="text-xs font-bold text-slate-400 hover:text-teal-600 transition-colors">Back to Login Screen</button>
                  </div>
              </div>
          </div>
      </div>
  );
};
