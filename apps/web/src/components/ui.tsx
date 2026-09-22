import Link from 'next/link';
import type { ReactNode } from 'react';

/** Section wrapper with consistent width + spacing. */
export function Section({
  children,
  className = '',
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-6xl px-6 ${className}`}>
      {children}
    </section>
  );
}

/** Page hero for interior pages. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <div className="brand-glow pointer-events-none absolute inset-x-0 top-0 h-72" />
      <div className="grid-backdrop pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {eyebrow}
        </span>
        <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-gradient sm:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-soft">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-4 text-slate-300">{subtitle}</p> : null}
    </div>
  );
}

export function FeatureCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-colors hover:border-brand/40 hover:bg-white/[0.05]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand-soft">
        <span className="h-2.5 w-2.5 rounded-sm bg-brand" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p>
    </div>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-slate-200">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand/15 text-xs text-brand-soft">
            ✓
          </span>
          <span className="text-[15px] leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CTABand({
  title = 'Ready to get audit-ready?',
  subtitle = 'See your compliance posture on live data in about 30 minutes.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <Section className="py-24">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-800 px-8 py-16 text-center">
        <div className="brand-glow pointer-events-none absolute inset-x-0 top-0 h-64" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">{subtitle}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-[#04121e] transition-transform hover:scale-[1.03] sm:w-auto"
            >
              Book a demo
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5 sm:w-auto"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
