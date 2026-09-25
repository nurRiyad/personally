import { ProtectedRoute } from '../../components/auth';
import { AssetsWorkspace } from './assets-ui';

export default function Assets() {
  return (
    <ProtectedRoute>
      <AssetsWorkspace />
    </ProtectedRoute>
  );
}
