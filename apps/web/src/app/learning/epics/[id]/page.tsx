import { EpicDetail } from '../../learning-ui';
export default async function EpicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EpicDetail id={(await params).id} />;
}
