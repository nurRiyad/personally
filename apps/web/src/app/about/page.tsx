import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Personally, a workspace for monthly budgeting, asset tracking, and structured learning.',
  alternates: { canonical: '/about' },
};

export default function About() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-16 sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">About Personally</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 text-balance">
        Practical tools for the things you want to keep organized.
      </h1>
      <div className="mt-8 space-y-5 text-base leading-7 text-slate-600">
        <p>
          Personally brings three separate workspaces together: a monthly budget, an asset register, and a place to
          organize learning goals.
        </p>
        <p>
          The budget tracks planned and recorded income and expenses by month. Asset Management groups the things you
          own and records balance-changing activity. Learning lets you define outcomes, break them into tasks, and track
          time against them.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          [
            'Budget',
            'Create monthly income sources and spending groups, then compare planned amounts with recorded transactions.',
          ],
          ['Assets', 'Organize assets by type and review balances, activity, and changes across a selected period.'],
          ['Learning', 'Set learning outcomes, add tasks, track progress, and record study time.'],
        ].map(([title, description]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </div>
      <Link
        href="/"
        className="mt-10 inline-flex text-sm font-medium text-slate-950 underline underline-offset-4 hover:text-slate-600"
      >
        Back to home
      </Link>
    </main>
  );
}
