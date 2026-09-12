import Link from 'next/link';
import { ButtonLink } from '../../components/ui/button';
import { MobileNavigation } from './mobile-navigation';

const links = [
  ['/budget', 'Budget'],
  ['/assets', 'Assets'],
  ['/learning', 'Learning'],
] as const;

export function SiteNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-slate-950"
        >
          Personally
        </Link>
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-5 text-sm md:flex"
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
          <ButtonLink href="/dashboard" className="min-h-0 px-4 py-2">
            Dashboard
          </ButtonLink>
        </nav>
        <MobileNavigation />
      </div>
    </header>
  );
}
