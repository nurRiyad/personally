import Link from 'next/link';

export default function Terms() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-16 sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Using Personally
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 text-balance">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        Last updated: September 2026
      </p>
      <div className="mt-8 space-y-7 text-base leading-7 text-slate-600">
        <section>
          <h2 className="text-lg font-semibold text-slate-950">
            Use the app responsibly
          </h2>
          <p className="mt-2">
            Personally is a personal organization tool. Keep your account secure
            and use the service only for lawful, personal purposes.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-950">
            Your information
          </h2>
          <p className="mt-2">
            You are responsible for the accuracy of the information you enter.
            Keep independent records for important financial, tax, or legal
            decisions.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-950">
            Important notice
          </h2>
          <p className="mt-2">
            Personally provides organization and research support, not
            financial, investment, legal, or professional advice. Features may
            change as the project develops.
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
