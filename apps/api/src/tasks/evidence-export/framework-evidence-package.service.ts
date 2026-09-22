import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AttachmentEntityType, db } from '@db';
import { jsPDF } from 'jspdf';
import { computeEvidenceContentHash } from '../../lib/evidence-hash';
import type {
  ControlEvidenceDto,
  EvidencePackageDto,
  FrameworkListItemDto,
  RequirementRefDto,
  TaskEvidenceDto,
} from './dto/evidence-package.dto';

const SAMPLE_RESULTS_PER_TASK = 10;

/**
 * Builds the control-by-control auditor evidence PACKAGE for a framework
 * instance (distinct from the per-task PDF/ZIP export in EvidenceExportService).
 * Maps: FrameworkInstance -> RequirementMap -> Control ->
 *   { FrameworkControlTaskLink -> Task -> latest IntegrationCheckRun/Result + Attachments,
 *     FrameworkControlPolicyLink -> Policy }.
 */
@Injectable()
export class FrameworkEvidencePackageService {
  private readonly logger = new Logger(FrameworkEvidencePackageService.name);

  /** List the org's framework instances with a quick readiness number. */
  async listFrameworks(organizationId: string): Promise<FrameworkListItemDto[]> {
    const instances = await db.frameworkInstance.findMany({
      where: { organizationId },
      include: {
        framework: { select: { name: true } },
        customFramework: { select: { name: true } },
      },
    });

    const items: FrameworkListItemDto[] = [];
    for (const fi of instances) {
      const controlIds = await this.controlIdsForInstance(fi.id);
      const taskLinks = await db.frameworkControlTaskLink.findMany({
        where: { frameworkInstanceId: fi.id },
        include: { task: { select: { status: true } } },
      });
      const inScope = taskLinks.filter((l) => l.task.status !== 'not_relevant');
      const done = inScope.filter((l) => l.task.status === 'done');
      items.push({
        frameworkInstanceId: fi.id,
        name: fi.framework?.name ?? fi.customFramework?.name ?? 'Framework',
        type: fi.frameworkId ? 'platform' : 'custom',
        controlCount: controlIds.size,
        readinessPercent:
          inScope.length === 0
            ? 0
            : Math.round((done.length / inScope.length) * 100),
      });
    }
    return items;
  }

  private async controlIdsForInstance(
    frameworkInstanceId: string,
  ): Promise<Set<string>> {
    const maps = await db.requirementMap.findMany({
      where: { frameworkInstanceId, archivedAt: null },
      select: { controlId: true },
    });
    return new Set(maps.map((m) => m.controlId));
  }

  /** Build the full control-by-control evidence package (org-scoped). */
  async buildPackage(
    organizationId: string,
    frameworkInstanceId: string,
  ): Promise<EvidencePackageDto> {
    const fi = await db.frameworkInstance.findFirst({
      where: { id: frameworkInstanceId, organizationId },
      include: {
        framework: { select: { name: true } },
        customFramework: { select: { name: true } },
      },
    });
    if (!fi) {
      throw new NotFoundException('Framework instance not found');
    }

    const maps = await db.requirementMap.findMany({
      where: { frameworkInstanceId, archivedAt: null },
      include: {
        requirement: {
          select: {
            identifier: true,
            name: true,
            description: true,
            requirementFamily: true,
          },
        },
        customRequirement: {
          select: { identifier: true, name: true, description: true },
        },
        control: { select: { id: true, name: true, description: true } },
      },
    });

    const controlsById = new Map<
      string,
      { id: string; name: string; description: string | null; requirements: RequirementRefDto[] }
    >();
    for (const m of maps) {
      const c = m.control;
      if (!controlsById.has(c.id)) {
        controlsById.set(c.id, {
          id: c.id,
          name: c.name,
          description: c.description ?? null,
          requirements: [],
        });
      }
      if (m.requirement) {
        controlsById.get(c.id)!.requirements.push({
          identifier: m.requirement.identifier || m.requirement.name,
          name: m.requirement.name,
          description: m.requirement.description ?? null,
          family: m.requirement.requirementFamily ?? null,
          source: 'framework',
        });
      } else if (m.customRequirement) {
        controlsById.get(c.id)!.requirements.push({
          identifier: m.customRequirement.identifier,
          name: m.customRequirement.name,
          description: m.customRequirement.description ?? null,
          family: null,
          source: 'custom',
        });
      }
    }

    const controlIds = [...controlsById.keys()];

    const [taskLinks, policyLinks] = await Promise.all([
      db.frameworkControlTaskLink.findMany({
        where: { frameworkInstanceId, controlId: { in: controlIds } },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              frequency: true,
              automationStatus: true,
              lastCompletedAt: true,
            },
          },
        },
      }),
      db.frameworkControlPolicyLink.findMany({
        where: { frameworkInstanceId, controlId: { in: controlIds } },
        include: {
          policy: {
            select: {
              id: true,
              name: true,
              status: true,
              lastPublishedAt: true,
            },
          },
        },
      }),
    ]);

    const taskIds = [...new Set(taskLinks.map((l) => l.taskId))];

    const [checkRuns, attachments] = await Promise.all([
      taskIds.length
        ? db.integrationCheckRun.findMany({
            where: { taskId: { in: taskIds } },
            orderBy: { createdAt: 'desc' },
            include: {
              results: {
                select: {
                  passed: true,
                  resourceType: true,
                  resourceId: true,
                  title: true,
                  severity: true,
                  collectedAt: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      taskIds.length
        ? db.attachment.findMany({
            where: {
              entityType: AttachmentEntityType.task,
              entityId: { in: taskIds },
            },
            select: {
              id: true,
              name: true,
              type: true,
              entityId: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const latestRunByTask = new Map<string, (typeof checkRuns)[number]>();
    for (const run of checkRuns) {
      if (run.taskId && !latestRunByTask.has(run.taskId)) {
        latestRunByTask.set(run.taskId, run);
      }
    }
    const attachmentsByTask = new Map<string, typeof attachments>();
    for (const a of attachments) {
      const list = attachmentsByTask.get(a.entityId) ?? [];
      list.push(a);
      attachmentsByTask.set(a.entityId, list);
    }

    const tasksByControl = new Map<string, TaskEvidenceDto[]>();
    let oldestCollected: Date | null = null;
    let newestCollected: Date | null = null;
    let automatedTasks = 0;

    for (const link of taskLinks) {
      const t = link.task;
      const run = latestRunByTask.get(t.id);
      let latestCheck: TaskEvidenceDto['latestCheck'] = null;
      if (run) {
        automatedTasks += 1;
        const results = run.results ?? [];
        let runNewest: Date | null = null;
        for (const r of results) {
          if (!runNewest || r.collectedAt > runNewest) runNewest = r.collectedAt;
          if (!oldestCollected || r.collectedAt < oldestCollected) {
            oldestCollected = r.collectedAt;
          }
          if (!newestCollected || r.collectedAt > newestCollected) {
            newestCollected = r.collectedAt;
          }
        }
        latestCheck = {
          checkName: run.checkName,
          status: run.status,
          completedAt: run.completedAt?.toISOString() ?? null,
          totalChecked: run.totalChecked,
          passedCount: run.passedCount,
          failedCount: run.failedCount,
          newestCollectedAt: runNewest?.toISOString() ?? null,
          sampleResults: results.slice(0, SAMPLE_RESULTS_PER_TASK).map((r) => ({
            passed: r.passed,
            resourceType: r.resourceType,
            resourceId: r.resourceId,
            title: r.title,
            severity: r.severity ?? null,
            collectedAt: r.collectedAt.toISOString(),
          })),
        };
      }
      const taskAttachments = attachmentsByTask.get(t.id) ?? [];
      const dto: TaskEvidenceDto = {
        id: t.id,
        title: t.title,
        status: t.status,
        frequency: t.frequency ?? null,
        automationStatus: t.automationStatus,
        lastCompletedAt: t.lastCompletedAt?.toISOString() ?? null,
        latestCheck,
        attachmentCount: taskAttachments.length,
        attachments: taskAttachments.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type ?? null,
          createdAt: a.createdAt.toISOString(),
        })),
      };
      const list = tasksByControl.get(link.controlId) ?? [];
      list.push(dto);
      tasksByControl.set(link.controlId, list);
    }

    const policiesByControl = new Map<string, ControlEvidenceDto['policies']>();
    for (const link of policyLinks) {
      const p = link.policy;
      const list = policiesByControl.get(link.controlId) ?? [];
      list.push({
        id: p.id,
        name: p.name,
        status: p.status,
        lastPublishedAt: p.lastPublishedAt?.toISOString() ?? null,
      });
      policiesByControl.set(link.controlId, list);
    }

    let tasksDone = 0;
    let tasksNotRelevant = 0;
    let taskCount = 0;
    let controlsSatisfied = 0;
    let controlsPartial = 0;
    let controlsGap = 0;

    const controls: ControlEvidenceDto[] = [];
    for (const c of controlsById.values()) {
      const tasks = tasksByControl.get(c.id) ?? [];
      const policies = policiesByControl.get(c.id) ?? [];
      taskCount += tasks.length;
      tasksDone += tasks.filter((t) => t.status === 'done').length;
      tasksNotRelevant += tasks.filter((t) => t.status === 'not_relevant').length;

      const coverage = this.coverageForControl(tasks, policies);
      if (coverage === 'satisfied') controlsSatisfied += 1;
      else if (coverage === 'partial') controlsPartial += 1;
      else controlsGap += 1;

      controls.push({
        id: c.id,
        name: c.name,
        description: c.description,
        coverage,
        requirements: c.requirements,
        tasks,
        policies,
      });
    }

    controls.sort((a, b) =>
      (a.requirements[0]?.identifier ?? a.name).localeCompare(
        b.requirements[0]?.identifier ?? b.name,
        undefined,
        { numeric: true, sensitivity: 'base' },
      ),
    );

    const inScopeTasks = taskCount - tasksNotRelevant;
    const policyCount = policyLinks.length;
    const policiesPublished = policyLinks.filter(
      (l) => l.policy.status === 'published',
    ).length;

    return {
      framework: {
        frameworkInstanceId: fi.id,
        name: fi.framework?.name ?? fi.customFramework?.name ?? 'Framework',
        type: fi.frameworkId ? 'platform' : 'custom',
      },
      generatedAt: new Date().toISOString(),
      summary: {
        controlCount: controls.length,
        requirementCount: maps.length,
        taskCount,
        tasksDone,
        tasksNotRelevant,
        automatedTasks,
        policyCount,
        policiesPublished,
        readinessPercent:
          inScopeTasks <= 0 ? 0 : Math.round((tasksDone / inScopeTasks) * 100),
        controlsSatisfied,
        controlsPartial,
        controlsGap,
        evidenceOldestCollectedAt: oldestCollected?.toISOString() ?? null,
        evidenceNewestCollectedAt: newestCollected?.toISOString() ?? null,
      },
      controls,
    };
  }

  /**
   * satisfied = has evidence and nothing failing (all in-scope tasks done, no
   * failing checks); partial = some evidence but work remains; gap = no
   * evidence at all.
   */
  private coverageForControl(
    tasks: TaskEvidenceDto[],
    policies: ControlEvidenceDto['policies'],
  ): 'satisfied' | 'partial' | 'gap' {
    const inScope = tasks.filter((t) => t.status !== 'not_relevant');
    const hasPublishedPolicy = policies.some((p) => p.status === 'published');

    if (inScope.length === 0 && policies.length === 0) return 'gap';

    const allTasksDone =
      inScope.length > 0 && inScope.every((t) => t.status === 'done');
    const anyCheckFailing = tasks.some(
      (t) => t.latestCheck && t.latestCheck.failedCount > 0,
    );
    const anyEvidence =
      tasks.some(
        (t) => t.status === 'done' || t.latestCheck || t.attachmentCount > 0,
      ) || hasPublishedPolicy;

    if (allTasksDone && !anyCheckFailing) return 'satisfied';
    if (anyEvidence) return 'partial';
    return 'gap';
  }

  /** Render the package as a human-readable Markdown "evidence binder". */
  async renderBinderMarkdown(
    organizationId: string,
    frameworkInstanceId: string,
  ): Promise<string> {
    const pkg = await this.buildPackage(organizationId, frameworkInstanceId);
    const s = pkg.summary;
    const lines: string[] = [];

    lines.push(`# ${pkg.framework.name} — Evidence Binder`);
    lines.push('');
    lines.push(`Generated: ${pkg.generatedAt}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(
      `- Controls: ${s.controlCount} (satisfied ${s.controlsSatisfied} · partial ${s.controlsPartial} · gap ${s.controlsGap})`,
    );
    lines.push(`- Requirements mapped: ${s.requirementCount}`);
    lines.push(
      `- Tasks: ${s.taskCount} (done ${s.tasksDone} · not relevant ${s.tasksNotRelevant}) — readiness ${s.readinessPercent}%`,
    );
    lines.push(`- Automated evidence tasks: ${s.automatedTasks}`);
    lines.push(`- Policies: ${s.policyCount} (published ${s.policiesPublished})`);
    if (s.evidenceOldestCollectedAt) {
      lines.push(
        `- Automated evidence window: ${s.evidenceOldestCollectedAt} → ${s.evidenceNewestCollectedAt}`,
      );
    }
    lines.push('');

    for (const c of pkg.controls) {
      const reqIds = c.requirements.map((r) => r.identifier).join(', ');
      lines.push(`## ${c.name}${reqIds ? ` — ${reqIds}` : ''}`);
      lines.push('');
      lines.push(`Coverage: **${c.coverage}**`);
      if (c.description) {
        lines.push('');
        lines.push(c.description);
      }
      if (c.requirements.length) {
        lines.push('');
        lines.push('Requirements:');
        for (const r of c.requirements) {
          lines.push(`- \`${r.identifier}\` ${r.name}`);
        }
      }
      if (c.tasks.length) {
        lines.push('');
        lines.push('Evidence tasks:');
        for (const t of c.tasks) {
          const chk = t.latestCheck
            ? ` — last check ${t.latestCheck.status}, ${t.latestCheck.passedCount}/${t.latestCheck.totalChecked} passed${t.latestCheck.newestCollectedAt ? ` (collected ${t.latestCheck.newestCollectedAt})` : ''}`
            : '';
          const files = t.attachmentCount ? ` — ${t.attachmentCount} file(s)` : '';
          lines.push(`- [${t.status}] ${t.title}${chk}${files}`);
        }
      }
      if (c.policies.length) {
        lines.push('');
        lines.push('Policies:');
        for (const p of c.policies) {
          lines.push(`- ${p.name} (${p.status})`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Recompute the tamper-evidence hash for every automated check result behind
   * this framework's evidence and confirm it matches what was stored at
   * collection time. Any mismatch means the evidence row was altered after
   * collection. Rows collected before the integrity feature are reported as
   * "unhashed" (not tampered).
   */
  async verifyIntegrity(
    organizationId: string,
    frameworkInstanceId: string,
  ): Promise<{
    total: number;
    hashed: number;
    verified: number;
    tampered: number;
    unhashed: number;
    allVerified: boolean;
    tamperedSamples: { resourceType: string; resourceId: string; title: string }[];
  }> {
    const fi = await db.frameworkInstance.findFirst({
      where: { id: frameworkInstanceId, organizationId },
      select: { id: true },
    });
    if (!fi) {
      throw new NotFoundException('Framework instance not found');
    }

    const controlIds = [...(await this.controlIdsForInstance(frameworkInstanceId))];
    const taskLinks = await db.frameworkControlTaskLink.findMany({
      where: { frameworkInstanceId, controlId: { in: controlIds } },
      select: { taskId: true },
    });
    const taskIds = [...new Set(taskLinks.map((l) => l.taskId))];

    const empty = {
      total: 0,
      hashed: 0,
      verified: 0,
      tampered: 0,
      unhashed: 0,
      allVerified: true,
      tamperedSamples: [] as {
        resourceType: string;
        resourceId: string;
        title: string;
      }[],
    };
    if (taskIds.length === 0) return empty;

    const results = await db.integrationCheckResult.findMany({
      where: { checkRun: { taskId: { in: taskIds } } },
      select: {
        resourceType: true,
        resourceId: true,
        passed: true,
        title: true,
        evidence: true,
        collectedAt: true,
        contentHash: true,
      },
    });

    let hashed = 0;
    let verified = 0;
    let tampered = 0;
    let unhashed = 0;
    const tamperedSamples: {
      resourceType: string;
      resourceId: string;
      title: string;
    }[] = [];

    for (const r of results) {
      if (!r.contentHash) {
        unhashed += 1;
        continue;
      }
      hashed += 1;
      const recomputed = computeEvidenceContentHash({
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        passed: r.passed,
        title: r.title,
        evidence: r.evidence,
        collectedAt: r.collectedAt,
      });
      if (recomputed === r.contentHash) {
        verified += 1;
      } else {
        tampered += 1;
        if (tamperedSamples.length < 10) {
          tamperedSamples.push({
            resourceType: r.resourceType,
            resourceId: r.resourceId,
            title: r.title,
          });
        }
      }
    }

    return {
      total: results.length,
      hashed,
      verified,
      tampered,
      unhashed,
      allVerified: tampered === 0,
      tamperedSamples,
    };
  }

  /**
   * Render the package as a branded PDF "evidence binder" — the polished
   * artifact to hand an auditor.
   */
  async renderBinderPdf(
    organizationId: string,
    frameworkInstanceId: string,
  ): Promise<Buffer> {
    const pkg = await this.buildPackage(organizationId, frameworkInstanceId);

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentW = pageW - margin * 2;
    const state = { y: margin };

    const NAVY: [number, number, number] = [14, 34, 51];
    const BLUE: [number, number, number] = [30, 111, 255];
    const MUTED: [number, number, number] = [110, 120, 130];
    const coverageColor = (c: string): [number, number, number] =>
      c === 'satisfied' ? [22, 163, 74] : c === 'partial' ? [217, 119, 6] : [220, 38, 38];

    const clean = (t: string): string =>
      (t || '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/\u00A0/g, ' ')
        // Drop anything outside basic Latin-1 to avoid garbled glyphs.
        .replace(/[^\x09\x0A\x0D\x20-\u00FF]/g, '');

    const write = (
      text: string,
      opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number } = {},
    ) => {
      const size = opts.size ?? 10;
      const indent = opts.indent ?? 0;
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...(opts.color ?? NAVY));
      const lines = doc.splitTextToSize(clean(text), contentW - indent) as string[];
      const lh = size * 1.35;
      for (const line of lines) {
        if (state.y + lh > pageH - margin) {
          doc.addPage();
          state.y = margin;
        }
        doc.text(line, margin + indent, state.y);
        state.y += lh;
      }
      state.y += opts.gap ?? 0;
    };

    const s = pkg.summary;

    // --- Cover / summary ---
    write('CompliBoss', { size: 12, bold: true, color: BLUE });
    write(`${pkg.framework.name} — Evidence Binder`, { size: 22, bold: true, gap: 6 });
    write(`Generated ${new Date(pkg.generatedAt).toLocaleString()}`, { size: 9, color: MUTED, gap: 12 });

    write('Summary', { size: 14, bold: true, gap: 4 });
    write(`Readiness: ${s.readinessPercent}%  (${s.tasksDone}/${s.taskCount - s.tasksNotRelevant} in-scope tasks done)`, { size: 10 });
    write(`Controls: ${s.controlCount}  —  satisfied ${s.controlsSatisfied} · partial ${s.controlsPartial} · gap ${s.controlsGap}`, { size: 10 });
    write(`Requirements mapped: ${s.requirementCount}`, { size: 10 });
    write(`Automated evidence tasks: ${s.automatedTasks}   ·   Policies published: ${s.policiesPublished}/${s.policyCount}`, { size: 10 });
    if (s.evidenceNewestCollectedAt) {
      write(
        `Automated evidence collected between ${new Date(s.evidenceOldestCollectedAt ?? '').toLocaleDateString()} and ${new Date(s.evidenceNewestCollectedAt).toLocaleDateString()}`,
        { size: 9, color: MUTED },
      );
    }
    state.y += 10;

    // --- Controls ---
    for (const c of pkg.controls) {
      const reqIds = c.requirements.map((r) => r.identifier).join(', ');
      write(c.name, { size: 13, bold: true, gap: 2 });
      if (reqIds) write(reqIds, { size: 9, color: BLUE });
      write(`Coverage: ${c.coverage.toUpperCase()}`, { size: 9, bold: true, color: coverageColor(c.coverage), gap: 2 });
      if (c.description) write(c.description, { size: 9, color: MUTED, gap: 4 });

      if (c.requirements.length) {
        write('Requirements', { size: 9, bold: true });
        for (const r of c.requirements) {
          write(`${r.identifier}  ${r.name}`, { size: 8.5, color: MUTED, indent: 12 });
        }
        state.y += 4;
      }
      if (c.tasks.length) {
        write('Evidence tasks', { size: 9, bold: true });
        for (const t of c.tasks) {
          const chk = t.latestCheck
            ? `  — check ${t.latestCheck.status}, ${t.latestCheck.passedCount}/${t.latestCheck.totalChecked} passed`
            : '';
          const files = t.attachmentCount ? `  — ${t.attachmentCount} file(s)` : '';
          write(`[${t.status}] ${t.title}${chk}${files}`, { size: 8.5, indent: 12 });
        }
        state.y += 4;
      }
      if (c.policies.length) {
        write('Policies', { size: 9, bold: true });
        for (const p of c.policies) {
          write(`${p.name} (${p.status})`, { size: 8.5, indent: 12 });
        }
      }
      state.y += 12;
    }

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return Buffer.from(arrayBuffer);
  }
}
