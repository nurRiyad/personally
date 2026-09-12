'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ButtonLink } from '../../components/ui/button';

const links = [
  ['/budget', 'Budget'],
  ['/assets', 'Assets'],
  ['/learning', 'Learning'],
] as const;

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex size-11 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
      >
        <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5 fill-none stroke-current stroke-2"
        >
          {isOpen ? (
            <path d="m6 6 12 12M18 6 6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>
      {isOpen ? (
        <div
          id="mobile-navigation"
          className="absolute inset-x-4 top-[4.5rem] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/10"
        >
          <nav aria-label="Mobile navigation" className="grid gap-1">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
              >
                {label}
              </Link>
            ))}
            <ButtonLink
              href="/dashboard"
              className="mt-2 w-full"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
