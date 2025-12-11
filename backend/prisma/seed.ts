import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("12doctor12", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "mantonggopep@gmail.com" },
    update: {},
    create: {
      name: "Mantong Gopep",
      email: "mantonggopep@gmail.com",
      passwordHash: passwordHash, // <-- match your schema
      roles: '["SUPER_ADMIN"]',   // JSON string for roles
      tenantId: "default-tenant-id", // Replace with an actual tenant ID or create a default tenant first
    },
  });

  console.log("Super admin created:", superAdmin);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
