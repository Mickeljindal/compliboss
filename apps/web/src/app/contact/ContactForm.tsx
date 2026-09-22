'use client';

import { useState } from 'react';

export function ContactForm() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') || '');
    const company = String(data.get('company') || '');
    const email = String(data.get('email') || '');
    const framework = String(data.get('framework') || '');
    const message = String(data.get('message') || '');
    const body = encodeURIComponent(
      `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nFramework: ${framework}\n\n${message}`,
    );
    // No backend wired yet — open the user's mail client with a prefilled email.
    window.location.href = `mailto:hello@compliboss.com?subject=${encodeURIComponent(
      'CompliBoss demo request',
    )}&body=${body}`;
    setSent(true);
  };

  const field =
    'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-brand/50 focus:outline-none';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.03] p-7"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Your name" className={field} />
        <input name="company" placeholder="Company" className={field} />
      </div>
      <input name="email" type="email" required placeholder="Work email" className={field} />
      <select name="framework" defaultValue="" className={field}>
        <option value="" disabled>
          Which framework first?
        </option>
        <option>SOC 2</option>
        <option>ISO 27001</option>
        <option>HIPAA</option>
        <option>GDPR</option>
        <option>Not sure yet</option>
      </select>
      <textarea
        name="message"
        rows={4}
        placeholder="Tell us about your stack and timeline"
        className={field}
      />
      <button
        type="submit"
        className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-[#04121e] transition-transform hover:scale-[1.02]"
      >
        Request demo
      </button>
      {sent ? (
        <p className="text-center text-sm text-brand-soft">
          Opening your email client… or reach us directly at hello@compliboss.com
        </p>
      ) : (
        <p className="text-center text-xs text-slate-500">
          We’ll reply within one business day.
        </p>
      )}
    </form>
  );
}
