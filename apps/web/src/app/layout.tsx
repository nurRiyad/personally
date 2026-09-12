import type { ReactNode } from 'react';
import './globals.css';
import { SiteNavbar } from './components/site-navbar';
import { SiteFooter } from './components/site-footer';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
        <SiteNavbar />
        <div className="flex flex-1 flex-col pt-16">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
