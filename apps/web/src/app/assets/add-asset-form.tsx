'use client';

import {
  assetCreateSchema,
  type AssetCreateInput,
} from '@personally/validation';
import { Controller, useForm } from 'react-hook-form';
import type { AssetType } from '../../lib/api/assets';
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
  onAdd: (asset: AssetCreateInput) => void;
  assetTypes: AssetType[];
}) {
  const form = useForm<AssetCreateInput>({
    defaultValues: {
      typeId: assetTypes[0]?.id ?? '',
      name: '',
      openingValue: 0,
      openedOn: new Date().toISOString().slice(0, 10),
      detail: '',
      isLiquid: false,
      isReceivable: false,
    },
  });
  const error = (name: keyof AssetCreateInput) =>
    form.formState.errors[name]?.message;
  const submit = (values: AssetCreateInput) => {
    const parsed = assetCreateSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) =>
        form.setError(issue.path[0] as keyof AssetCreateInput, {
          message: issue.message,
        }),
      );
      return;
    }
    onAdd(parsed.data);
  };
  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <p className="text-sm text-slate-600">
        A positive opening balance is saved as an activity in the ledger.
      </p>
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
              value={field.value}
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
        <span className="mb-2 block">Opening balance</span>
        <Input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
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
        <span className="mb-2 block">Details (optional)</span>
        <Input autoComplete="off" {...form.register('detail')} />
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
            Include its balance in your liquid money total.
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
            Track this holding as money lent and allow repayments against it.
          </span>
        </span>
      </label>
      {error('isReceivable') && (
        <p className="text-xs text-red-600" role="alert">
          {error('isReceivable')}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!assetTypes.length}>
          Add holding
        </Button>
      </div>
    </form>
  );
}
