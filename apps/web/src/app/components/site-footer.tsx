import Link from 'next/link';

const navigation = [
  ['/dashboard', 'Dashboard'],
  ['/budget', 'Budget'],
  ['/assets', 'Assets'],
  ['/learning', 'Learning'],
] as const;

const secondaryNavigation = [
  ['/about', 'About'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms'],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-sm">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-slate-950"
          >
            Personally
          </Link>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            A thoughtful place to research your finances, assets, and
            learning—then make better decisions.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-col gap-5 text-sm sm:flex-row sm:items-center sm:gap-8"
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {navigation.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="text-slate-600 transition-colors hover:text-slate-950"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-slate-200 sm:border-l sm:pl-8">
            {secondaryNavigation.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="text-slate-500 transition-colors hover:text-slate-950"
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </footer>
  );
}
