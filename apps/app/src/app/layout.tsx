import '@trycompai/design-system/globals.css';
// CompliBoss brand token overrides — MUST load after the design-system CSS.
import '@/styles/brand.css';

import { env } from '@/env.mjs';
import { auth } from '@/utils/auth';
import { Analytics as DubAnalytics } from '@dub/analytics/react';
import { cn } from '@trycompai/ui/cn';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { GeistMono } from 'geist/font/mono';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';
import { Providers } from './providers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// TODO(compliboss): replace compliboss.com with your production domain and host
// the opengraph image at the referenced CDN path before launch.
export const metadata: Metadata = {
  metadataBase: new URL('https://app.compliboss.com'),
  title: 'CompliBoss | Automate SOC 2, ISO 27001 and GDPR compliance with AI.',
  description: 'Automate SOC 2, ISO 27001 and GDPR compliance with AI.',
  twitter: {
    title: 'CompliBoss | Automate SOC 2, ISO 27001 and GDPR compliance with AI.',
    description: 'Automate SOC 2, ISO 27001 and GDPR compliance with AI.',
    images: [
      {
        url: 'https://cdn.compliboss.com/opengraph-image.jpg',
        width: 800,
        height: 600,
      },
      {
        url: 'https://cdn.compliboss.com/opengraph-image.jpg',
        width: 1800,
        height: 1600,
      },
    ],
  },
  openGraph: {
    title: 'CompliBoss | Automate SOC 2, ISO 27001 and GDPR compliance with AI.',
    description: 'Automate SOC 2, ISO 27001 and GDPR compliance with AI.',
    url: 'https://app.compliboss.com',
    siteName: 'CompliBoss',
    images: [
      {
        url: 'https://cdn.compliboss.com/opengraph-image.jpg',
        width: 800,
        height: 600,
      },
      {
        url: 'https://cdn.compliboss.com/opengraph-image.jpg',
        width: 1800,
        height: 1600,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)' },
    { media: '(prefers-color-scheme: dark)' },
  ],
};

const font = localFont({
  src: '/../../public/fonts/GeneralSans-Variable.ttf',
  display: 'swap',
  variable: '--font-general-sans',
});

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const dubIsEnabled = env.DUB_API_KEY !== undefined;
  const dubReferUrl = env.DUB_REFER_URL;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {dubIsEnabled && dubReferUrl && (
          <DubAnalytics
            domainsConfig={{
              refer: dubReferUrl,
            }}
          />
        )}
      </head>
      <body className={cn(`${GeistMono.variable} ${font.variable}`, 'antialiased')}>
        <NuqsAdapter>
          <Providers session={session}>{children}</Providers>
        </NuqsAdapter>
        <Toaster richColors />
        <VercelAnalytics />
      </body>
    </html>
  );
}
