import { BackButton } from '../components/back-button';
import { ProtectedRoute } from '../../components/auth';

export default function Learning() {
  return (
    <ProtectedRoute>
      <main>
        <h1>Learning Management</h1>
        <p>Hello World</p>
        <BackButton />
      </main>
    </ProtectedRoute>
  );
}
