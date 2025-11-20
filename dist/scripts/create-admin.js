"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const promises_1 = require("node:readline/promises");
const node_process_1 = require("node:process");
const prisma = new client_1.PrismaClient();
async function askQuestion(query) {
    const rl = (0, promises_1.createInterface)({ input: node_process_1.stdin, output: node_process_1.stdout });
    try {
        const answer = await rl.question(query);
        return answer.trim();
    }
    finally {
        rl.close();
    }
}
async function main() {
    console.log('🔐 Create or Update Admin User\n');
    const email = (await askQuestion('Admin email: ')).toLowerCase();
    const password = await askQuestion('Admin password: ');
    if (!email) {
        console.error('❌ Email is required');
        process.exit(1);
    }
    if (!password) {
        console.error('❌ Password is required');
        process.exit(1);
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'ADMIN',
            password: hashed,
        },
        create: {
            email,
            password: hashed,
            role: 'ADMIN',
        },
    });
    console.log('\n✅ Admin ready:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log('   Role: ADMIN');
}
main()
    .catch((error) => {
    console.error('❌ Failed to create admin:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=create-admin.js.map