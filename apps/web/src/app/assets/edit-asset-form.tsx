'use client';

import { assetPatchSchema, type AssetPatchInput } from '@personally/validation';
import { Controller, useForm } from 'react-hook-form';
import type { AssetRecord, AssetType } from '../../lib/api/assets';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';

export function EditAssetForm({
  asset,
  assetTypes,
  onCancel,
  onSave,
}: {
  asset: AssetRecord;
  assetTypes: AssetType[];
  onCancel: () => void;
  onSave: (asset: AssetPatchInput) => void;
}) {
  const form = useForm<AssetPatchInput>({
    defaultValues: {
      typeId: asset.typeId,
      name: asset.name,
      detail: asset.detail,
      isLiquid: asset.isLiquid,
      isReceivable: asset.isReceivable,
    },
  });
  const error = (name: keyof AssetPatchInput) =>
    form.formState.errors[name]?.message;
  const submit = (values: AssetPatchInput) => {
    const parsed = assetPatchSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) =>
        form.setError(issue.path[0] as keyof AssetPatchInput, {
          message: issue.message,
        }),
      );
      return;
    }
    onSave(parsed.data);
  };
  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <Controller
        control={form.control}
        name="typeId"
        render={({ field }) => (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Asset type
            </p>
            <Select
              label="Asset type"
              value={field.value ?? ''}
              options={[]}
              items={assetTypes.map((type) => ({
                value: type.id,
                label: type.name,
              }))}
              onValueChange={field.onChange}
              className="w-full"
            />
            <p className="mt-1 text-xs text-red-600" role="alert">
              {error('typeId')}
            </p>
          </div>
        )}
      />
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Name</span>
        <Input autoComplete="off" {...form.register('name')} />
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error('name')}
        </p>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Current value</span>
        <Input
          value={asset.currentValue}
          readOnly
          tabIndex={-1}
          className="bg-slate-50 text-slate-500"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Value changes are recorded through asset activity.
        </span>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Details</span>
        <Input autoComplete="off" {...form.register('detail')} />
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error('detail')}
        </p>
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-emerald-700"
          {...form.register('isLiquid')}
        />
        <span>
          <span className="block font-medium text-slate-800">
            This asset is liquid money
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            Include its current value in liquid money.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-emerald-700"
          {...form.register('isReceivable')}
        />
        <span>
          <span className="block font-medium text-slate-800">
            Money is owed to me
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            Track this as money lent and allow repayments against it.
          </span>
        </span>
      </label>
      <p className="text-xs text-red-600" role="alert">
        {error('isReceivable')}
      </p>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
