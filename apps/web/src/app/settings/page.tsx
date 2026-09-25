import { ProtectedRoute } from '../../components/auth';

export const metadata = {
  title: 'User settings',
};

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <main className="page-transition mx-auto w-full max-w-7xl flex-1 px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Account
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
          User settings
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Settings will be available here soon.
        </p>
      </main>
    </ProtectedRoute>
  );
}
