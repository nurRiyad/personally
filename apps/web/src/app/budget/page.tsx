import { BackButton } from '../components/back-button';
import { ProtectedRoute } from '../../components/auth';

export default function Budget() {
  return (
    <ProtectedRoute>
      <main>
        <h1>Monthly Budget</h1>
        <p>Hello World</p>
        <BackButton />
      </main>
    </ProtectedRoute>
  );
}
