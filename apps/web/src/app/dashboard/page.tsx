import { BackButton } from '../components/back-button';

const modules = [
  ['/budget', 'Monthly Budget'],
  ['/assets', 'Asset Management'],
  ['/learning', 'Learning Management'],
];
export default function Dashboard() {
  return (
    <main>
      <h1>Dashboard</h1>
      {modules.map(([href, name]) => (
        <p key={href}>
          <a href={href}>{name}</a>
        </p>
      ))}
      <BackButton />
    </main>
  );
}
