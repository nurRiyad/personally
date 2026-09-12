'use client';

import Link from 'next/link';

export default function Error() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          500
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Something went wrong
        </h1>
        <p className="mt-3 text-slate-600">
          We couldn’t load this page right now.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
