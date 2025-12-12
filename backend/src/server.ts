import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
import { DEFAULT_PLANS } from './utils/serverHelpers';

// --- ROUTE IMPORT ---
import { appRoutes } from './routes'; 

// --- SERVER SETUP ---
// We use the standard JSON logger here to avoid "pino-pretty" errors in production.
const app: FastifyInstance = Fastify({ 
  logger: { level: 'info' }, 
  // Keep the 10MB limit for file uploads/images
  bodyLimit: 1048576 * 10 
});

const PORT = parseInt(process.env.PORT || '4000');

// --- PLUGINS ---

// 1. Security Headers
app.register(helmet, { contentSecurityPolicy: false, global: true });

// 2. CORS Configuration
app.register(cors, {
  origin: (origin, cb) => {
    // Allow non-browser requests
    if (!origin) return cb(null, true);

    const allowedExact = [
      'http://localhost:5173', 
      'http://localhost:4173',
      'http://localhost:3000',
      'https://vetnexuspro.vercel.app', 
      process.env.CLIENT_URL?.replace(/\/$/, '') 
    ].filter(Boolean);

    if (allowedExact.includes(origin)) return cb(null, true);
    if (origin.endsWith('.vercel.app')) return cb(null, true);

    if (process.env.NODE_ENV !== 'production') {
      app.log.warn(`⚠️ Dev CORS Allowed: ${origin}`);
      return cb(null, true);
    }

    app.log.warn(`🚫 Blocked CORS request from: ${origin}`);
    return cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
});

// 3. Cookie Parser
app.register(cookie, { 
  secret: process.env.COOKIE_SECRET || 'super-secret-key-change-in-prod', 
  hook: 'onRequest',
  parseOptions: {} 
});

// --- REGISTER ROUTES ---
app.register(async (api) => {
    // 1. Health Check
    api.get('/health', async () => { return { status: 'ok', timestamp: new Date() } });

    // 2. Main Routes
    await api.register(appRoutes);
}, { prefix: '/api' });


// --- START & SEED ---
const start = async () => {
  try {
    if (!process.env.JWT_SECRET) app.log.warn("⚠️ WARNING: JWT_SECRET not set.");
    if (!process.env.DATABASE_URL) app.log.warn("⚠️ WARNING: DATABASE_URL not set.");

    // 1. Connect DB
    await prisma.$connect();
    app.log.info("✅ Connected to Database");

    // 2. Seed Plans
    if (DEFAULT_PLANS && DEFAULT_PLANS.length > 0) {
      for (const p of DEFAULT_PLANS) {
          await prisma.plan.upsert({ where: { id: p.id }, update: p, create: p });
      }
      app.log.info("✅ Plans Seeded");
    }

    // 3. Seed System Tenant
    const systemTenant = await prisma.tenant.upsert({ 
        where: { id: 'system' }, 
        update: {}, 
        create: { 
          id: 'system', 
          name: 'System Admin', 
          plan: 'Enterprise', 
          settings: JSON.stringify({ currency: 'USD', timezone: 'UTC' }), 
          storageUsed: 0 
        } 
    });

    // 4. Seed Super Admin User
    const adminEmail = 'mantonggopep@gmail.com'; 
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail }});
    
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('12doctor12', 10);
        await prisma.user.create({
            data: { 
                tenantId: systemTenant.id, 
                name: 'Super Admin', 
                email: adminEmail, 
                passwordHash: hashedPassword, 
                roles: JSON.stringify(['SuperAdmin']),
                isVerified: true,
                isSuspended: false
            }
        });
        app.log.info("✅ Super Admin Created");
    }

    // 5. Start Server
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`🚀 Server running on port ${PORT}`);

  } catch (err) { 
    app.log.error(err);
    process.exit(1); 
  }
};

start();
