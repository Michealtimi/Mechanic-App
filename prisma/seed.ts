// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('SuperSecurePassword123!', 10);

  await prisma.user.upsert({
    where: { email: 'superadmin@yourapp.com' },
    update: {}, // do nothing if exists
    create: {
      email: 'superadmin@yourapp.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      firstName: 'Super',
      lastName: 'Admin',
    },
  });

  console.log('✅ Super Admin seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
