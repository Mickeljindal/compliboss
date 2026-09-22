import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CTABand, PageHero, Section, SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Company | CompliBoss',
  description: 'Why CompliBoss exists: compliance that runs in the background so teams can build.',
};

export default function CompanyPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Company"
        title="We think compliance should run in the background."
        subtitle="CompliBoss was built for teams who’d rather ship than screenshot — turning audits from a quarterly fire drill into a background process."
      />
      <Section className="py-16">
        <div className="mx-auto max-w-3xl space-y-6 text-slate-300">
          <p>
            Getting compliant used to mean months of manual work: chasing screenshots, wrangling
            spreadsheets, and pulling engineers off the roadmap right before an audit. We thought
            that was backwards.
          </p>
          <p>
            CompliBoss connects to the tools you already run, maps them to the controls each
            framework requires, and keeps the evidence flowing automatically. Being compliant stops
            being a scramble and becomes the default state — so you can prove your security posture
            the moment a customer asks.
          </p>
          <p>
            We hold ourselves to the same standard we help you meet: least-privilege access,
            self-hosting, tamper-evident evidence, and your data staying yours.
          </p>
        </div>
      </Section>
      <Section className="pb-8">
        <SectionHeading title="What we value" />
        <div className="mx-auto mt-8 grid max-w-4xl gap-5 sm:grid-cols-3">
          {[
            { t: 'Honesty', b: 'We show what’s real. Native connectors are native; everything else is clearly labeled.' },
            { t: 'Ownership', b: 'Your evidence, your data, your infrastructure if you want it.' },
            { t: 'Speed', b: 'Audit-ready in weeks, not quarters — and stay ready year round.' },
          ].map((v) => (
            <div key={v.t} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-white">{v.t}</h3>
              <p className="mt-2 text-sm text-slate-300">{v.b}</p>
            </div>
          ))}
        </div>
      </Section>
      <CTABand />
      <SiteFooter />
    </main>
  );
}
