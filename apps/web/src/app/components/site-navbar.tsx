import Link from 'next/link';

const links = [
  ['/budget', 'Budget'],
  ['/assets', 'Assets'],
  ['/learning', 'Learning'],
] as const;

export function SiteNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-slate-950"
        >
          Personally
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-5 text-sm"
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="text-slate-600 transition-colors hover:text-slate-950"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="rounded-full bg-slate-950 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-700"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
