import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CTABand, FeatureCard, PageHero, Section, SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Trust & Security | CompliBoss',
  description:
    'How CompliBoss protects your data: least-privilege access, self-hosting, role-based access control, and tamper-evident evidence.',
};

const PILLARS = [
  { title: 'Least-privilege access', body: 'Integrations are read-only and scoped by default. Revoke any connection at any time — you stay in control of your systems.' },
  { title: 'Self-hosting option', body: 'Deploy CompliBoss on your own infrastructure so sensitive evidence never leaves your environment.' },
  { title: 'Role-based access control', body: 'Granular permissions across your team with a complete audit log of who did what, when.' },
  { title: 'Tamper-evident evidence', body: 'Automated evidence is hashed at collection. Anyone can verify it hasn’t been altered after the fact.' },
  { title: 'Encryption', body: 'Data encrypted in transit and at rest; credentials stored in an encrypted vault with versioning.' },
  { title: 'Data ownership', body: 'Your data is yours. Export it anytime; self-host to keep it entirely within your boundary.' },
];

export default function TrustPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Trust & security"
        title="A compliance tool held to its own standard."
        subtitle="You’re buying software to prove you’re secure — so here’s exactly how we protect your data."
      />
      <Section className="py-20">
        <SectionHeading eyebrow="How we protect you" title="Security built into every layer" />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <FeatureCard key={p.title} title={p.title} body={p.body} />
          ))}
        </div>
      </Section>
      <CTABand title="Questions from your security team?" subtitle="We’ll walk through our architecture and controls in detail." />
      <SiteFooter />
    </main>
  );
}
