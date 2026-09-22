const FEATURES = [
  {
    title: 'Automated evidence collection',
    body: 'Connect AWS, GCP, GitHub, Google Workspace and more. CompliBoss continuously pulls the evidence auditors ask for — no manual screenshots.',
  },
  {
    title: 'Policies in minutes',
    body: 'Generate audit-ready policies from vetted templates, tailored to your stack, then track acknowledgements across your team.',
  },
  {
    title: 'Continuous monitoring',
    body: 'Controls are checked around the clock. The moment something drifts out of compliance, you know — and so does your remediation queue.',
  },
  {
    title: 'Trust Center',
    body: 'Share your security posture with prospects and auditors through a branded trust page that closes deals faster.',
  },
  {
    title: 'Vendor & risk management',
    body: 'Track third-party risk, run assessments, and keep a living register — all mapped to your frameworks.',
  },
  {
    title: 'Employee compliance',
    body: 'Onboard staff, run security training, and verify device health (disk encryption, screen lock, firewall) automatically.',
  },
];

export function Features() {
  return (
    <section id="platform" className="relative mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-soft">
          The platform
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Everything you need to run compliance end to end
        </h2>
        <p className="mt-4 text-slate-300">
          One system for controls, evidence, policies, people and vendors —
          instead of a dozen spreadsheets and last-minute audit scrambles.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-colors hover:border-brand/40 hover:bg-white/[0.05]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand-soft">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand" />
            </div>
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {feature.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
