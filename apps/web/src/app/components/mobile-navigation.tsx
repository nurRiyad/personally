'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ButtonLink } from '../../components/ui/button';
import { useAuth } from '../../components/auth';

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, status, signOut } = useAuth();
  const router = useRouter();

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
            <ButtonLink
              href="/dashboard"
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </ButtonLink>
            {status === 'authenticated' ? (
              <>
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                >
                  {user?.username ?? 'Profile'} · Settings
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setIsOpen(false);
                    await signOut();
                    router.replace('/');
                  }}
                  className="rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                >
                  Log out
                </button>
              </>
            ) : status === 'unauthenticated' ? (
              <ButtonLink
                href="/auth"
                variant="secondary"
                className="mt-1 w-full"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </ButtonLink>
            ) : null}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
