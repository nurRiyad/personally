import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { SiteNavbar } from './components/site-navbar';
import { SiteFooter } from './components/site-footer';
import { AuthProvider } from '../components/auth';

export const metadata: Metadata = {
  title: {
    default: 'Personally | Your life, thoughtfully organized',
    template: '%s | Personally',
  },
  description: 'A private workspace for your budget, assets, and learning.',
  applicationName: 'Personally',
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
        <SiteNavbar />
        <AuthProvider>
          <div className="flex flex-1 flex-col pt-16">{children}</div>
        </AuthProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
