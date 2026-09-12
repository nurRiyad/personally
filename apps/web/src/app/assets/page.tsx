import { BackButton } from '../components/back-button';
import { ProtectedRoute } from '../../components/auth';

export default function Assets() {
  return (
    <ProtectedRoute>
      <main>
        <h1>Asset Management</h1>
        <p>Hello World</p>
        <BackButton />
      </main>
    </ProtectedRoute>
  );
}
