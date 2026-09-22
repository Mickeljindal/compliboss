export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="brand-glow pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <div className="grid-backdrop pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-20 text-center sm:pt-28">
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-200"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Compliance on autopilot — audit-ready in weeks
        </a>

        <h1 className="mx-auto mt-7 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-gradient sm:text-6xl">
          Get compliant. Stay compliant. Win the deal.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          CompliBoss automates evidence collection, policies, and continuous
          monitoring across SOC&nbsp;2, ISO&nbsp;27001, HIPAA and GDPR — so your
          team can focus on building, not chasing screenshots.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#pricing"
            className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03] sm:w-auto"
          >
            Start your free trial
          </a>
          <a
            href="#how"
            className="w-full rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5 sm:w-auto"
          >
            See how it works
          </a>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          No credit card required · SOC 2 in as little as 4 weeks
        </p>
      </div>
    </section>
  );
}
