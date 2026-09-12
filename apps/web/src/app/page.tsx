import Link from 'next/link';

const pages = [
  ['/about', 'About'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms of Service'],
  ['/dashboard', 'Dashboard'],
  ['/budget', 'Monthly Budget'],
  ['/assets', 'Asset Management'],
  ['/learning', 'Learning Management'],
] as const;

export default function Home() {
  return (
    <main>
      <h1>Personally</h1>
      <p>Hello World</p>
      <nav aria-label="Site navigation">
        <ul>
          {pages.map(([href, label]) => (
            <li key={href}>
              <Link href={href}>{label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
