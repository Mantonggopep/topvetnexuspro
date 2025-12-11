import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// --- UPDATED INTERFACE ---
export interface AuthUser {
  id: string;
  tenantId: string;
  roles: string[];
  name: string;
  type: 'STAFF' | 'CLIENT'; // <--- Added to distinguish context
}

export type AuthenticatedRequest = FastifyRequest & {
  user?: AuthUser;
};

interface JwtPayload {
  userId: string;
  tenantId: string;
  name?: string;
  type?: 'STAFF' | 'CLIENT'; // <--- Added to JWT payload
  iat: number;
  exp: number;
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = request.cookies?.token || request.headers.authorization?.split(' ')[1];

  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized: No token provided' });
  }

  try {
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing");
        return reply.status(500).send({ error: 'Internal Server Error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    
    // Default to STAFF for backward compatibility with existing tokens
    const userType = decoded.type || 'STAFF'; 

    if (userType === 'CLIENT') {
        // --- CLIENT (OWNER) AUTHENTICATION ---
        const owner = await prisma.owner.findUnique({
            where: { id: decoded.userId },
            select: { id: true, tenantId: true, name: true, isPortalActive: true }
        });

        if (!owner) {
            return reply.status(401).send({ error: 'Client account not found' });
        }

        if (!owner.isPortalActive) {
            return reply.status(403).send({ error: 'Client portal access is not active' });
        }

        (request as AuthenticatedRequest).user = {
            id: owner.id,
            tenantId: owner.tenantId,
            roles: ['CLIENT'], // Virtual role for clients
            name: owner.name,
            type: 'CLIENT'
        };

    } else {
        // --- STAFF (USER) AUTHENTICATION ---
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, tenantId: true, roles: true, isSuspended: true, name: true }
        });

        if (!user) {
            return reply.status(401).send({ error: 'User not found' });
        }

        if (user.isSuspended) {
            return reply.status(403).send({ error: 'Account suspended' });
        }

        let roles: string[] = [];
        try {
            roles = JSON.parse(user.roles as string);
        } catch (e) {
            roles = [user.roles as string];
        }

        (request as AuthenticatedRequest).user = {
            id: user.id,
            tenantId: user.tenantId,
            roles: roles,
            name: user.name,
            type: 'STAFF'
        };
    }

  } catch (err) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    if (!req.user || !req.user.roles.some(role => allowedRoles.includes(role))) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
};
