import { TaskDetail } from '../../../../learning-ui';
export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  return <TaskDetail epicId={id} taskId={taskId} />;
}
