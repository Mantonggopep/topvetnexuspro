import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me';

// --- TYPES ---
interface AuthenticatedUser {
  id: string;
  tenantId: string;
  roles: string[];
  name: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

// --- HELPER: ID Generator ---
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// --- HELPER: Safe JSON Parser ---
const safeParse = (data: string | null | undefined, fallback: any = []) => {
  if (!data) return fallback;
  try { return JSON.parse(data); } catch { return fallback; }
};

// --- HELPER: Internal Logger ---
async function createLog(tenantId: string, user: string, action: string, type: string, details?: string) {
  try {
    await prisma.log.create({
      data: { tenantId, user, action, type, details: details || '' }
    });
  } catch (e) { console.error("Log failed:", e); }
}

// =================================================================
// MAIN ROUTES FUNCTION
// =================================================================
export async function appRoutes(app: FastifyInstance) {

  // =================================================================
  // 1. PUBLIC ROUTES
  // =================================================================

  app.get('/plans', async () => {
    return prisma.plan.findMany();
  });

  app.post('/auth/login', async (req, reply) => {
    const body = req.body as any;
    const { email, password } = body;
    try {
      const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });
      if (!user) return reply.code(401).send({ error: 'Invalid credentials' });

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return reply.code(401).send({ error: 'Invalid credentials' });

      if (user.isSuspended) return reply.code(403).send({ error: 'Account suspended' });

      const roles = safeParse(user.roles, ['Veterinarian']);
      const token = jwt.sign({ userId: user.id, tenantId: user.tenantId, roles }, JWT_SECRET, { expiresIn: '7d' });

      reply.setCookie('token', token, { 
        path: '/', 
        httpOnly: true, 
        secure: true, // Always true for Render
        sameSite: 'none' 
      });
      
      return { 
          success: true, 
          token, 
          user: { ...user, roles }, 
          tenant: user.tenant 
      };
    } catch (e) { return reply.code(500).send({ error: 'Login failed' }); }
  });

  app.post('/auth/logout', async (req, reply) => {
    reply.clearCookie('token', { path: '/', sameSite: 'none', secure: true });
    return { success: true };
  });

  app.post('/portal/login', async (req, reply) => {
    const body = req.body as any;
    const { email, phone, password } = body;
    try {
      const owner = await prisma.owner.findFirst({
        where: { OR: [{ email: email || undefined }, { phone: phone || undefined }] }
      });
      if (!owner || !owner.isPortalActive || !owner.passwordHash) {
        return reply.code(403).send({ error: 'Portal access invalid or disabled.' });
      }
      const isValid = await bcrypt.compare(password, owner.passwordHash);
      if (!isValid) return reply.code(401).send({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { userId: owner.id, tenantId: owner.tenantId, type: 'CLIENT', name: owner.name },
        JWT_SECRET, { expiresIn: '7d' }
      );

      reply.setCookie('client_token', token, { 
        path: '/', 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none' 
      });
      return { success: true, token, user: { id: owner.id, name: owner.name } };
    } catch (e) { return reply.code(500).send({ error: 'Portal login failed' }); }
  });

  // =================================================================
  // 2. CLIENT PORTAL ROUTES
  // =================================================================
  app.register(async (portal) => {
    portal.addHook('preHandler', async (req, reply) => {
      try {
        const token = req.cookies.client_token || (req.headers.authorization as string)?.replace('Bearer ', '');
        if (!token) throw new Error('No token');
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'CLIENT') throw new Error('Invalid token type');
        req.user = { id: decoded.userId, tenantId: decoded.tenantId, roles: ['Client'], name: decoded.name };
      } catch (err) { return reply.code(401).send({ error: 'Portal Unauthorized' }); }
    });

    portal.get('/portal/dashboard', async (req) => {
      const ownerId = req.user!.id;
      const [pets, appointments, invoices] = await Promise.all([
        prisma.pet.findMany({ where: { ownerId } }),
        prisma.appointment.findMany({ where: { ownerId }, orderBy: { date: 'desc' }, take: 5 }),
        prisma.saleRecord.findMany({ where: { ownerId }, orderBy: { date: 'desc' }, take: 5 })
      ]);
      return { pets, appointments, invoices };
    });

    portal.post('/portal/appointments', async (req) => {
      const body = req.body as any;
      return prisma.appointment.create({
        data: {
          id: generateId('APT'),
          tenantId: req.user!.tenantId,
          ownerId: req.user!.id,
          petId: body.petId,
          date: new Date(body.date),
          reason: body.reason,
          status: 'Scheduled',
          doctorName: 'Pending'
        }
      });
    });
    
    portal.get('/portal/pets', async (req) => {
       return prisma.pet.findMany({ where: { ownerId: req.user!.id } });
    });
  });

  // =================================================================
  // 3. STAFF PROTECTED ROUTES
  // =================================================================
  app.register(async (api) => {
    api.addHook('preHandler', async (req, reply) => {
      try {
        const token = req.cookies.token || (req.headers.authorization as string)?.replace('Bearer ', '');
        if (!token) throw new Error('Missing token');
        const decoded: any = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.userId, tenantId: decoded.tenantId, roles: decoded.roles, name: 'Staff' }; 
      } catch (err) { return reply.code(401).send({ error: 'Unauthorized' }); }
    });

    // --- AUTH & USER ---
    api.get('/auth/me', async (req) => {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { tenant: true } });
      if (!user) throw new Error('User not found');
      
      // ✅ FIXED: Returns correct nested structure { user, tenant } so Frontend works
      return { 
          user: {
            ...user,
            roles: safeParse(user.roles)
          },
          tenant: user.tenant
      };
    });

    api.get('/users', async (req) => {
        const users = await prisma.user.findMany({ where: { tenantId: req.user!.tenantId } });
        return users.map(u => ({ ...u, roles: safeParse(u.roles) }));
    });

    api.post('/users', async (req, reply) => {
        const body = req.body as any;
        const { name, email, password, roles } = body;
        try {
            const newUser = await prisma.user.create({
                data: {
                    id: generateId('USR'),
                    tenantId: req.user!.tenantId,
                    name, email,
                    passwordHash: await bcrypt.hash(password, 10),
                    roles: JSON.stringify(roles || ['Veterinarian']),
                    isVerified: true
                }
            });
            return { id: newUser.id, email: newUser.email };
        } catch(e) { return reply.code(400).send({ error: "Email exists" }); }
    });

    // --- DASHBOARD ---
    api.get('/stats/dashboard', async (req) => {
        const tenantId = req.user!.tenantId;
        const [clients, patients, revenue, appointments] = await Promise.all([
            prisma.owner.count({ where: { tenantId } }),
            prisma.pet.count({ where: { tenantId } }),
            prisma.saleRecord.aggregate({ where: { tenantId }, _sum: { total: true } }),
            prisma.appointment.count({ where: { tenantId, date: { gte: new Date() } } })
        ]);
        return { clients, patients, revenue: revenue._sum.total || 0, appointments };
    });

    // --- PATIENTS ---
    api.get('/patients', async (req) => {
        const patients = await prisma.pet.findMany({
            where: { tenantId: req.user!.tenantId },
            include: { owner: { select: { name: true, phone: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        return patients.map(p => ({
            ...p,
            vitalsHistory: safeParse(p.vitalsHistory),
            notes: safeParse(p.notes),
            allergies: safeParse(p.allergies),
            vaccinations: safeParse(p.vaccinations)
        }));
    });

    api.post('/patients', async (req) => {
        const body = req.body as any;
        const { name, species, breed, age, gender, ownerId, color } = body;
        const pet = await prisma.pet.create({
            data: {
                id: generateId('P'),
                tenantId: req.user!.tenantId,
                ownerId, name, species, breed, gender, color,
                age: Number(age) || 0,
                vitalsHistory: "[]", notes: "[]", allergies: "[]", medicalConditions: "[]", vaccinations: "[]"
            }
        });
        await createLog(req.user!.tenantId, req.user!.id, 'Created Patient', 'clinical', pet.name);
        return pet;
    });

    api.get('/patients/:id', async (req: any) => {
        const pet = await prisma.pet.findUnique({
            where: { id: req.params.id },
            include: { appointments: true, consultations: true, labResults: true }
        });
        if(!pet) return { error: "Not found" };
        return {
            ...pet,
            vitalsHistory: safeParse(pet.vitalsHistory),
            notes: safeParse(pet.notes),
            allergies: safeParse(pet.allergies),
            vaccinations: safeParse(pet.vaccinations)
        };
    });

    // --- OWNERS ---
    api.get('/owners', async (req) => {
        return prisma.owner.findMany({ where: { tenantId: req.user!.tenantId }, include: { _count: { select: { pets: true } } } });
    });
    api.post('/owners', async (req) => {
        const body = req.body as any;
        return prisma.owner.create({
            data: { 
                id: generateId('CL'),
                tenantId: req.user!.tenantId, 
                name: body.name, 
                phone: body.phone, 
                email: body.email, 
                address: body.address 
            }
        });
    });
    api.patch('/owners/:id/portal', async (req: any) => {
        const { password, isActive } = req.body;
        const data: any = { isPortalActive: isActive };
        if(password) data.passwordHash = await bcrypt.hash(password, 10);
        return prisma.owner.update({ where: { id: req.params.id }, data });
    });

    // --- CLINICAL ---
    api.get('/appointments', async (req: any) => {
        const where: any = { tenantId: req.user!.tenantId };
        if(req.query.date) {
             const start = new Date(req.query.date);
             const end = new Date(start); end.setDate(end.getDate() + 1);
             where.date = { gte: start, lt: end };
        }
        return prisma.appointment.findMany({ where, include: { pet: true, owner: true }, orderBy: { date: 'asc' } });
    });
    api.post('/appointments', async (req) => {
        const body = req.body as any;
        return prisma.appointment.create({
            data: { 
                id: generateId('APT'),
                tenantId: req.user!.tenantId, 
                petId: body.petId, 
                ownerId: body.ownerId, 
                date: new Date(body.date), 
                reason: body.reason, 
                status: 'Scheduled', 
                doctorName: body.doctorName 
            }
        });
    });
    api.get('/consultations', async (req) => {
         return prisma.consultation.findMany({ where: { tenantId: req.user!.tenantId }, orderBy: { date: 'desc' } });
    });
    api.post('/consultations', async (req) => {
        const body = req.body as any;
        return prisma.consultation.create({
            data: {
                id: generateId('CON'),
                tenantId: req.user!.tenantId,
                petId: body.petId,
                ownerId: body.ownerId,
                date: new Date(),
                vetName: req.user!.name || 'Staff',
                diagnosis: JSON.stringify(body.diagnosis || {}),
                plan: body.plan,
                exam: JSON.stringify(body.exam || {}),
                vitals: JSON.stringify(body.vitals || {})
            }
        });
    });

    // --- LABS ---
    api.get('/labs', async (req) => {
        return prisma.labResult.findMany({ where: { tenantId: req.user!.tenantId }, orderBy: { createdAt: 'desc' } });
    });
    api.post('/labs', async (req) => {
        const body = req.body as any;
        return prisma.labResult.create({
            data: {
                id: generateId('LAB'),
                tenantId: req.user!.tenantId,
                petId: body.petId,
                type: body.testType || 'General',
                result: body.result,
                status: body.status || 'Pending',
                date: new Date()
            }
        });
    });

    // --- BRANCHES ---
    api.get('/branches', async (req) => {
        return []; 
    });
    api.post('/branches', async (req) => {
        return { id: 'mock-id', name: 'Mock Branch' };
    });

    // --- LOGS ---
    api.get('/logs', async (req) => {
        return prisma.log.findMany({ where: { tenantId: req.user!.tenantId }, orderBy: { timestamp: 'desc' }, take: 100 });
    });

    // --- EXPENSES ---
    api.get('/expenses', async (req) => {
        return prisma.expense.findMany({ where: { tenantId: req.user!.tenantId }, orderBy: { date: 'desc' } });
    });
    api.post('/expenses', async (req) => {
        const body = req.body as any;
        return prisma.expense.create({
            data: {
                id: generateId('EXP'),
                tenantId: req.user!.tenantId,
                description: body.description,
                amount: Number(body.amount),
                category: body.category,
                paymentMethod: body.paymentMethod || 'Cash',
                date: new Date(body.date || Date.now())
            }
        });
    });

    // --- INVENTORY & SALES ---
    api.get('/inventory', async (req) => {
        return prisma.inventoryItem.findMany({ where: { tenantId: req.user!.tenantId } });
    });
    api.post('/inventory', async (req) => {
        const body = req.body as any;
        return prisma.inventoryItem.create({
            data: {
                id: generateId('INV'),
                tenantId: req.user!.tenantId,
                name: body.name,
                category: body.category,
                sku: body.sku,
                stock: Number(body.stock),
                retailPrice: Number(body.retailPrice),
                purchasePrice: Number(body.purchasePrice)
            }
        });
    });
    api.get('/sales', async (req) => {
        return prisma.saleRecord.findMany({ where: { tenantId: req.user!.tenantId }, orderBy: { date: 'desc' } });
    });
    api.post('/sales/checkout', async (req) => {
        const body = req.body as any;
        const { items, total, ownerId, paymentMethod, discount } = body;
        
        const sale = await prisma.$transaction(async (tx) => {
            const newSale = await tx.saleRecord.create({
                data: {
                    id: generateId('SLE'),
                    tenantId: req.user!.tenantId,
                    ownerId,
                    total: Number(total),
                    subtotal: Number(total), 
                    discount: Number(discount || 0),
                    status: 'Completed',
                    items: JSON.stringify(items),
                    payments: JSON.stringify([{ method: paymentMethod, amount: total, date: new Date() }]),
                    date: new Date()
                }
            });

            if (Array.isArray(items)) {
                for (const item of items) {
                    if (item.id) {
                        await tx.inventoryItem.updateMany({
                            where: { id: item.id, tenantId: req.user!.tenantId },
                            data: { stock: { decrement: Number(item.quantity || 1) } }
                        });
                    }
                }
            }
            return newSale;
        });

        await createLog(req.user!.tenantId, req.user!.id, 'New Sale', 'financial', `Total: ${total}`);
        return sale;
    });

    // --- AI ASSISTANT ---
    api.post('/ai/chat', async (req) => {
        const body = req.body as any; 
        return { answer: `AI Logic for "${body.prompt}" is not yet connected in this file.` };
    });

  });
}
