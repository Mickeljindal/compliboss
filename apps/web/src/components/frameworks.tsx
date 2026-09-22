const FRAMEWORKS = ['SOC 2', 'ISO 27001', 'HIPAA', 'GDPR', 'PCI DSS', 'CMMC'];

const STEPS = [
  {
    step: '01',
    title: 'Connect your stack',
    body: 'Link your cloud, code, and identity providers in minutes. CompliBoss maps them to controls automatically.',
  },
  {
    step: '02',
    title: 'Close the gaps',
    body: 'A prioritized task list shows exactly what to fix. Policies and evidence are generated as you go.',
  },
  {
    step: '03',
    title: 'Pass your audit',
    body: 'Auditors get read-only access to organized evidence. Continuous monitoring keeps you compliant after.',
  },
];

export function Frameworks() {
  return (
    <section id="frameworks" className="border-y border-white/5 bg-navy/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-soft">
            20+ frameworks
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            One platform, every framework you&apos;ll need
          </h2>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {FRAMEWORKS.map((name) => (
            <span
              key={name}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-100"
            >
              {name}
            </span>
          ))}
        </div>

        <div id="how" className="mt-20 grid gap-6 md:grid-cols-3">
          {STEPS.map((item) => (
            <div key={item.step} className="rounded-2xl border border-white/8 bg-ink/60 p-7">
              <div className="text-sm font-bold text-brand">{item.step}</div>
              <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
