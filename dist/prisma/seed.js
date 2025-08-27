"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    const hashedPassword = await bcrypt.hash('SuperSecurePassword123!', 10);
    await prisma.user.upsert({
        where: { email: 'superadmin@yourapp.com' },
        update: {},
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
//# sourceMappingURL=seed.js.map