export enum Species {
  Dog = 'Dog',
  Cat = 'Cat',
  Bird = 'Bird',
  Reptile = 'Reptile',
  Other = 'Other',
  Horse = 'Horse',
  Cow = 'Cow',
  Pig = 'Pig'
}

export enum AppointmentStatus {
  Scheduled = 'Scheduled',
  CheckedIn = 'Checked In',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export type SubscriptionTier = 'Trial' | 'Starter' | 'Standard' | 'Premium' | 'Enterprise';
export type BillingPeriod = 'Monthly' | 'Yearly';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
  tenantId: string;
  avatarUrl?: string;
}

export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxRate: number;
  currency: string;
  bankDetails: string;
  clientPrefix: string;
  invoicePrefix: string;
  receiptPrefix: string;
  patientPrefix: string;
  clinicName?: string;
}

export interface Tenant {
  id: string;
  parentId?: string | null;
  name: string;
  plan: SubscriptionTier;
  billingPeriod: BillingPeriod;
  settings: ClinicSettings;
  status?: 'Active' | 'Suspended' | 'Pending' | 'Expired' | 'Restricted';
  joinedDate?: string;
  nextBillingDate?: string;
  storageUsed: number;
  userCount?: number;
  patientCount?: number;
}

export interface PlanLimits {
    maxUsers: number;
    maxClients: number;
    maxStorageGB: number;
    modules: {
        pos: boolean;
        lab: boolean;
        ai: boolean;
        reports: boolean;
        multiBranch: boolean;
    };
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: { Monthly: string; Yearly: string };
    features: string[];
    limits: PlanLimits;
}

export interface SupportTicket {
    id: string;
    tenantId: string;
    tenantName: string;
    subject: string;
    message?: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    priority: 'Low' | 'Medium' | 'High';
    date: string;
    assignedTo?: string;
}

export interface Owner {
  id: string;
  tenantId: string;
  clientNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  
  // Client Portal Fields
  isPortalActive?: boolean;
  passwordHash?: string; // Optional, usually handled securely on backend
  lastLogin?: string;
  createdAt?: string;
}

export interface MedicalNote {
  id: string;
  date: string;
  vetName: string;
  content: string;
  type: 'SOAP' | 'General' | 'Prescription';
}

export interface Vitals {
  date: string;
  weightKg: number;
  temperatureC: number;
  heartRateBpm: number;
  respiratoryRate?: number;
}

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document';
}

export interface VaccinationRecord {
  id: string;
  tenantId: string;
  petId: string;
  vaccineName: string;
  dateAdministered: string;
  dueDate: string;
  lotNumber?: string;
  manufacturer?: string;
  administeredBy: string;
}

export interface Reminder {
  id: string;
  tenantId: string;
  patientId: string;
  ownerId: string;
  consultationId?: string;
  type: 'Vaccination' | 'Follow-up' | 'Deworming' | 'Lab Work' | 'Other';
  description: string;
  dueDate: string;
  status: 'Pending' | 'Sent' | 'Completed' | 'Cancelled';
  method?: 'SMS' | 'Email' | 'Both';
}

export interface Consultation {
  id: string;
  tenantId: string;
  petId: string;
  ownerId: string;
  date: string;
  vetName: string;
  status: 'Draft' | 'Finalized';
  
  vitals: Vitals;

  chiefComplaint: string;
  history: string;
  
  previousTreatmentId?: string;
  previousDiagnosis?: string;

  exam: {
    general?: string;
    respiratory?: string;
    cardiovascular?: string;
    digestive?: string;
    musculoskeletal?: string;
    nervous?: string;
    integumentary?: string;
    eyes?: string;
    ears?: string;
    lymphNodes?: string;
    other?: string;
  };

  diagnosis: {
    tentative: string;
    differentials: string[];
    confirmatory?: string;
  };

  plan: string;
  labRequests: string[];
  prescription: PrescriptionItem[];
  attachments: Attachment[];
  
  reminder?: Reminder; 

  financials: {
    serviceFee: number;
    discount: number;
    total: number;
    amountPaid: number;
    paymentMethod?: 'Cash' | 'Card' | 'Bank Transfer' | 'Part Payment' | 'Not Paid';
    paymentStatus: 'Pending' | 'Paid' | 'Partially Paid';
    invoiceId?: string;
    receiptId?: string;
  };
}

export interface Pet {
  id: string;
  tenantId: string;
  name: string;
  species: Species;
  breed: string;
  age: number;
  gender: 'Male' | 'Female';
  ownerId: string;
  imageUrl: string;
  vitalsHistory: Vitals[];
  notes: MedicalNote[];
  allergies: string[];
  type: 'Single' | 'Herd';
  color: string;
  medicalConditions: string[];
  initialWeight?: number; 
  vaccinations?: VaccinationRecord[]; 
  reminders?: Reminder[]; 
}

export interface Appointment {
  id: string;
  tenantId: string;
  petId?: string;
  ownerId?: string | null;
  walkInName?: string;
  date: string;
  reason: string;
  status: AppointmentStatus;
  doctorName: string;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  category: 'Medicine' | 'Food' | 'Supply' | 'Service';
  type: 'Product' | 'Service';
  sku: string;
  stock: number;
  purchasePrice: number;
  retailPrice: number;
  wholesalePrice: number;
  reorderLevel: number;
  expiryDate?: string;
  
  // New fields for robust inventory & build fix
  unit?: string;
  location?: string;
  batchNumber?: string;
  supplier?: string;
  lastUpdated?: string;
}

export interface LabResult {
  id: string;
  tenantId: string;
  petId?: string;
  patientName?: string;
  ownerName?: string;
  consultationId?: string;
  testName: string;
  requestDate: string;
  completionDate?: string;
  status: 'Pending' | 'Processing' | 'Completed';
  result?: string;
  resultUrl?: string;
  notes?: string;
  requestedBy: string;
  conductedBy?: string;
  cost?: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Invoice' | 'Receipt' | 'Payment';
  description: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface CommunicationLog {
  id: string;
  date: string;
  type: 'Call' | 'Email' | 'SMS' | 'In-Person';
  summary: string;
  staffName: string;
}

export interface SaleItem {
  inventoryItemId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  method: 'Cash' | 'Card' | 'Transfer' | 'Credit';
  amount: number;
  date: string;
}

export interface SaleRecord {
  id: string;
  tenantId: string;
  date: string;
  clientId?: string;
  clientName: string; 
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'Draft' | 'Pending' | 'Paid' | 'Void';
  invoiceNumber?: string;
  receiptNumber?: string;
  payments: Payment[];
  notes?: string;
}

export interface Expense {
    id: string;
    tenantId: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
}

export interface LogEntry {
  id: string;
  tenantId: string;
  timestamp: string;
  user: string;
  action: string;
  details?: string;
  type: 'clinical' | 'admin' | 'system' | 'financial';
}

export type UserRole = 'Admin' | 'Veterinarian' | 'Veterinary Assistant' | 'Receptionist' | 'Accountant' | 'Security' | 'SuperAdmin' | 'Support';

export interface StaffMember {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    password?: string;
    roles: UserRole[];
    avatarUrl?: string;
    isSuspended: boolean;
}

export type ViewType = 
  | 'dashboard' 
  | 'clients' 
  | 'patients' 
  | 'treatments' 
  | 'appointments' 
  | 'inventory' 
  | 'pos' 
  | 'lab' 
  | 'reports' 
  | 'logs' 
  | 'settings'
  | 'expenses'
  | 'superadmin';

export interface AppState {
  currentUser: UserProfile | null;
  currentTenantId: string;
  tenants: Tenant[];
  pets: Pet[];
  owners: Owner[];
  appointments: Appointment[];
  consultations: Consultation[];
  sales: SaleRecord[];
  inventory: InventoryItem[];
  labResults: LabResult[];
  logs: LogEntry[];
  staff: StaffMember[];
  subscriptionPlans: SubscriptionPlan[];
  supportTickets: SupportTicket[];
  expenses: Expense[];
  branches?: Tenant[];
  currency?: string; 
}
