"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = process.env.SUPERADMIN_EMAIL || 'superadmin@yourmechanicapp.com';
    const rawPassword = process.env.SUPERADMIN_PASSWORD || 'SecurePassword4App!';
    const hashedPassword = await bcrypt.hash(rawPassword, 12);
    try {
        const superAdmin = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: hashedPassword,
                role: client_1.Role.SUPERADMIN,
                status: client_1.Status.ACTIVE,
                firstName: 'Super',
                lastName: 'Admin',
            },
        });
        console.log(`✅ Super Admin seeded with email: ${superAdmin.email}`);
    }
    catch (error) {
        if (error.code === 'P2002') {
            console.error(`❌ Super Admin with email ${email} already exists. Skipping creation.`);
        }
        else {
            console.error('❌ Failed to seed Super Admin:', error.message);
            process.exit(1);
        }
    }
    try {
        const skills = [
            { name: 'Engine Repair' },
            { name: 'Brake Service' },
            { name: 'Oil Change' },
        ];
        await Promise.all(skills.map(skill => prisma.skill.upsert({
            where: { name: skill.name },
            update: {},
            create: { name: skill.name }
        })));
        console.log('✅ Initial skills seeded.');
    }
    catch (err) {
        console.error('❌ Failed to seed initial skills:', err.message);
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map