import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';
import { generateId } from './utils/idGenerator';
import { sendEmail } from './utils/email';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

// --- MIDDLEWARE: AUTHENTICATION ---
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;
        let token: string | undefined;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (request.cookies && request.cookies.token) {
            token = request.cookies.token;
        }

        if (!token) return reply.status(401).send({ error: 'Unauthorized: No token provided' });

        const decoded: any = jwt.verify(token, JWT_SECRET);
        request.user = decoded; // Attach user to request
    } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
    }
}

export async function appRoutes(app: FastifyInstance) {

    // ==========================================
    // 1. AUTHENTICATION ROUTES
    // ==========================================
    
    // LOGIN
    app.post('/auth/login', async (req: FastifyRequest<{ Body: any }>, reply) => {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });

        if (!user || !user.tenant) return reply.status(401).send({ error: 'Invalid credentials' });

        const validPass = await bcrypt.compare(password, user.passwordHash);
        if (!validPass) return reply.status(401).send({ error: 'Invalid credentials' });

        if (user.isSuspended) return reply.status(403).send({ error: 'Account suspended' });

        const token = jwt.sign(
            { id: user.id, email: user.email, tenantId: user.tenantId, role: JSON.parse(user.roles as string)[0] },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set Cookie (HttpOnly)
        reply.setCookie('token', token, {
            path: '/',
            httpOnly: true,
            secure: true, // Always true for Render/Vercel
            sameSite: 'none', // Critical for Cross-Domain
            maxAge: 60 * 60 * 24 * 7 // 7 Days
        });

        // Return Token + User Data
        return { 
            token, // Frontend needs this for localStorage
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                roles: JSON.parse(user.roles as string), 
                avatarUrl: user.avatarUrl 
            },
            tenant: user.tenant
        };
    });

    // SIGNUP
    app.post('/auth/signup', async (req: FastifyRequest<{ Body: any }>, reply) => {
        const { name, email, password, clinicName, plan, country, billingPeriod } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return reply.status(400).send({ error: 'Email already exists' });

        const tenantId = `tenant-${Date.now()}`;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Tenant & User Transaction
        await prisma.$transaction(async (tx) => {
            await tx.tenant.create({
                data: {
                    id: tenantId,
                    name: clinicName,
                    plan: plan || 'Trial',
                    billingPeriod: billingPeriod || 'Monthly',
                    status: 'Active',
                    settings: JSON.stringify({ currency: country === 'Nigeria' ? 'NGN' : 'USD', country })
                }
            });

            await tx.user.create({
                data: {
                    id: `u-${Date.now()}`,
                    tenantId,
                    name,
                    email,
                    passwordHash: hashedPassword,
                    roles: JSON.stringify(['Admin']),
                    isVerified: true
                }
            });
        });

        return { success: true, message: 'Account created successfully' };
    });

    // GET ME (Session Check)
    app.get('/auth/me', { preHandler: [authenticate] }, async (req: FastifyRequest, reply) => {
        const user = await prisma.user.findUnique({
            where: { id: (req.user as any).id },
            include: { tenant: true }
        });
        if (!user) return reply.status(401).send({ error: 'User not found' });
        
        return {
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                roles: JSON.parse(user.roles as string), 
                avatarUrl: user.avatarUrl 
            },
            tenant: user.tenant
        };
    });

    // LOGOUT
    app.post('/auth/logout', async (req, reply) => {
        reply.clearCookie('token', { path: '/', sameSite: 'none', secure: true });
        return { success: true };
    });


    // ==========================================
    // 2. PATIENT ROUTES
    // ==========================================
    app.get('/patients', { preHandler: [authenticate] }, async (req) => {
        const tenantId = (req.user as any).tenantId;
        return await prisma.patient.findMany({ 
            where: { tenantId }, 
            orderBy: { createdAt: 'desc' },
            include: { owner: true } // Include owner details for list view
        });
    });

    app.post('/patients', { preHandler: [authenticate] }, async (req: FastifyRequest<{ Body: any }>) => {
        const tenantId = (req.user as any).tenantId;
        // Ensure ownerId exists or create logic is handled by frontend
        return await prisma.patient.create({
            data: { ...req.body, tenantId, id: generateId('P') }
        });
    });

    app.get('/patients/:id', { preHandler: [authenticate] }, async (req: any) => {
        return await prisma.patient.findFirst({
            where: { id: req.params.id, tenantId: req.user.tenantId },
            include: { owner: true, medicalHistory: true, vaccinations: true }
        });
    });


    // ==========================================
    // 3. OWNER / CLIENT ROUTES
    // ==========================================
    app.get('/owners', { preHandler: [authenticate] }, async (req) => {
        const tenantId = (req.user as any).tenantId;
        return await prisma.owner.findMany({ 
            where: { tenantId }, 
            orderBy: { name: 'asc' },
            include: { pets: true }
        });
    });

    app.post('/owners', { preHandler: [authenticate] }, async (req: FastifyRequest<{ Body: any }>) => {
        const tenantId = (req.user as any).tenantId;
        return await prisma.owner.create({
            data: { ...req.body, tenantId, id: generateId('CL') }
        });
    });


    // ==========================================
    // 4. INVENTORY & SALES
    // ==========================================
    app.get('/inventory', { preHandler: [authenticate] }, async (req) => {
        return await prisma.inventoryItem.findMany({ where: { tenantId: (req.user as any).tenantId } });
    });

    app.post('/inventory', { preHandler: [authenticate] }, async (req: FastifyRequest<{ Body: any }>) => {
        return await prisma.inventoryItem.create({
            data: { ...req.body, tenantId: (req.user as any).tenantId, id: generateId('INV') }
        });
    });

    app.get('/sales', { preHandler: [authenticate] }, async (req) => {
        return await prisma.sale.findMany({ 
            where: { tenantId: (req.user as any).tenantId },
            orderBy: { date: 'desc' }
        });
    });

    app.post('/sales/checkout', { preHandler: [authenticate] }, async (req: FastifyRequest<{ Body: any }>) => {
        const tenantId = (req.user as any).tenantId;
        const { items, ...saleData } = req.body;

        // Transaction: Create Sale + Deduct Stock
        return await prisma.$transaction(async (tx) => {
            // 1. Create Sale Record
            const sale = await tx.sale.create({
                data: { ...saleData, tenantId, id: generateId('SLE') }
            });

            // 2. Update Inventory
            if (items && Array.isArray(items)) {
                for (const item of items) {
                    if (item.itemId) {
                        await tx.inventoryItem.updateMany({
                            where: { id: item.itemId, tenantId },
                            data: { stock: { decrement: item.quantity || 1 } }
                        });
                    }
                }
            }
            return sale;
        });
    });


    // ==========================================
    // 5. APPOINTMENTS
    // ==========================================
    app.get('/appointments', { preHandler: [authenticate] }, async (req) => {
        return await prisma.appointment.findMany({ 
            where: { tenantId: (req.user as any).tenantId },
            include: { patient: true, client: true }
        });
    });

    app.post('/appointments', { preHandler: [authenticate] }, async (req: FastifyRequest<{ Body: any }>) => {
        return await prisma.appointment.create({
            data: { ...req.body, tenantId: (req.user as any).tenantId, id: generateId('APT') }
        });
    });


    // ==========================================
    // 6. CLINICAL (Consultations, Labs)
    // ==========================================
    app.get('/consultations', { preHandler: [authenticate] }, async (req) => {
        return await prisma.consultation.findMany({ where: { tenantId: (req.user as any).tenantId } });
    });

    app.post('/consultations', { preHandler: [authenticate] }, async (req: FastifyRequest<{ Body: any }>) => {
        return await prisma.consultation.create({
            data: { ...req.body, tenantId: (req.user as any).tenantId, id: generateId('CNS') }
        });
    });

    app.get('/labs', { preHandler: [authenticate] }, async (req) => {
        return await prisma.labResult.findMany({ where: { tenantId: (req.user as any).tenantId } });
    });

    app.post('/labs', { preHandler: [authenticate] }, async (req: FastifyRequest<{ Body: any }>) => {
        return await prisma.labResult.create({
            data: { ...req.body, tenantId: (req.user as any).tenantId, id: generateId('LAB') }
        });
    });


    // ==========================================
    // 7. MISC (Expenses, Logs, Users, Settings)
    // ==========================================
    app.get('/expenses', { preHandler: [authenticate] }, async (req) => {
        return await prisma.expense.findMany({ where: { tenantId: (req.user as any).tenantId } });
    });
    
    app.post('/expenses', { preHandler: [authenticate] }, async (req: FastifyRequest<{ Body: any }>) => {
        return await prisma.expense.create({ data: { ...req.body, tenantId: (req.user as any).tenantId } });
    });

    app.get('/users', { preHandler: [authenticate] }, async (req) => {
        return await prisma.user.findMany({ where: { tenantId: (req.user as any).tenantId } });
    });

    app.get('/branches', { preHandler: [authenticate] }, async (req) => {
        // Mock or implement Branch model
        return []; 
    });

    app.get('/logs', { preHandler: [authenticate] }, async (req) => {
        return await prisma.auditLog.findMany({ 
            where: { tenantId: (req.user as any).tenantId },
            orderBy: { timestamp: 'desc' },
            take: 100 
        });
    });

    app.patch('/settings', { preHandler: [authenticate] }, async (req: FastifyRequest<{ Body: any }>) => {
        const tenantId = (req.user as any).tenantId;
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        
        let currentSettings = {};
        try { currentSettings = JSON.parse(tenant?.settings as string || '{}'); } catch(e) {}

        const newSettings = JSON.stringify({ ...currentSettings, ...req.body });

        return await prisma.tenant.update({
            where: { id: tenantId },
            data: { settings: newSettings }
        });
    });


    // ==========================================
    // 8. CLIENT PORTAL ROUTES
    // ==========================================
    app.post('/portal/login', async (req: FastifyRequest<{ Body: any }>, reply) => {
        const { email, password } = req.body;
        // Logic to authenticate Owner via Email/Password (if you added password to Owner model)
        // For now, simple check:
        const owner = await prisma.owner.findFirst({ where: { email } });
        if (!owner) return reply.status(401).send({ error: 'Client not found' });
        
        // Use a client-specific secret or logic
        const token = jwt.sign({ id: owner.id, tenantId: owner.tenantId, role: 'CLIENT' }, JWT_SECRET, { expiresIn: '7d' });
        return { token, owner };
    });

    app.get('/portal/dashboard', { preHandler: [authenticate] }, async (req) => {
        // Return summary for logged in client
        return { message: "Welcome to Portal" };
    });

}
