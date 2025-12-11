import { prisma } from '../lib/prisma';

// --- CONSTANTS ---

export const DEFAULT_PLANS = [
    {
        id: 'Trial',
        name: 'Trial',
        priceMonthly: 100,
        priceYearly: 1000,
        features: JSON.stringify(['Full Access for Testing', 'Limited Time', 'Single User']),
        limits: JSON.stringify({ 
            maxUsers: 1, 
            maxClients: 10, 
            maxStorageGB: 0.5, 
            modules: { pos: true, lab: true, ai: true, reports: true, multiBranch: false } 
        })
    },
    {
        id: 'Starter',
        name: 'Starter',
        priceMonthly: 7000,
        priceYearly: 70000,
        features: JSON.stringify(['2 Users Max', 'Max 50 Clients', 'Basic Inventory & Sales', 'No Printing/Downloads', 'No AI Features']),
        limits: JSON.stringify({ 
            maxUsers: 2, 
            maxClients: 50, 
            maxStorageGB: 2, 
            modules: { pos: true, lab: false, ai: false, reports: false, multiBranch: false, print: false } 
        })
    },
    {
        id: 'Standard',
        name: 'Standard',
        priceMonthly: 30000,
        priceYearly: 300000,
        features: JSON.stringify(['7 Users Max', 'Unlimited Clients', 'Full Reports & Printing', 'Limited AI (200/mo)', 'Lab Module']),
        limits: JSON.stringify({ 
            maxUsers: 7, 
            maxClients: -1, 
            maxStorageGB: 10, 
            modules: { pos: true, lab: true, ai: true, reports: true, multiBranch: false, print: true, aiLimit: 200 } 
        })
    },
    {
        id: 'Premium',
        name: 'Premium',
        priceMonthly: 70000,
        priceYearly: 700000,
        features: JSON.stringify(['Unlimited Users', 'Unlimited AI', 'Multi-Branch Management', 'Staff Transfer', 'Priority Support']),
        limits: JSON.stringify({ 
            maxUsers: -1, 
            maxClients: -1, 
            maxStorageGB: 100, 
            modules: { pos: true, lab: true, ai: true, reports: true, multiBranch: true, print: true, aiLimit: -1 } 
        })
    }
];

// --- LOGGING HELPER ---

export const createLog = async (tenantId: string, user: string, action: string, type: string, details: string = '') => {
    // Fire and forget (don't await) to prevent slowing down the main request
    prisma.log.create({ 
        data: { tenantId, user, action, type, details } 
    }).catch(e => console.error(`[LOG ERROR] Failed to log ${action}:`, e.message));
};

// --- LIMITS & QUOTA CHECKER ---

export const checkLimits = async (
    tenantId: string, 
    resourceType: 'storage' | 'users' | 'clients', 
    incrementAmount: number = 0
) => {
    // Fetch Tenant with counts
    const tenant = await prisma.tenant.findUnique({ 
        where: { id: tenantId },
        include: { 
            _count: { 
                select: { users: true, pets: true, owners: true } 
            } 
        }
    });
    
    if (!tenant) throw new Error("Tenant not found");
    
    // Check Status
    if (tenant.status === 'Restricted' || tenant.status === 'Suspended') {
        throw new Error("Account restricted. Please contact support or update payment.");
    }

    // Get Plan Limits
    const plan = await prisma.plan.findUnique({ where: { id: tenant.plan } });
    if (!plan) return tenant; // Fallback: If no plan found, assume unlimited (or handle error)

    const limits = JSON.parse(plan.limits);
    const maxStorageMB = (limits.maxStorageGB || 1) * 1024;

    // 1. Storage Check
    if (resourceType === 'storage') {
        if (tenant.storageUsed + incrementAmount > maxStorageMB) {
            throw new Error(`Storage quota exceeded (${limits.maxStorageGB}GB limit).`);
        }
    }

    // 2. User Check
    if (resourceType === 'users' && limits.maxUsers !== -1) {
        // Current users + new user
        if ((tenant._count.users + incrementAmount) > limits.maxUsers) {
            throw new Error(`User limit reached (${limits.maxUsers} users max). Upgrade plan.`);
        }
    }

    // 3. Client Check
    if (resourceType === 'clients' && limits.maxClients !== -1) {
        // Note: Using owners count as "clients"
        if ((tenant._count.owners + incrementAmount) > limits.maxClients) {
            throw new Error(`Client limit reached (${limits.maxClients} clients max). Upgrade plan.`);
        }
    }

    return tenant;
};

// --- STORAGE TRACKER ---

export const trackStorage = async (tenantId: string, mbUsed: number) => {
    try {
        await prisma.tenant.update({ 
            where: { id: tenantId }, 
            data: { storageUsed: { increment: mbUsed } } 
        });
    } catch (e) {
        console.error("Failed to track storage usage", e);
    }
};

// --- PAYMENT VERIFICATION ---

export const verifyPayment = async (transactionId: string): Promise<boolean> => {
    try {
        // Mock verification for Development or special Trial codes
        if (
            process.env.NODE_ENV !== 'production' && 
            (transactionId.startsWith('mock-') || transactionId === 'TRIAL')
        ) {
            return true; 
        }

        if (!process.env.FLUTTERWAVE_SECRET_KEY) {
            console.error("Missing FLUTTERWAVE_SECRET_KEY");
            return false;
        }

        const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` 
            }
        });

        if (!response.ok) return false;

        const data = await response.json();
        return data.status === 'success' && data.data.status === 'successful';
    } catch (error) { 
        console.error("Payment verification failed", error);
        return false; 
    }
};