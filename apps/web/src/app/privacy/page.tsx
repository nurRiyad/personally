import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Personally uses account and workspace information to provide its budgeting, asset, and learning features.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-16 sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Your privacy</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 text-balance">Privacy Policy</h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: September 2026</p>
      <div className="mt-8 space-y-7 text-base leading-7 text-slate-600">
        <section>
          <h2 className="text-lg font-semibold text-slate-950">What Personally stores</h2>
          <p className="mt-2">
            Personally stores account information and the records you create in the app, including budget plans and transactions, asset details and activity, and learning outcomes, tasks, and time entries. These records are associated with your account so they can be loaded in your workspace.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-950">How information is used</h2>
          <p className="mt-2">
            The app uses account and workspace information to provide sign-in and the features you use. Your current session token is kept in browser session storage. Do not enter information you do not want stored in your account.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-950">Your choices</h2>
          <p className="mt-2">
            You can review and edit many records in the workspace, and some records can be deleted or archived. If you need help with account or data removal, use the support contact provided by the service operator.
          </p>
        </section>
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
