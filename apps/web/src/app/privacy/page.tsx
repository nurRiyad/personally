import Link from 'next/link';

export default function Privacy() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Your privacy
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 text-balance">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        Last updated: September 2026
      </p>
      <div className="mt-8 space-y-7 text-base leading-7 text-slate-600">
        <section>
          <h2 className="text-lg font-semibold text-slate-950">
            What Personally stores
          </h2>
          <p className="mt-2">
            Personally stores the information you add to your budget, asset, and
            learning spaces so the app can provide those features.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-950">
            How information is used
          </h2>
          <p className="mt-2">
            Your information is used to organize your workspace, improve
            reliability, and help you understand your own decisions. It is not
            sold to advertisers.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-950">Your choices</h2>
          <p className="mt-2">
            You can review, update, or remove information you have entered. For
            privacy questions, contact the Personally team through the project’s
            support channel.
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
