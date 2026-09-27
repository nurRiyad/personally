'use client';

import { assetDraftSchema, type AssetDraft } from '@personally/validation';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';

export function EditAssetForm({
  asset,
  assetTypes,
  onCancel,
  onSave,
}: {
  asset: AssetDraft;
  assetTypes: string[];
  onCancel: () => void;
  onSave: (asset: AssetDraft) => void;
}) {
  const form = useForm<AssetDraft>({ defaultValues: asset });
  const error = (name: keyof AssetDraft) =>
    form.formState.errors[name]?.message;

  const submit = (values: AssetDraft) => {
    const parsed = assetDraftSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) =>
        form.setError(issue.path[0] as keyof AssetDraft, {
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
        name="kind"
        render={({ field }) => (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Asset type
            </p>
            <Select
              label="Asset type"
              value={field.value}
              options={assetTypes}
              onValueChange={field.onChange}
              className="w-full"
            />
            <p className="mt-1 text-xs text-red-600" role="alert">
              {error('kind')}
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
          type="number"
          readOnly
          tabIndex={-1}
          className="bg-slate-50 text-slate-500"
          {...form.register('openingValue', { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-slate-500">
          Current value changes are recorded through asset activity.
        </p>
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
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            Include its current value in the liquid money summary.
          </span>
        </span>
      </label>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
