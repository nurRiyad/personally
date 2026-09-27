'use client';

import { assetActivityInputSchema, type AssetActivityInput } from '@personally/validation';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import type { AssetActivity, AssetRecord, AssetActivityEndpoint } from '../../lib/api/assets';

const kinds = [
  'Opening',
  'Income',
  'Growth',
  'Transfer',
  'Contribution',
  'Lending',
  'Repayment',
  'External use',
] as const;
type ActivityKind = (typeof kinds)[number];
type FormValues = {
  kind: ActivityKind;
  sourceKey: string;
  destinationKey: string;
  amount: number;
  activityDate: string;
  note?: string;
};
const keyOf = (endpoint: AssetActivityEndpoint) =>
  'assetId' in endpoint ? `asset:${endpoint.assetId}` : `endpoint:${endpoint.endpoint}`;
const endpointOf = (key: string): AssetActivityEndpoint =>
  key.startsWith('asset:')
    ? { assetId: key.slice(6) }
    : {
        endpoint: key.slice(9) as 'outside' | 'growth_return' | 'personal_use',
      };

export function AssetActivityForm({
  assets,
  activity,
  onCancel,
  onSave,
}: {
  assets: AssetRecord[];
  activity?: AssetActivity;
  onCancel: () => void;
  onSave: (input: AssetActivityInput) => void;
}) {
  const active = assets.filter((asset) => !asset.archivedAt);
  const initial: FormValues = activity
    ? {
        kind: activity.kind,
        sourceKey: keyOf(activity.source),
        destinationKey: keyOf(activity.destination),
        amount: activity.amount,
        activityDate: activity.activityDate,
        note: activity.note ?? '',
      }
    : {
        kind: 'Income',
        sourceKey: 'endpoint:outside',
        destinationKey: active[0] ? `asset:${active[0].id}` : '',
        amount: 0,
        activityDate: new Date().toISOString().slice(0, 10),
        note: '',
      };
  const form = useForm<FormValues>({ defaultValues: initial });
  const kind = form.watch('kind');
  const receivables = active.filter((asset) => asset.isReceivable);
  const sourceAssets = kind === 'Repayment' ? receivables : active.filter((asset) => !asset.isReceivable);
  const destinationAssets = kind === 'Lending' ? receivables : active.filter((asset) => !asset.isReceivable);
  const sourceOptions =
    kind === 'Income'
      ? [{ value: 'endpoint:outside', label: 'Outside Assets' }]
      : kind === 'Growth'
        ? [{ value: 'endpoint:growth_return', label: 'Growth or return' }]
        : sourceAssets.map((asset) => ({
            value: `asset:${asset.id}`,
            label: asset.name,
          }));
  const destinationOptions =
    kind === 'External use'
      ? [{ value: 'endpoint:personal_use', label: 'Personal use' }]
      : destinationAssets.map((asset) => ({
          value: `asset:${asset.id}`,
          label: asset.name,
        }));
  const switchKind = (next: ActivityKind) => {
    form.setValue('kind', next);
    const nextSource =
      next === 'Income'
        ? 'endpoint:outside'
        : next === 'Growth'
          ? 'endpoint:growth_return'
          : next === 'Repayment'
            ? receivables[0]
              ? `asset:${receivables[0].id}`
              : ''
            : active.find((asset) => !asset.isReceivable)?.id
              ? `asset:${active.find((asset) => !asset.isReceivable)!.id}`
              : '';
    const nextDestination =
      next === 'External use'
        ? 'endpoint:personal_use'
        : next === 'Lending'
          ? receivables[0]
            ? `asset:${receivables[0].id}`
            : ''
          : active.find((asset) => !asset.isReceivable)?.id
            ? `asset:${active.find((asset) => !asset.isReceivable)!.id}`
            : '';
    form.setValue('sourceKey', nextSource);
    form.setValue('destinationKey', nextDestination);
  };
  const submit = (values: FormValues) => {
    const result = assetActivityInputSchema.safeParse({
      kind: values.kind,
      source: endpointOf(values.sourceKey),
      destination: endpointOf(values.destinationKey),
      amount: values.amount,
      activityDate: values.activityDate,
      note: values.note,
    });
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field =
          issue.path[0] === 'source' ? 'sourceKey' : issue.path[0] === 'destination' ? 'destinationKey' : issue.path[0];
        if (field && field in values) form.setError(field as keyof FormValues, { message: issue.message });
      }
      return;
    }
    onSave(result.data);
  };
  const error = (field: keyof FormValues) => form.formState.errors[field]?.message;
  const needsReceivable = kind === 'Lending' || kind === 'Repayment';
  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <Controller
        control={form.control}
        name="kind"
        render={({ field }) => (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Activity type</p>
            <Select
              label="Activity type"
              value={field.value}
              options={activity?.kind === 'Opening' ? ['Opening'] : kinds.filter((item) => item !== 'Opening')}
              onValueChange={(value) => switchKind(value as ActivityKind)}
              className="w-full"
            />
          </div>
        )}
      />
      {needsReceivable && receivables.length === 0 && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Create a holding and mark “Money is owed to me” before recording a loan or repayment.
        </p>
      )}
      <p className="text-sm text-slate-500">
        {kind === 'Opening'
          ? 'Update the opening amount, date, or note. Its asset stays the same.'
          : kind === 'Income'
            ? 'Record money arriving from outside Assets.'
            : kind === 'Growth'
              ? 'Record interest, profit, or an increase in value.'
              : kind === 'Transfer' || kind === 'Contribution'
                ? 'Move value between your holdings.'
                : kind === 'Lending'
                  ? 'Move money into a receivable holding.'
                  : kind === 'Repayment'
                    ? 'Move a repayment out of a receivable holding.'
                    : 'Record money used outside your assets.'}
      </p>
      {kind === 'Opening' && activity ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Opening balance for {activity.destinationName}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="sourceKey"
            render={({ field }) => (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Source</p>
                <Select
                  label="Source"
                  value={field.value}
                  options={[]}
                  items={sourceOptions}
                  onValueChange={field.onChange}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {error('sourceKey')}
                </p>
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="destinationKey"
            render={({ field }) => (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Destination</p>
                <Select
                  label="Destination"
                  value={field.value}
                  options={[]}
                  items={destinationOptions}
                  onValueChange={field.onChange}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {error('destinationKey')}
                </p>
              </div>
            )}
          />
        </div>
      )}
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Amount</span>
        <Input
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          {...form.register('amount', { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error('amount')}
        </p>
      </label>
      <Controller
        control={form.control}
        name="activityDate"
        render={({ field }) => (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Activity date</p>
            <Calendar value={field.value} onChange={field.onChange} />
            <p className="mt-1 text-xs text-red-600" role="alert">
              {error('activityDate')}
            </p>
          </div>
        )}
      />
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Note (optional)</span>
        <Textarea maxLength={2000} {...form.register('note')} />
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error('note')}
        </p>
      </label>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={needsReceivable && !receivables.length}>
          Save activity
        </Button>
      </div>
    </form>
  );
}
