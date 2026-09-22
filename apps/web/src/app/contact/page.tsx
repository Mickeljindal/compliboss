import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero, Section } from '@/components/ui';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Book a demo | CompliBoss',
  description: 'See your compliance posture on live data in about 30 minutes. Request a demo or a tailored quote.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Get started"
        title="Book a demo."
        subtitle="Tell us your frameworks and stack. We’ll show you your posture on live data and send a tailored quote within one business day."
      />
      <Section className="py-16">
        <div className="mx-auto max-w-xl">
          <ContactForm />
        </div>
      </Section>
      <SiteFooter />
    </main>
  );
}
