'use client';

import type { AssetActivityInput, AssetActivity, AssetRecord } from '../../lib/api/assets';
import { AssetActivityForm } from './activity-form';

export function EditActivityForm({
  activity,
  assets,
  onCancel,
  onSave,
}: {
  activity: AssetActivity;
  assets: AssetRecord[];
  onCancel: () => void;
  onSave: (input: AssetActivityInput) => void;
}) {
  return <AssetActivityForm assets={assets} activity={activity} onCancel={onCancel} onSave={onSave} />;
}
