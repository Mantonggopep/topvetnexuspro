import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export async function ownerRoutes(app: FastifyInstance) {
  
  // GET ALL OWNERS
  app.get('/', async (request, reply) => {
    try {
      const owners = await prisma.owner.findMany({
        orderBy: { createdAt: 'desc' },
        include: { pets: true } 
      });
      return reply.send(owners);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch owners' });
    }
  });

  // CREATE OWNER
  app.post('/', async (request, reply) => {
    const { name, email, phone, address } = request.body as any;
    
    try {
      const clientNumber = `CL-${Math.floor(10000 + Math.random() * 90000)}`;

      const owner = await prisma.owner.create({
        data: {
          tenantId: 'system',
          name,
          email,
          phone,
          address,
          clientNumber
        }
      });
      return reply.send(owner);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to create owner' });
    }
  });

  // ACTIVATE PORTAL
  app.patch('/:id/portal', async (request, reply) => {
    const { id } = request.params as any;
    const { password, isActive } = request.body as any;

    try {
      const updateData: any = {
        isPortalActive: isActive
      };

      if (password && password.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(password, salt);
      }

      const updatedOwner = await prisma.owner.update({
        where: { id },
        data: updateData
      });

      // Remove password hash from response
      const { passwordHash, ...safeOwner } = updatedOwner;
      return reply.send(safeOwner);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to update portal access' });
    }
  });
}