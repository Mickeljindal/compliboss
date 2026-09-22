/**
 * Backfill contentHash on existing demo check results so the /verify endpoint
 * has hashed rows to validate. Replicates apps/api/src/lib/evidence-hash.ts
 * exactly (must stay in sync).
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createHash } from 'node:crypto';
import stringify from 'safe-stable-stringify';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function hash(input: {
  resourceType: string;
  resourceId: string;
  passed: boolean;
  title: string;
  evidence: unknown;
  collectedAt: Date;
}): string {
  const canonical = stringify({
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    passed: input.passed,
    title: input.title,
    evidence: input.evidence ?? null,
    collectedAt: new Date(input.collectedAt).toISOString(),
  });
  return `sha256:${createHash('sha256').update(canonical ?? '').digest('hex')}`;
}

async function main() {
  const rows = await prisma.integrationCheckResult.findMany({
    where: { contentHash: null },
    select: {
      id: true,
      resourceType: true,
      resourceId: true,
      passed: true,
      title: true,
      evidence: true,
      collectedAt: true,
    },
  });
  console.log(`Backfilling ${rows.length} check result(s)...`);
  for (const r of rows) {
    await prisma.integrationCheckResult.update({
      where: { id: r.id },
      data: { contentHash: hash(r) },
    });
  }
  console.log('Backfill complete.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
