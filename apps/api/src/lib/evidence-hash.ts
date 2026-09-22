import { createHash } from 'node:crypto';
import stringify from 'safe-stable-stringify';

/**
 * Tamper-evidence for collected evidence.
 *
 * We hash the meaningful content of a check result at write time and store the
 * digest alongside it. An auditor (or the /verify endpoint) can recompute the
 * hash from the stored row and confirm it matches — proving the evidence has
 * not been altered after collection. Uses a canonical (stable-key-order) JSON
 * so the hash is deterministic regardless of property ordering.
 */
export interface HashableEvidence {
  resourceType: string;
  resourceId: string;
  passed: boolean;
  title: string;
  evidence: unknown;
  collectedAt: Date | string;
}

export function computeEvidenceContentHash(input: HashableEvidence): string {
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
