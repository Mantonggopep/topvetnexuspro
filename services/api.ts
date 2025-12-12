import axios, { AxiosError } from 'axios';

// --- CONFIGURATION ---
const PRODUCTION_API_URL = 'https://topvetnexuspro.onrender.com/api';
const LOCAL_API_URL = 'http://localhost:4000/api';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return import.meta.env.MODE === 'production' ? PRODUCTION_API_URL : LOCAL_API_URL;
};

// Create Axios Instance
const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Keep this for CORS (Cookies)
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
});

console.log(`🚀 API Initialized at: ${api.defaults.baseURL}`);

// --- 1. REQUEST INTERCEPTOR (Attach Token) ---
api.interceptors.request.use(
  (config) => {
    // 1. Get tokens from storage
    const staffToken = localStorage.getItem('token');
    const clientToken = localStorage.getItem('client_token');
    
    // 2. Determine which token to use
    // If we are in the portal section, prioritize the client token
    const isPortalRequest = config.url?.includes('/portal');
    
    let activeToken = isPortalRequest ? clientToken : staffToken;

    // 3. Attach Authorization Header
    if (activeToken) {
      config.headers.Authorization = `Bearer ${activeToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- 2. RESPONSE INTERCEPTOR (Handle Errors) ---
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError | any) => {
    
    // 1. SILENCE 401s for Session Checks (/auth/me)
    // It is normal for this to fail if the user is not logged in.
    if (error.response?.status === 401 && error.config?.url?.includes('/auth/me')) {
        return Promise.reject(error); 
    }

    // 2. Log other failures in Dev mode
    if (import.meta.env.DEV && error.config) {
        console.error(`[API Error] ${error.config.method?.toUpperCase()} ${error.config.url}`, error.response?.data);
    }

    // 3. Handle 401 (Unauthorized) for other requests (Token Expired)
    if (error.response?.status === 401) {
        const isLoginRequest = error.config?.url?.includes('/login');
        
        // Only redirect/logout if it's NOT a login attempt failing
        if (!isLoginRequest) {
            const isPortal = window.location.pathname.startsWith('/portal');

            if (isPortal) {
                localStorage.removeItem('client_token');
                // Force redirect for portal users
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/portal/login'; 
                }
            } else {
                // For staff, just clear token. App.tsx detects this and shows Auth screen.
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }

    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject({ ...error, message });
  }
);

// --- EXPORT SERVICES ---

export const AuthService = {
  login: (credentials: { email: string; password: string }) => api.post('/auth/login', credentials),
  signup: (data: any, paymentRef?: string) => api.post('/auth/signup', { ...data, paymentRef }),
  logout: async () => {
    try {
        await api.post('/auth/logout');
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
  },
  getMe: () => api.get('/auth/me'),
};

export const UserService = {
    getAll: () => api.get('/users'),
    create: (data: any) => api.post('/users', data),
    update: (id: string, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`)
};

export const BranchService = {
    getAll: () => api.get('/branches'),
    create: (data: any) => api.post('/branches', data)
};

export const SettingsService = {
    update: (settings: any) => api.patch('/settings', settings)
};

export const PatientService = {
  getAll: () => api.get('/patients'),
  create: (data: any) => api.post('/patients', data),
  getOne: (id: string) => api.get(`/patients/${id}`),
  updateMedical: (id: string, data: any) => api.put(`/patients/${id}/medical`, data),
};

export const OwnerService = {
  getAll: () => api.get('/owners'),
  checkDuplicate: (name: string, phone: string) => 
    api.get(`/owners/check-duplicate?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`),
  create: (data: any) => api.post('/owners', data),
  update: (id: string, data: any) => api.patch(`/owners/${id}`, data),
  delete: (id: string) => api.delete(`/owners/${id}`),
  updatePortalAccess: (id: string, data: { password?: string, isActive: boolean }) => api.patch(`/owners/${id}/portal`, data),
};

export const InventoryService = {
  getAll: () => api.get('/inventory'),
  create: (data: any) => api.post('/inventory', data),
  update: (id: string, data: any) => api.patch(`/inventory/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`)
};

export const AppointmentService = {
  getAll: (date?: string) => api.get(date ? `/appointments?date=${date}` : '/appointments'),
  create: (data: any) => api.post('/appointments', data),
};

export const SaleService = {
  getAll: () => api.get('/sales'),
  create: (data: any) => api.post('/sales/checkout', data),
  delete: (id: string) => api.delete(`/sales/${id}`)
};

export const ConsultationService = {
  getAll: () => api.get('/consultations'),
  create: (data: any) => api.post('/consultations', data),
};

export const LabService = {
  getAll: () => api.get('/labs'),
  create: (data: any) => api.post('/labs', data),
  update: (id: string, data: any) => api.patch(`/labs/${id}`, data),
};

export const ExpenseService = {
  getAll: () => api.get('/expenses'),
  create: (data: any) => api.post('/expenses', data),
};

export const LogService = {
    getAll: () => api.get('/logs')
};

export const PlanService = {
    getAll: () => api.get('/plans'),
    update: (id: string, data: any) => api.patch(`/plans/${id}`, data)
};

export const SuperAdminService = {
  createTenant: (data: any) => api.post('/admin/tenants', data),
  getTenants: () => api.get('/admin/tenants'),
  updateTenant: (id: string, data: any) => api.patch(`/admin/tenants/${id}`, data),
  getStats: () => api.get('/admin/stats'),
};

export const ClientPortalService = {
  login: (credentials: { email?: string, phone?: string, password: string }) => api.post('/portal/login', credentials),
  getDashboard: () => api.get('/portal/dashboard'),
  getPets: () => api.get('/portal/pets'), 
  bookAppointment: (data: any) => api.post('/portal/appointments', data),
  getInvoices: () => api.get('/portal/invoices'),
  getMessages: () => api.get('/portal/messages'),
  sendMessage: (content: string) => api.post('/portal/messages', { content }),
};

export default api;
