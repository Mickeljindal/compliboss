import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import {
  CTABand,
  FeatureCard,
  PageHero,
  Section,
  SectionHeading,
} from '@/components/ui';

export const metadata: Metadata = {
  title: 'Platform | CompliBoss',
  description:
    'One platform to run compliance end to end — controls, automated evidence, policies, risk, vendors, people and an auditor-ready evidence package.',
};

const FEATURES = [
  { title: 'Automated evidence collection', body: 'Connect your cloud, code and identity providers. CompliBoss continuously pulls the evidence auditors ask for — timestamped and source-attributed.' },
  { title: 'Control library & mapping', body: 'A versioned library maps every framework requirement to controls, so you always know what proves what.' },
  { title: 'Policies in minutes', body: 'Generate audit-ready policies from vetted templates, tailored to your stack, with acknowledgements tracked.' },
  { title: 'Continuous monitoring', body: 'Controls are checked around the clock. Drift lands in a prioritized remediation queue the moment it happens.' },
  { title: 'Auditor evidence package', body: 'A control-by-control binder — mapped requirements, evidence and coverage — exportable as a branded PDF.' },
  { title: 'Tamper-evident integrity', body: 'Every automated evidence record is hashed at collection, so you can prove nothing was altered after the fact.' },
  { title: 'Risk & vendor management', body: 'A living risk register and third-party risk tracking, all mapped back to your frameworks.' },
  { title: 'People & device compliance', body: 'Onboard staff, run security training, and verify device health — encryption, screen lock, firewall.' },
  { title: 'Trust Center', body: 'Share your posture with prospects through a branded page that shortens security reviews.' },
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="The platform"
        title="Run compliance end to end — on autopilot."
        subtitle="Controls, evidence, policies, risk, vendors and people in one system, instead of a dozen spreadsheets and a last-minute audit scramble."
      />
      <Section className="py-20">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything the auditor asks for, collected for you"
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} title={f.title} body={f.body} />
          ))}
        </div>
      </Section>
      <CTABand />
      <SiteFooter />
    </main>
  );
}
