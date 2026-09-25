'use client';

import { assetDraftSchema, type AssetDraft } from '@personally/validation';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';

export function AddAssetForm({
  onCancel,
  onAdd,
  assetTypes,
}: {
  onCancel: () => void;
  onAdd: (asset: AssetDraft) => void;
  assetTypes: string[];
}) {
  const form = useForm<AssetDraft>({
    defaultValues: {
      kind: assetTypes[0] ?? '',
      name: '',
      openingValue: 0,
      openedOn: new Date().toISOString().slice(0, 10),
      detail: '',
    },
  });
  const kind = form.watch('kind');
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
    onAdd(parsed.data);
  };
  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <p className="text-sm text-slate-600">Add the holding details below.</p>
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
            {assetTypes.length === 0 && (
              <p className="mt-1 text-xs text-red-600">
                Create an asset type first.
              </p>
            )}
            <p className="mt-1 text-xs text-red-600" role="alert">
              {error('kind')}
            </p>
          </div>
        )}
      />
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Name</span>
        <Input
          autoComplete="off"
          placeholder={
            kind === 'Money lent'
              ? 'e.g. Money lent to Rahim…'
              : `e.g. ${kind}…`
          }
          {...form.register('name')}
        />
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error('name')}
        </p>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Opening value</span>
        <Input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          autoComplete="off"
          {...form.register('openingValue', { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error('openingValue')}
        </p>
      </label>
      <Controller
        control={form.control}
        name="openedOn"
        render={({ field }) => (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Opened on</p>
            <Calendar value={field.value} onChange={field.onChange} />
            <p className="mt-1 text-xs text-red-600" role="alert">
              {error('openedOn')}
            </p>
          </div>
        )}
      />
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">
          Details <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <Input
          autoComplete="off"
          placeholder={
            kind === 'Fixed deposit'
              ? 'e.g. Matures 15 Dec 2026…'
              : 'e.g. Location, borrower, or reminder…'
          }
          {...form.register('detail')}
        />
      </label>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add holding</Button>
      </div>
    </form>
  );
}
