/**
 * Demo-org seed for local end-to-end verification.
 *
 * Creates a demo organization with a real SOC 2 framework instance (controls,
 * tasks, requirement maps, framework links), a sample automated check result,
 * a published policy, and an API key — so the evidence-export endpoints can be
 * exercised against realistic data. Idempotent-ish: it always creates a fresh
 * org so you can re-run it.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createHash, randomBytes } from 'node:crypto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Pick the SOC 2 framework whose requirements actually have control
  //    templates linked (some legacy SOC 2 rows have requirements but no
  //    control links — those can't produce a usable instance).
  const soc2Candidates = await prisma.frameworkEditorFramework.findMany({
    where: { name: 'SOC 2' },
  });
  let soc2: { id: string; name: string } | null = null;
  let bestLinkedControls = -1;
  for (const cand of soc2Candidates) {
    const reqs = await prisma.frameworkEditorRequirement.findMany({
      where: { frameworkId: cand.id },
      include: { controlTemplates: { select: { id: true } } },
    });
    const distinctControls = new Set(
      reqs.flatMap((r) => r.controlTemplates.map((c) => c.id)),
    ).size;
    if (distinctControls > bestLinkedControls) {
      bestLinkedControls = distinctControls;
      soc2 = { id: cand.id, name: cand.name };
    }
  }
  if (!soc2 || bestLinkedControls <= 0) {
    throw new Error('No SOC 2 framework with linked control templates found — run the main seed first.');
  }
  console.log(`Using framework ${soc2.name} (${soc2.id}) with ${bestLinkedControls} linked controls`);

  // 2. Demo org.
  const org = await prisma.organization.create({
    data: {
      name: 'CompliBoss Demo Co',
      hasAccess: true,
      onboardingCompleted: true,
    },
  });
  console.log(`Created org ${org.id}`);

  // 3. Framework instance.
  const fi = await prisma.frameworkInstance.create({
    data: { organizationId: org.id, frameworkId: soc2.id },
  });

  // 4. Requirements -> control templates -> task templates.
  const requirements = await prisma.frameworkEditorRequirement.findMany({
    where: { frameworkId: soc2.id },
    include: {
      controlTemplates: { include: { taskTemplates: true } },
    },
  });

  // Dedup control templates across requirements; remember which requirements map to each.
  const controlTplToReqs = new Map<string, { name: string; description: string; reqIds: string[]; taskTpls: { id: string; name: string; description: string }[] }>();
  for (const req of requirements) {
    for (const ct of req.controlTemplates) {
      const entry = controlTplToReqs.get(ct.id) ?? {
        name: ct.name,
        description: ct.description,
        reqIds: [],
        taskTpls: ct.taskTemplates.map((tt) => ({ id: tt.id, name: tt.name, description: tt.description })),
      };
      entry.reqIds.push(req.id);
      controlTplToReqs.set(ct.id, entry);
    }
  }
  console.log(`Instantiating ${controlTplToReqs.size} controls...`);

  // 5. Create controls + requirement maps. Create tasks once per task template.
  const taskTplToTaskId = new Map<string, string>();
  let controlIndex = 0;
  const createdControlIds: string[] = [];
  const doneTaskIds: string[] = [];

  for (const [ctId, info] of controlTplToReqs) {
    const control = await prisma.control.create({
      data: {
        name: info.name,
        description: info.description,
        organizationId: org.id,
        controlTemplateId: ctId,
      },
    });
    createdControlIds.push(control.id);

    for (const reqId of info.reqIds) {
      await prisma.requirementMap.create({
        data: {
          controlId: control.id,
          requirementId: reqId,
          frameworkInstanceId: fi.id,
        },
      });
    }

    // Tasks for this control (create each task template once).
    for (const tt of info.taskTpls) {
      let taskId = taskTplToTaskId.get(tt.id);
      if (!taskId) {
        // Mark ~60% of tasks done so readiness is realistic and varied.
        const done = controlIndex % 5 !== 0;
        const task = await prisma.task.create({
          data: {
            title: tt.name,
            description: tt.description,
            organizationId: org.id,
            taskTemplateId: tt.id,
            status: done ? 'done' : 'todo',
            lastCompletedAt: done ? new Date() : null,
          },
        });
        taskId = task.id;
        taskTplToTaskId.set(tt.id, taskId);
        if (done) doneTaskIds.push(taskId);
      }
      await prisma.frameworkControlTaskLink.create({
        data: {
          frameworkInstanceId: fi.id,
          controlId: control.id,
          taskId,
        },
      });
    }
    controlIndex += 1;
  }
  console.log(`Created ${taskTplToTaskId.size} tasks (${doneTaskIds.length} done)`);

  // 6. A published policy linked to the first control.
  if (createdControlIds.length > 0) {
    const policy = await prisma.policy.create({
      data: {
        name: 'Information Security Policy',
        description: 'Top-level information security policy.',
        organizationId: org.id,
        status: 'published',
        lastPublishedAt: new Date(),
      },
    });
    await prisma.frameworkControlPolicyLink.create({
      data: {
        frameworkInstanceId: fi.id,
        controlId: createdControlIds[0],
        policyId: policy.id,
      },
    });
  }

  // 7. Sample automated evidence: an AWS connection + a passing check run on a done task.
  if (doneTaskIds.length > 0) {
    const provider = await prisma.integrationProvider.create({
      data: { slug: `aws-demo-${Date.now()}`, name: 'AWS (demo)', category: 'cloud' },
    });
    const connection = await prisma.integrationConnection.create({
      data: {
        providerId: provider.id,
        organizationId: org.id,
        status: 'active',
        authStrategy: 'custom',
        lastSyncAt: new Date(),
      },
    });
    const run = await prisma.integrationCheckRun.create({
      data: {
        connectionId: connection.id,
        taskId: doneTaskIds[0],
        checkId: 'aws-security-scan',
        checkName: 'AWS Security Scan',
        status: 'success',
        startedAt: new Date(),
        completedAt: new Date(),
        totalChecked: 3,
        passedCount: 3,
        failedCount: 0,
        scannedServices: ['s3'],
      },
    });
    await prisma.integrationCheckResult.createMany({
      data: [
        {
          checkRunId: run.id,
          passed: true,
          resourceType: 's3',
          resourceId: 'arn:aws:s3:::demo-prod-bucket',
          title: 'S3 bucket blocks all public access',
          severity: 'info',
          evidence: { serviceId: 's3', blockPublicAcls: true } as object,
          collectedAt: new Date(),
        },
        {
          checkRunId: run.id,
          passed: true,
          resourceType: 's3',
          resourceId: 'arn:aws:s3:::demo-logs-bucket',
          title: 'S3 bucket default encryption enabled',
          severity: 'info',
          evidence: { serviceId: 's3', sse: 'AES256' } as object,
          collectedAt: new Date(),
        },
      ],
    });
  }

  // 8. API key for driving the endpoints.
  const rawKey = `comp_${randomBytes(32).toString('hex')}`;
  const salt = randomBytes(16).toString('hex');
  const hashedKey = createHash('sha256').update(rawKey + salt).digest('hex');
  await prisma.apiKey.create({
    data: {
      name: 'demo-e2e',
      key: hashedKey,
      keyPrefix: rawKey.slice(5, 13),
      salt,
      organizationId: org.id,
      scopes: [
        'framework:read',
        'evidence:read',
        'control:read',
        'task:read',
        'policy:read',
      ],
    },
  });

  console.log('\n=== DEMO READY ===');
  console.log(`ORG_ID=${org.id}`);
  console.log(`FRAMEWORK_INSTANCE_ID=${fi.id}`);
  console.log(`API_KEY=${rawKey}`);
  console.log('==================\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Demo seed failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
