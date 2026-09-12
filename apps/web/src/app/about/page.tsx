import Link from 'next/link';

export default function About() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-16 sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        About Personally
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 text-balance">
        A clearer way to understand your everyday life.
      </h1>
      <div className="mt-8 space-y-5 text-base leading-7 text-slate-600">
        <p>
          Personally is a private workspace for the things that shape your life:
          money, assets, and learning.
        </p>
        <p>
          It brings these areas together so you can research your options, see
          the bigger picture, and make steady decisions with confidence.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ['Budget', 'Plan monthly spending with more clarity.'],
          ['Assets', 'Keep a simple view of what you own.'],
          ['Learning', 'Track the knowledge you are building.'],
        ].map(([title, description]) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
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
