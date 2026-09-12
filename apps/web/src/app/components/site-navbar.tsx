'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button, ButtonLink } from '../../components/ui/button';
import { Avatar } from '../../components/ui/avatar';
import { useAuth } from '../../components/auth';
import { MobileNavigation } from './mobile-navigation';

export function SiteNavbar() {
  const { user, status, signOut } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsProfileOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-slate-950"
        >
          Personally
        </Link>
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-5 text-sm md:flex"
        >
          <ButtonLink
            href="/dashboard"
            variant="ghost"
            className="min-h-0 px-3 py-2 text-slate-600"
          >
            Dashboard
          </ButtonLink>
          {status === 'authenticated' ? (
            <div ref={profileMenuRef} className="relative">
              <Button
                type="button"
                variant="ghost"
                aria-label="Open profile menu"
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                onClick={() => setIsProfileOpen((open) => !open)}
                className="size-10 !p-0 !text-slate-700"
              >
                <Avatar
                  fallback={user?.username ?? 'P'}
                  className="size-9 border border-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-white"
                />
              </Button>
              {isProfileOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-10 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {user?.username}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user?.email}
                    </p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      role="menuitem"
                      className="block rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    >
                      User Settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await signOut();
                        router.replace('/');
                      }}
                      className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : status === 'unauthenticated' ? (
            <ButtonLink
              href="/auth"
              variant="secondary"
              className="min-h-0 px-4 py-2"
            >
              Sign In
            </ButtonLink>
          ) : (
            <span
              aria-label="Loading profile"
              className="inline-flex size-10 animate-pulse rounded-full border border-slate-200 bg-slate-100"
            />
          )}
        </nav>
        <MobileNavigation />
      </div>
    </header>
  );
}
