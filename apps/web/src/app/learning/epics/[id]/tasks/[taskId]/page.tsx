import { notFound } from 'next/navigation';
import { ProtectedRoute } from '../../../../../../components/auth';
import { TaskDetail } from '../../../../learning-ui';
import { findEpic } from '../../../../learning-data';

export default async function TaskPage({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  const values = await params;
  const epic = findEpic(values.id);
  const task = epic?.tasks.find((item) => item.id === values.taskId);
  if (!epic || !task) notFound();
  return <ProtectedRoute><TaskDetail epic={epic} task={task} /></ProtectedRoute>;
}
