import { ProtectedRoute } from '../../components/auth';
import { LearningOverview } from './learning-ui';
import { learningEpics } from './learning-data';

export default function Learning() {
  return (
    <ProtectedRoute>
      <LearningOverview epics={learningEpics} />
    </ProtectedRoute>
  );
}
