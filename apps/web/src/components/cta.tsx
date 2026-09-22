export function CTA() {
  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-800 px-8 py-16 text-center">
        <div className="brand-glow pointer-events-none absolute inset-x-0 top-0 h-64" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get audit-ready?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Start free and see your compliance posture in a day. Upgrade when
            you&apos;re ready to bring in your auditor.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#"
              className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03] sm:w-auto"
            >
              Start free trial
            </a>
            <a
              href="#"
              className="w-full rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5 sm:w-auto"
            >
              Book a demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
