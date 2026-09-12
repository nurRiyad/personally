import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { HomeAuthRedirect } from './components/home-auth-redirect';

export const metadata: Metadata = {
  title: 'Your life, thoughtfully organized',
  description:
    'Personally brings your budget, assets, and learning into one private workspace for clearer everyday decisions.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Personally | Your life, thoughtfully organized',
    description: 'A private workspace for your budget, assets, and learning.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Personally | Your life, thoughtfully organized',
    description: 'A private workspace for your budget, assets, and learning.',
  },
};

const benefits = [
  [
    'Clarity, not clutter',
    'Bring the pieces of your everyday life into focus.',
  ],
  ['Built around you', 'A personal workspace designed for your own decisions.'],
  [
    'See the connections',
    'Understand progress across money, belongings, and growth.',
  ],
] as const;

const modules = [
  {
    href: '/budget',
    eyebrow: 'Monthly Budget',
    title: 'Make room for what matters.',
    description:
      'Plan monthly spending with a calmer, clearer view of where your money goes.',
    color: 'bg-emerald-50 text-emerald-800',
    icon: <path d="M5 7.5h14v9H5zM8 12h.01M16 12h.01" />,
    preview: <BudgetPreview />,
  },
  {
    href: '/assets',
    eyebrow: 'Asset Management',
    title: 'Keep what you own in view.',
    description:
      'Build a simple picture of your assets, so the bigger picture stays close at hand.',
    color: 'bg-violet-50 text-violet-800',
    icon: (
      <path d="M4.5 19.5h15M6.5 19.5v-10h11v10M9 9.5V5.5h6v4M9.5 14h.01M14.5 14h.01" />
    ),
    preview: <AssetsPreview />,
  },
  {
    href: '/learning',
    eyebrow: 'Learning Management',
    title: 'Give your curiosity a home.',
    description:
      'Hold on to the knowledge you are building and move forward with intention.',
    color: 'bg-amber-50 text-amber-800',
    icon: (
      <path d="M5 5.5h5.5a2 2 0 0 1 2 2v11a2 2 0 0 0-2-2H5zM20 5.5h-5.5a2 2 0 0 0-2 2v11a2 2 0 0 1 2-2H20z" />
    ),
    preview: <LearningPreview />,
  },
] as const;

const steps = [
  [
    '01',
    'Gather your essentials',
    'Give your budget, assets, and learning a shared place to live.',
  ],
  [
    '02',
    'Find the signal',
    'See the context that helps everyday decisions feel less uncertain.',
  ],
  [
    '03',
    'Move forward steadily',
    'Turn a clearer picture into the next thoughtful step.',
  ],
] as const;

export default function Home() {
  return (
    <main>
      <HomeAuthRedirect />
      <section className="overflow-hidden bg-[#f8faf8]">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1fr_0.88fr] lg:items-center lg:gap-16 lg:pb-28">
          <div className="max-w-2xl animate-rise-in">
            <p className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-800">
              One considered space, for your whole life
            </p>
            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.055em] text-slate-950 text-balance sm:text-6xl lg:text-7xl">
              The life you’re building, in clearer view.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Personally brings your budget, assets, and learning into one
              private workspace—so the next step feels easier to see.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/dashboard">
                Explore your workspace <ArrowIcon />
              </ButtonLink>
              <ButtonLink href="#how-it-works" variant="secondary">
                See how it works
              </ButtonLink>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      <section
        aria-label="Why Personally"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto grid w-full max-w-6xl divide-y divide-slate-200 px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0">
          {benefits.map(([title, description]) => (
            <div
              key={title}
              className="py-7 md:px-8 md:first:pl-0 md:last:pr-0"
            >
              <h2 className="font-semibold tracking-tight text-slate-950">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="modules"
        className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Designed around real life
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 text-balance sm:text-4xl">
            Three places to understand what matters to you.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Each area stands on its own, while helping you see a more complete
            personal picture.
          </p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {modules.map((module) => (
            <Card
              key={module.href}
              className="group flex min-h-[29rem] flex-col overflow-hidden transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/5"
            >
              <div className="p-7 pb-5">
                <div
                  className={`flex size-11 items-center justify-center rounded-2xl ${module.color}`}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5 fill-none stroke-current stroke-[1.8]"
                  >
                    {module.icon}
                  </svg>
                </div>
                <p className="mt-6 text-sm font-semibold text-slate-500">
                  {module.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
                  {module.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {module.description}
                </p>
              </div>
              <div className="mt-auto px-5">{module.preview}</div>
              <Link
                href={module.href}
                className="mx-7 mb-7 mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 underline-offset-4 transition-colors hover:text-slate-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                Explore {module.eyebrow} <ArrowIcon />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-950 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              A more considered rhythm
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl">
              Less time piecing things together. More room to act on what you
              know.
            </h2>
          </div>
          <ol className="grid gap-7 sm:grid-cols-3 sm:gap-5">
            {steps.map(([number, title, description]) => (
              <li key={number} className="border-t border-white/20 pt-5">
                <span className="text-sm font-semibold text-emerald-300">
                  {number}
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-amber-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">
              Start where you are
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 text-balance sm:text-4xl">
              A more thoughtful view of your life is waiting.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-700">
              Step into your workspace and explore the foundations of
              Personally.
            </p>
          </div>
          <ButtonLink href="/dashboard" className="shrink-0">
            Go to dashboard <ArrowIcon />
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4 fill-none stroke-current stroke-2"
    >
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg animate-rise-in [animation-delay:120ms]">
      <div
        aria-hidden="true"
        className="absolute -inset-12 -z-10 rounded-full bg-emerald-100/60 blur-3xl"
      />
      <div className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur">
        <div className="rounded-[1.5rem] bg-slate-950 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">
              Your overview
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
              September
            </span>
          </div>
          <p className="mt-8 text-sm text-slate-400">
            A calm moment to check in
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Everything, in context.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {['Budget', 'Assets', 'Learning'].map((item, index) => (
              <div key={item} className="rounded-xl bg-white/[0.08] p-3">
                <div
                  className={`size-2 rounded-full ${['bg-emerald-300', 'bg-violet-300', 'bg-amber-300'][index]}`}
                />
                <p className="mt-5 text-xs font-medium text-slate-200">
                  {item}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-white/70"
                    style={{ width: `${[72, 58, 84][index]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-emerald-50 p-5">
            <p className="text-xs font-semibold text-emerald-800">
              A clearer month
            </p>
            <div className="mt-4 h-2 w-4/5 rounded-full bg-emerald-200" />
            <div className="mt-2 h-2 w-3/5 rounded-full bg-emerald-100" />
          </div>
          <div className="rounded-2xl bg-amber-50 p-5">
            <p className="text-xs font-semibold text-amber-800">Keep growing</p>
            <div className="mt-4 flex gap-1">
              <span className="size-4 rounded bg-amber-300" />
              <span className="size-4 rounded bg-amber-200" />
              <span className="size-4 rounded bg-amber-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function BudgetPreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-t-2xl border border-b-0 border-emerald-100 bg-emerald-50 p-5"
    >
      <div className="flex items-end gap-2">
        <div className="h-10 flex-1 rounded-t bg-emerald-200" />
        <div className="h-16 flex-1 rounded-t bg-emerald-300" />
        <div className="h-8 flex-1 rounded-t bg-emerald-100" />
        <div className="h-20 flex-1 rounded-t bg-emerald-500" />
      </div>
      <div className="mt-4 flex justify-between text-[10px] font-medium text-emerald-800">
        <span>Spending plan</span>
        <span>On track</span>
      </div>
    </div>
  );
}
function AssetsPreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-t-2xl border border-b-0 border-violet-100 bg-violet-50 p-5"
    >
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-violet-800">
            Your snapshot
          </span>
          <span className="size-2 rounded-full bg-violet-400" />
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-violet-100">
          <div className="h-full w-3/4 rounded-full bg-violet-400" />
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-6 flex-1 rounded bg-violet-100" />
          <div className="h-6 flex-1 rounded bg-violet-50" />
        </div>
      </div>
    </div>
  );
}
function LearningPreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-t-2xl border border-b-0 border-amber-100 bg-amber-50 p-5"
    >
      <div className="flex gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-sm font-bold text-amber-950">
          A
        </div>
        <div className="flex-1">
          <div className="h-2 w-4/5 rounded-full bg-amber-300" />
          <div className="mt-2 h-2 w-3/5 rounded-full bg-amber-100" />
          <div className="mt-4 flex gap-1">
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-amber-300" />
            <span className="size-2 rounded-full bg-amber-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
