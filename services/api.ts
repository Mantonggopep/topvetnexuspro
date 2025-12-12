import axios, { AxiosRequestConfig, AxiosError } from 'axios';

// --- CONFIGURATION ---
// ✅ UPDATED: Points to your LIVE working backend
const PRODUCTION_API_URL = 'https://topvetnexuspro.onrender.com/api';
const LOCAL_API_URL = 'http://localhost:4000/api';

// Robust environment detection
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return import.meta.env.MODE === 'production' ? PRODUCTION_API_URL : LOCAL_API_URL;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Crucial for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s timeout
});

console.log(`🚀 API Initialized at: ${api.defaults.baseURL}`);

// --- 1. REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    // Check multiple storage keys for safety
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    // Portal users might store token differently, check that too if needed
    const clientToken = localStorage.getItem('client_token');

    if (token && !config.url?.includes('/portal')) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (clientToken && config.url?.includes('/portal')) {
      // Logic: If request is for portal, prioritize client token
      config.headers.Authorization = `Bearer ${clientToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- 2. RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError | any) => {
    
    // Log failures in Dev mode
    if (import.meta.env.DEV && error.config) {
        console.error(`[API Error] ${error.config.method?.toUpperCase()} ${error.config.url}`, error.response?.data);
    }

    // Handle 401 (Unauthorized) - Auto Logout
    if (error.response?.status === 401) {
        const isLoginRequest = error.config?.url?.includes('/login');
        
        if (!isLoginRequest) {
            // Determine if it was a Staff or Client session
            const isPortal = window.location.pathname.startsWith('/portal');

            if (isPortal) {
                localStorage.removeItem('client_token');
                // Optional: window.location.href = '/portal/login';
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Optional: window.location.href = '/login';
            }
        }
    }

    // Extract readable error message
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject({ ...error, message });
  }
);

// --- SERVICE DEFINITIONS ---

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
  create: (data: any) => api.post('/sales/checkout', data), // Updated to match single route logic
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
