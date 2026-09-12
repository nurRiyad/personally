import { notFound } from 'next/navigation';
import { ProtectedRoute } from '../../../../components/auth';
import { EpicDetail } from '../../learning-ui';
import { findEpic } from '../../learning-data';

export default async function EpicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const epic = findEpic((await params).id);
  if (!epic) notFound();
  return (
    <ProtectedRoute>
      <EpicDetail epic={epic} />
    </ProtectedRoute>
  );
}
