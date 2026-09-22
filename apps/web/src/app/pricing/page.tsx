import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CTABand, PageHero, Section } from '@/components/ui';
import { PRICING } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Pricing | CompliBoss',
  description:
    'Pricing scaled to your scope — frameworks, company size, and managed vs. self-hosted. Request a tailored quote.',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Pricing"
        title="Priced to fit your program — not bloated bundles."
        subtitle="What you pay depends on the frameworks in scope, your company size, and whether you run managed or self-hosted. Tell us your setup and we’ll send a tailored quote."
      />
      <Section className="py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {PRICING.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-7 ${
                tier.featured
                  ? 'border-brand/50 bg-brand/[0.06]'
                  : 'border-white/8 bg-white/[0.03]'
              }`}
            >
              {tier.featured ? (
                <span className="mb-3 inline-block w-fit rounded-full bg-brand/20 px-2.5 py-0.5 text-xs font-semibold text-brand-soft">
                  Most popular
                </span>
              ) : null}
              <h3 className="text-xl font-bold text-white">{tier.name}</h3>
              <p className="mt-1 text-sm text-slate-300">{tier.blurb}</p>
              <div className="mt-5 text-2xl font-extrabold text-white">On request</div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {tier.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-slate-200">
                    <span className="mt-0.5 text-brand-soft">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="mt-7 w-full rounded-full bg-brand px-5 py-2.5 text-center text-sm font-semibold text-[#04121e]"
              >
                Request a quote
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-400">
          Tailored proposal within one business day. No credit card to start a trial.
        </p>
      </Section>
      <CTABand title="Not sure which fits?" subtitle="Tell us your frameworks and stack — we’ll recommend the right plan." />
      <SiteFooter />
    </main>
  );
}
