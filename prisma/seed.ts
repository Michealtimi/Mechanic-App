// prisma/seed.ts
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 💡 Security Enhancement: Use environment variables for sensitive data.
  // This prevents hard-coding credentials directly in the codebase.
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@yourmechanicapp.com';
  const rawPassword = process.env.SUPERADMIN_PASSWORD || 'SecurePassword4App!';
  
  // 💡 Security Enhancement: Use bcrypt with 12 salt rounds.
  // This is a stronger, more secure hashing standard than 10.
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  try {
    // 💡 Best Practice: Use `upsert` for idempotent seeding.
    // This ensures the script can be run multiple times without creating duplicate users.
    const superAdmin = await prisma.user.upsert({
      where: { email },
      update: {}, // No updates are needed if the user already exists.
      create: {
        email,
        password: hashedPassword,
        role: 'SUPERADMIN', // 💡 Using string literal for Role enum
        status: 'ACTIVE', // 💡 Using string literal for Status enum
        firstName: 'Super',
        lastName: 'Admin',
        // You can add more specific fields if your schema includes them, e.g., fullName.
      },
    });

    console.log(`✅ Super Admin seeded with email: ${superAdmin.email}`);

  } catch (error) {
    // 💡 Improved Error Handling: Catch specific errors and provide clear messages.
    if (error.code === 'P2002') {
      console.error(`❌ Super Admin with email ${email} already exists. Skipping creation.`);
    } else {
      console.error('❌ Failed to seed Super Admin:', error.message);
      process.exit(1);
    }
  }

  // 💡 Addition: You can add other necessary seeding logic here for a complete setup.
  // Example: Seeding initial mechanic skills or default service types.
  try {
    const skills = [
      { name: 'Engine Repair' },
      { name: 'Brake Service' },
      { name: 'Oil Change' },
    ];
    await Promise.all(
      skills.map(skill => prisma.skill.upsert({
        where: { name: skill.name },
        update: {},
        create: { name: skill.name }
      }))
    );
    console.log('✅ Initial skills seeded.');
  } catch (err) {
    console.error('❌ Failed to seed initial skills:', err.message);
  }

}

main()
  .catch((e) => {
    // A final catch-all for any uncaught errors.
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // 💡 Added: Explicitly disconnect Prisma to ensure a clean exit.
  });