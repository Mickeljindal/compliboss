import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CTABand, PageHero, Section, SectionHeading } from '@/components/ui';
import { FRAMEWORKS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Frameworks | CompliBoss',
  description:
    'SOC 2, ISO 27001, HIPAA, GDPR and more — one evidence base, every framework you need.',
};

export default function FrameworksPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Frameworks"
        title="One evidence base. Every framework you’ll need."
        subtitle="Start with the report your buyers ask for today, then reuse the same evidence to add frameworks tomorrow — without starting over."
      />
      <Section className="py-20">
        <SectionHeading title="Pick your starting point" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {FRAMEWORKS.map((f) => (
            <Link
              key={f.slug}
              href={`/frameworks/${f.slug}`}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-7 transition-colors hover:border-brand/40 hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{f.name}</h3>
                <span className="text-brand-soft transition-transform group-hover:translate-x-1">→</span>
              </div>
              <p className="mt-2 text-sm font-medium text-brand-soft">{f.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{f.summary}</p>
            </Link>
          ))}
        </div>
      </Section>
      <CTABand />
      <SiteFooter />
    </main>
  );
}
