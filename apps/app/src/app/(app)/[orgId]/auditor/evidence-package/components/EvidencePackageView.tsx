'use client';

import { useState } from 'react';
import {
  downloadEvidenceBinder,
  useEvidenceFrameworks,
  useEvidenceIntegrity,
  useEvidencePackage,
  type Coverage,
  type ControlEvidence,
  type FrameworkListItem,
} from '@/hooks/use-evidence-export';

const COVERAGE_STYLES: Record<Coverage, { label: string; cls: string }> = {
  satisfied: { label: 'Satisfied', cls: 'bg-emerald-500/12 text-emerald-600 border-emerald-500/30' },
  partial: { label: 'Partial', cls: 'bg-amber-500/12 text-amber-600 border-amber-500/30' },
  gap: { label: 'Gap', cls: 'bg-red-500/12 text-red-600 border-red-500/30' },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-4">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function CoverageBadge({ coverage }: { coverage: Coverage }) {
  const s = COVERAGE_STYLES[coverage];
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function ControlCard({ control }: { control: ControlEvidence }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[var(--radius)] border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {control.requirements.map((r) => (
              <span
                key={`${r.source}-${r.identifier}`}
                className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium"
              >
                {r.identifier}
              </span>
            ))}
            <span className="font-semibold">{control.name}</span>
          </div>
          {control.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {control.description}
            </p>
          ) : null}
          <div className="mt-2 text-xs text-muted-foreground">
            {control.tasks.length} task(s) · {control.policies.length} policy(ies)
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CoverageBadge coverage={control.coverage} />
          <span className="text-muted-foreground">{open ? '▾' : '▸'}</span>
        </div>
      </button>

      {open ? (
        <div className="border-t border-border p-4">
          {control.tasks.length > 0 ? (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Evidence tasks
              </div>
              <ul className="space-y-2">
                {control.tasks.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-md border border-border bg-background p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{t.title}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] uppercase">
                        {t.status}
                      </span>
                    </div>
                    {t.latestCheck ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Last check: {t.latestCheck.status} ·{' '}
                        {t.latestCheck.passedCount}/{t.latestCheck.totalChecked} passed
                        {t.latestCheck.newestCollectedAt
                          ? ` · collected ${fmtDate(t.latestCheck.newestCollectedAt)}`
                          : ''}
                      </div>
                    ) : null}
                    {t.attachmentCount > 0 ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t.attachmentCount} file(s) attached
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {control.policies.length > 0 ? (
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Policies
              </div>
              <ul className="space-y-1">
                {control.policies.map((p) => (
                  <li key={p.id} className="text-sm">
                    {p.name}{' '}
                    <span className="text-xs text-muted-foreground">({p.status})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {control.tasks.length === 0 && control.policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No evidence tasks or policies are linked to this control yet.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function EvidencePackageView({
  initialFrameworks,
}: {
  initialFrameworks: FrameworkListItem[];
}) {
  const { frameworks } = useEvidenceFrameworks(initialFrameworks);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFrameworks[0]?.frameworkInstanceId ?? null,
  );
  const [downloadingFmt, setDownloadingFmt] = useState<'md' | 'pdf' | null>(null);
  const { pkg, isLoading } = useEvidencePackage(selectedId);
  const { integrity } = useEvidenceIntegrity(selectedId);

  if (frameworks.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center">
        <p className="font-medium">No frameworks yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a framework (SOC 2, ISO 27001, …) to build an evidence package.
        </p>
      </div>
    );
  }

  const handleDownload = async (format: 'md' | 'pdf') => {
    if (!pkg) return;
    setDownloadingFmt(format);
    try {
      await downloadEvidenceBinder(
        pkg.framework.frameworkInstanceId,
        pkg.framework.name,
        format,
      );
    } catch (err) {
      // Surface a minimal error; the button re-enables so the user can retry.
      console.error('Binder download failed', err);
    } finally {
      setDownloadingFmt(null);
    }
  };

  const s = pkg?.summary;

  return (
    <div className="space-y-6">
      {/* Framework picker + download */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Framework
          </label>
          <select
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
          >
            {frameworks.map((f) => (
              <option key={f.frameworkInstanceId} value={f.frameworkInstanceId}>
                {f.name} — {f.readinessPercent}% ready
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownload('pdf')}
            disabled={!pkg || downloadingFmt !== null}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {downloadingFmt === 'pdf' ? 'Preparing…' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={() => handleDownload('md')}
            disabled={!pkg || downloadingFmt !== null}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            {downloadingFmt === 'md' ? 'Preparing…' : 'Markdown'}
          </button>
        </div>
      </div>

      {isLoading && !pkg ? (
        <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Assembling evidence package…
        </div>
      ) : null}

      {pkg && s ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Readiness" value={`${s.readinessPercent}%`} hint={`${s.tasksDone}/${s.taskCount - s.tasksNotRelevant} tasks done`} />
            <StatCard label="Controls" value={String(s.controlCount)} hint={`${s.controlsSatisfied} satisfied · ${s.controlsPartial} partial · ${s.controlsGap} gap`} />
            <StatCard label="Automated evidence" value={String(s.automatedTasks)} hint="tasks backed by live checks" />
            <StatCard label="Policies published" value={`${s.policiesPublished}/${s.policyCount}`} />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              Generated {fmtDate(pkg.generatedAt)} · Requirements mapped: {s.requirementCount}
              {s.evidenceNewestCollectedAt
                ? ` · Evidence collected ${fmtDate(s.evidenceOldestCollectedAt)} – ${fmtDate(s.evidenceNewestCollectedAt)}`
                : ''}
            </span>
            {integrity && integrity.hashed > 0 ? (
              integrity.allVerified ? (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/12 px-2.5 py-0.5 font-semibold text-emerald-600">
                  ✓ Integrity verified · {integrity.verified} record(s)
                </span>
              ) : (
                <span className="rounded-full border border-red-500/30 bg-red-500/12 px-2.5 py-0.5 font-semibold text-red-600">
                  ⚠ {integrity.tampered} tampered record(s) detected
                </span>
              )
            ) : null}
          </div>

          <div className="space-y-3">
            {pkg.controls.map((c) => (
              <ControlCard key={c.id} control={c} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
