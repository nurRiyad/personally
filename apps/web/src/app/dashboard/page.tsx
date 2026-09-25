import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from '../../components/ui/card';
import { ProtectedRoute } from '../../components/auth';

export const metadata = {
  title: 'Dashboard',
};

type Module = {
  href: string;
  eyebrow: string;
  name: string;
  description: string;
  icon: ReactNode;
  iconClassName: string;
  accentClassName: string;
};

const modules: Module[] = [
  {
    href: '/budget',
    eyebrow: 'Money, made clear',
    name: 'Budget',
    description:
      'Plan your spending, stay on track, and make room for what matters.',
    iconClassName: 'bg-emerald-100 text-emerald-700',
    accentClassName:
      'group-hover:border-emerald-200 group-hover:shadow-emerald-950/10',
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path
          d="M3.5 7.5h17v11h-17z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 7.5V6a1.5 1.5 0 0 1 1.5-1.5h13a2 2 0 0 1 2 2v1"
          strokeLinecap="round"
        />
        <path
          d="M16 12.5h4.5v3H16a1.5 1.5 0 1 1 0-3Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/assets',
    eyebrow: 'What you own',
    name: 'Assets',
    description:
      'See the bigger picture of your accounts, investments, and net worth.',
    iconClassName: 'bg-sky-100 text-sky-700',
    accentClassName: 'group-hover:border-sky-200 group-hover:shadow-sky-950/10',
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path
          d="M4 19.5V10m5.3 9.5V5m5.4 14.5v-7m5.3 7V2.5"
          strokeLinecap="round"
        />
        <path
          d="m3 7 5.5-3 5.3 2.5L21 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/learning',
    eyebrow: 'Keep growing',
    name: 'Learning',
    description:
      'Turn curiosity into momentum with a home for your learning goals.',
    iconClassName: 'bg-violet-100 text-violet-700',
    accentClassName:
      'group-hover:border-violet-200 group-hover:shadow-violet-950/10',
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path
          d="m3 8.5 9-4 9 4-9 4-9-4Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 10.5v5c2.3 2 9.7 2 12 0v-5M21 9v6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <main className="page-transition mx-auto w-full max-w-7xl flex-1 px-5 py-16 sm:px-8 sm:py-20">
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Your personal workspace
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            A little more clarity, every day.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Choose a space to focus on what matters right now.
          </p>
        </section>

        <section
          aria-label="Personal workspace features"
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {modules.map((module, index) => (
            <Link
              key={module.href}
              href={module.href}
              className="group animate-rise-in"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <Card
                className={`flex h-full min-h-80 flex-col p-7 transform-gpu transition-[border-color,box-shadow,transform] duration-500 ease-out will-change-transform group-hover:-translate-y-1 group-hover:shadow-xl ${module.accentClassName}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${module.iconClassName}`}
                >
                  {module.icon}
                </div>
                <p className="mt-8 text-sm font-medium text-slate-500">
                  {module.eyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {module.name}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {module.description}
                </p>
                <span className="mt-auto flex items-center gap-2 pt-8 text-sm font-semibold text-slate-950">
                  Open dashboard
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Card>
            </Link>
          ))}
          <Card className="relative flex min-h-80 flex-col overflow-hidden border-dashed border-slate-300 bg-slate-50/70 p-7 animate-rise-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
              >
                <path d="M4 19V5m0 14h16" strokeLinecap="round" />
                <path
                  d="m7 15 3-4 3 2 5-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="mt-8 w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Coming soon
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Yearly spending summary
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              See your full-year spending patterns, trends, and progress in one
              clear view.
            </p>
            <span className="mt-auto pt-8 text-sm font-semibold text-slate-500">
              We’re preparing this view
            </span>
          </Card>
        </section>
      </main>
    </ProtectedRoute>
  );
}
