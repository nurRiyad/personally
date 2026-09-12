'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from './auth-provider';

export function safeReturnTo(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//'))
    return '/dashboard';
  return path;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated')
      router.replace(
        `/auth?returnTo=${encodeURIComponent(pathname || '/dashboard')}`,
      );
  }, [pathname, router, status]);

  if (status !== 'authenticated')
    return (
      <main className="flex flex-1 items-center justify-center px-5 py-20 text-sm text-slate-600">
        Checking your workspace…
      </main>
    );
  return children;
}
