const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const events = await prisma.dailyEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.dir(events, { depth: null });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
})();
