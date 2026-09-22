import Link from 'next/link';
import { Logo } from './logo';
import { NAV_LINKS } from '@/lib/site';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.compliboss.com';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="CompliBoss home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={APP_URL}
            className="hidden text-sm font-medium text-slate-200 hover:text-white sm:block"
          >
            Sign in
          </a>
          <Link
            href="/contact"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-[#04121e] transition-transform hover:scale-[1.03]"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </header>
  );
}
