'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../components/auth';

export function HomeAuthRedirect() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [router, status]);

  if (status === 'unauthenticated') return null;

  return (
    <div
      aria-label="Loading your workspace"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50"
    >
      <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
        <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
        Loading your workspace…
      </div>
    </div>
  );
}
