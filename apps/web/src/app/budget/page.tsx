import { ProtectedRoute } from '../../components/auth';
import { BudgetWorkspace } from './budget-ui';

export default function Budget() {
  return (
    <ProtectedRoute>
      <BudgetWorkspace />
    </ProtectedRoute>
  );
}
