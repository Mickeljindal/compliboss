import Link from 'next/link';
import { Logo } from './logo';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.compliboss.com';

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Platform', href: '/platform' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Trust Center', href: '/trust' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Frameworks',
    links: [
      { label: 'SOC 2', href: '/frameworks/soc-2' },
      { label: 'ISO 27001', href: '/frameworks/iso-27001' },
      { label: 'HIPAA', href: '/frameworks/hipaa' },
      { label: 'GDPR', href: '/frameworks/gdpr' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/company' },
      { label: 'Contact', href: '/contact' },
      { label: 'Sign in', href: APP_URL },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-ink">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              Compliance automation for modern teams. Secure. Comply. Succeed.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold text-white">{col.heading}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CompliBoss. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">Secure. Comply. Succeed.</p>
        </div>
      </div>
    </footer>
  );
}
