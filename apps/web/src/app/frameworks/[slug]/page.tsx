import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CTABand, CheckList, PageHero, Section } from '@/components/ui';
import { FRAMEWORKS } from '@/lib/site';

export function generateStaticParams() {
  return FRAMEWORKS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fw = FRAMEWORKS.find((f) => f.slug === slug);
  if (!fw) return { title: 'Framework | CompliBoss' };
  return {
    title: `${fw.name} compliance | CompliBoss`,
    description: fw.summary,
  };
}

export default async function FrameworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fw = FRAMEWORKS.find((f) => f.slug === slug);
  if (!fw) notFound();

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <PageHero eyebrow={`${fw.name} compliance`} title={fw.tagline} subtitle={fw.summary} />
      <Section className="py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-white">What CompliBoss does for {fw.name}</h2>
            <div className="mt-6">
              <CheckList items={fw.highlights} />
            </div>
          </div>
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-soft">
                Who needs it
              </h3>
              <p className="mt-2 text-slate-300">{fw.whoNeedsIt}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-soft">
                Timeline
              </h3>
              <p className="mt-2 text-slate-300">{fw.timeline}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {FRAMEWORKS.filter((o) => o.slug !== fw.slug).map((o) => (
                <Link
                  key={o.slug}
                  href={`/frameworks/${o.slug}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-200 hover:text-white"
                >
                  {o.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>
      <CTABand title={`Ready for ${fw.name}?`} subtitle="See your current posture on live data in about 30 minutes." />
      <SiteFooter />
    </main>
  );
}
