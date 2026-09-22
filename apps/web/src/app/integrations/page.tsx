import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CTABand, PageHero, Section, SectionHeading } from '@/components/ui';
import { NATIVE_INTEGRATIONS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Integrations | CompliBoss',
  description:
    'Native, read-only connectors for AWS, Azure, GCP, GitHub, Google Workspace and JumpCloud — plus an AI Agent for everything else.',
};

export default function IntegrationsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Integrations"
        title="Native connectors for your core stack."
        subtitle="Deep, continuous evidence collection from the systems that matter — read-only by default, scoped, and revocable any time."
      />
      <Section className="py-20">
        <SectionHeading eyebrow="Native connectors" title="Continuous evidence, out of the box" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {NATIVE_INTEGRATIONS.map((i) => (
            <div key={i.name} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-white">{i.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{i.note}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section className="pb-8">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8 text-center">
          <span className="inline-block rounded-full border border-dashed border-brand/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-soft">
            AI Agent
          </span>
          <h3 className="mt-4 text-2xl font-bold text-white">Anything else? Just ask the agent.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Beyond the native connectors, CompliBoss’s AI Agent can pull compliance evidence
            from tools like Okta, Slack, Jira and internal systems — described in plain language,
            no custom connector required.
          </p>
        </div>
      </Section>
      <CTABand />
      <SiteFooter />
    </main>
  );
}
