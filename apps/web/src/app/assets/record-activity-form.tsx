'use client';

import type { AssetActivityInput, AssetRecord } from '../../lib/api/assets';
import { AssetActivityForm } from './activity-form';

export function RecordActivityForm({
  assets,
  onCancel,
  onRecord,
}: {
  assets: AssetRecord[];
  onCancel: () => void;
  onRecord: (input: AssetActivityInput) => void;
}) {
  return (
    <AssetActivityForm assets={assets} onCancel={onCancel} onSave={onRecord} />
  );
}
