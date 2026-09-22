import { serverApi } from '@/lib/api-server';
import { PageHeader, PageLayout } from '@trycompai/design-system';
import type { Metadata } from 'next';
import { EvidencePackageView } from './components/EvidencePackageView';
import type { FrameworkListItem } from '@/hooks/use-evidence-export';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Evidence Package' };
}

interface FrameworkListResponse {
  data: FrameworkListItem[];
  count: number;
}

/**
 * Auditor evidence package: a control-by-control view of the evidence backing
 * each framework requirement, with a downloadable binder. Access is gated by
 * the parent auditor/layout.tsx (requireAuditorViewAccess).
 */
export default async function EvidencePackagePage() {
  const res = await serverApi.get<FrameworkListResponse>(
    '/v1/evidence-export/frameworks',
  );
  const frameworks = res.data?.data ?? [];

  return (
    <PageLayout header={<PageHeader title="Evidence Package" />}>
      <EvidencePackageView initialFrameworks={frameworks} />
    </PageLayout>
  );
}
