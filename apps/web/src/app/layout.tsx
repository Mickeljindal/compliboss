import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://compliboss.com'),
  title: 'CompliBoss | Automate SOC 2, ISO 27001, HIPAA & GDPR compliance',
  description:
    'CompliBoss gets startups audit-ready fast — automated evidence collection, policy management, and continuous monitoring across SOC 2, ISO 27001, HIPAA and GDPR.',
  openGraph: {
    title: 'CompliBoss | Compliance on autopilot',
    description:
      'Automated evidence collection, policies, and continuous monitoring for SOC 2, ISO 27001, HIPAA and GDPR.',
    url: 'https://compliboss.com',
    siteName: 'CompliBoss',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
