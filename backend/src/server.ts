import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
import { DEFAULT_PLANS } from './utils/serverHelpers';
import { appRoutes } from './routes'; 

const app: FastifyInstance = Fastify({ 
  logger: { level: 'info' },
  trustProxy: true, // Required for Render HTTPS
  bodyLimit: 1048576 * 10 
});

const PORT = parseInt(process.env.PORT || '4000');

// 1. Security Headers (Disable CSP on backend, Frontend handles it)
app.register(helmet, { contentSecurityPolicy: false, global: true });

// 2. CORS Configuration
app.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = [
      'http://localhost:5173', 
      'http://localhost:3000',
      'https://topvetnexuspro.vercel.app', 
      'https://vetnexuspro.vercel.app',
    ];
    // Allow if origin matches or if no origin (backend tools)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      cb(null, true);
      return;
    }
    // Strict in production, lax in dev
    if (process.env.NODE_ENV !== 'production') {
      cb(null, true);
      return;
    }
    cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true, // Allows Cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
});

app.register(cookie, { secret: process.env.COOKIE_SECRET || 'vnx-secret', hook: 'onRequest' });

app.register(async (api) => {
    api.get('/health', async () => { return { status: 'ok', timestamp: new Date() } });
    await api.register(appRoutes);
}, { prefix: '/api' });

const start = async () => {
  try {
    await prisma.$connect();
    app.log.info("✅ Connected to Database");

    // Seed Plans
    if (DEFAULT_PLANS) {
      for (const p of DEFAULT_PLANS) await prisma.plan.upsert({ where: { id: p.id }, update: p, create: p });
    }

    // Seed System
    const systemTenant = await prisma.tenant.upsert({ 
        where: { id: 'system' }, update: {}, 
        create: { id: 'system', name: 'System Admin', plan: 'Enterprise', settings: JSON.stringify({ currency: 'USD' }), storageUsed: 0 } 
    });

    const adminEmail = 'mantonggopep@gmail.com'; 
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail }});
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('12doctor12', 10);
        await prisma.user.create({
            data: { tenantId: systemTenant.id, name: 'Super Admin', email: adminEmail, passwordHash: hashedPassword, roles: JSON.stringify(['SuperAdmin']), isVerified: true, isSuspended: false }
        });
    }

    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`🚀 Server running on port ${PORT}`);

  } catch (err) { 
    app.log.error(err);
    process.exit(1); 
  }
};

start();