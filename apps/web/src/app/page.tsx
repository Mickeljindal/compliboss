import { CTA } from '@/components/cta';
import { Features } from '@/components/features';
import { Frameworks } from '@/components/frameworks';
import { Hero } from '@/components/hero';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <Hero />
      <Features />
      <Frameworks />
      <CTA />
      <SiteFooter />
    </main>
  );
}
