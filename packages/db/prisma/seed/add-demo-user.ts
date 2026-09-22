/**
 * Attach a login user (owner) to the most recent demo org so magic-link / OTP
 * sign-in lands directly in a populated org. Run after demo-org.ts.
 *   DATABASE_URL=... bun prisma/seed/add-demo-user.ts [email]
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2] || 'demo@compliboss.com';

  const org = await prisma.organization.findFirst({
    where: { name: 'CompliBoss Demo Co' },
    orderBy: { createdAt: 'desc' },
  });
  if (!org) throw new Error('Demo org not found — run demo-org.ts first.');

  let user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Demo Owner', email, emailVerified: true },
    });
  }

  const existing = await prisma.member.findFirst({
    where: { organizationId: org.id, userId: user.id },
  });
  if (!existing) {
    await prisma.member.create({
      data: { organizationId: org.id, userId: user.id, role: 'owner' },
    });
  }

  console.log(`\n=== LOGIN READY ===`);
  console.log(`Sign in at http://localhost:3000 with email: ${email}`);
  console.log(`(Dev: the OTP / magic-link is printed in the API logs.)`);
  console.log(`Org: ${org.id}`);
  console.log(`===================\n`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
