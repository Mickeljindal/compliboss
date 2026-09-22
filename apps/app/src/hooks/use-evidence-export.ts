'use client';

import { useApiSWR } from '@/hooks/use-api-swr';
import { api, type ApiResponse } from '@/lib/api-client';

export interface FrameworkListItem {
  frameworkInstanceId: string;
  name: string;
  type: string;
  controlCount: number;
  readinessPercent: number;
}

export interface ResultRef {
  passed: boolean;
  resourceType: string;
  resourceId: string;
  title: string;
  severity: string | null;
  collectedAt: string;
}

export interface CheckSummary {
  checkName: string;
  status: string;
  completedAt: string | null;
  totalChecked: number;
  passedCount: number;
  failedCount: number;
  newestCollectedAt: string | null;
  sampleResults: ResultRef[];
}

export interface AttachmentRef {
  id: string;
  name: string;
  type: string | null;
  createdAt: string;
}

export interface TaskEvidence {
  id: string;
  title: string;
  status: string;
  frequency: string | null;
  automationStatus: string;
  lastCompletedAt: string | null;
  latestCheck: CheckSummary | null;
  attachmentCount: number;
  attachments: AttachmentRef[];
}

export interface PolicyRef {
  id: string;
  name: string;
  status: string;
  lastPublishedAt: string | null;
}

export interface RequirementRef {
  identifier: string;
  name: string;
  description: string | null;
  family: string | null;
  source: string;
}

export type Coverage = 'satisfied' | 'partial' | 'gap';

export interface ControlEvidence {
  id: string;
  name: string;
  description: string | null;
  coverage: Coverage;
  requirements: RequirementRef[];
  tasks: TaskEvidence[];
  policies: PolicyRef[];
}

export interface EvidenceSummary {
  controlCount: number;
  requirementCount: number;
  taskCount: number;
  tasksDone: number;
  tasksNotRelevant: number;
  automatedTasks: number;
  policyCount: number;
  policiesPublished: number;
  readinessPercent: number;
  controlsSatisfied: number;
  controlsPartial: number;
  controlsGap: number;
  evidenceOldestCollectedAt: string | null;
  evidenceNewestCollectedAt: string | null;
}

export interface EvidencePackage {
  framework: { frameworkInstanceId: string; name: string; type: string };
  generatedAt: string;
  summary: EvidenceSummary;
  controls: ControlEvidence[];
}

interface FrameworkListResponse {
  data: FrameworkListItem[];
  count: number;
}

/** List framework instances available for evidence export, with readiness %. */
export function useEvidenceFrameworks(initialData?: FrameworkListItem[]) {
  const swr = useApiSWR<FrameworkListResponse>('/v1/evidence-export/frameworks', {
    revalidateOnFocus: false,
    ...(initialData && {
      fallbackData: {
        data: { data: initialData, count: initialData.length },
        status: 200,
      } as ApiResponse<FrameworkListResponse>,
    }),
  });

  return {
    frameworks: swr.data?.data?.data ?? [],
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}

export interface EvidenceIntegrity {
  total: number;
  hashed: number;
  verified: number;
  tampered: number;
  unhashed: number;
  allVerified: boolean;
  tamperedSamples: { resourceType: string; resourceId: string; title: string }[];
}

/** Verify tamper-evidence hashes for a framework's automated evidence. */
export function useEvidenceIntegrity(frameworkInstanceId: string | null) {
  const swr = useApiSWR<EvidenceIntegrity>(
    frameworkInstanceId
      ? `/v1/evidence-export/${frameworkInstanceId}/verify`
      : null,
    { revalidateOnFocus: false },
  );
  return {
    integrity: swr.data?.data ?? null,
    isLoading: swr.isLoading,
    error: swr.error,
  };
}

/** Fetch the full control-by-control evidence package for one framework. */
export function useEvidencePackage(frameworkInstanceId: string | null) {
  const swr = useApiSWR<EvidencePackage>(
    frameworkInstanceId
      ? `/v1/evidence-export/${frameworkInstanceId}/package`
      : null,
    { revalidateOnFocus: false },
  );

  return {
    pkg: swr.data?.data ?? null,
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}

async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Download the evidence binder for a framework instance as 'md' or 'pdf'. */
export async function downloadEvidenceBinder(
  frameworkInstanceId: string,
  frameworkName: string,
  format: 'md' | 'pdf' = 'md',
): Promise<void> {
  const ext = format === 'pdf' ? 'binder.pdf' : 'binder.md';
  const res = await api.raw(
    `/v1/evidence-export/${frameworkInstanceId}/${ext}`,
    { method: 'GET' },
  );
  if (!res.ok) {
    throw new Error(`Failed to download binder (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  const safeName = frameworkName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  await downloadBlob(blob, `${safeName}-evidence-binder.${format}`);
}
