'use client';

import {
  assetActivityDraftSchema,
  type AssetActivityDraft,
} from '@personally/validation';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';

export function EditActivityForm({
  activity,
  assetNames,
  onCancel,
  onSave,
}: {
  activity: AssetActivityDraft;
  assetNames: string[];
  onCancel: () => void;
  onSave: (activity: AssetActivityDraft) => void;
}) {
  const form = useForm<AssetActivityDraft>({ defaultValues: activity });
  const error = (name: keyof AssetActivityDraft) =>
    form.formState.errors[name]?.message;
  const options = [
    ...new Set([...assetNames, 'Outside Assets', 'Personal use']),
  ];

  const submit = (values: AssetActivityDraft) => {
    const parsed = assetActivityDraftSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) =>
        form.setError(issue.path[0] as keyof AssetActivityDraft, {
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
              Activity type
            </p>
            <Select
              label="Activity type"
              value={field.value}
              options={[
                'Income',
                'Transfer',
                'Contribution',
                'Lending',
                'Repayment',
                'External use',
              ]}
              onValueChange={field.onChange}
              className="w-full"
            />
            <p className="mt-1 text-xs text-red-600" role="alert">
              {error('kind')}
            </p>
          </div>
        )}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="source"
          render={({ field }) => (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Source</p>
              <Select
                label="Source"
                value={field.value}
                options={options}
                onValueChange={field.onChange}
                className="w-full"
              />
              <p className="mt-1 text-xs text-red-600" role="alert">
                {error('source')}
              </p>
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="destination"
          render={({ field }) => (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Destination
              </p>
              <Select
                label="Destination"
                value={field.value}
                options={options}
                onValueChange={field.onChange}
                className="w-full"
              />
              <p className="mt-1 text-xs text-red-600" role="alert">
                {error('destination')}
              </p>
            </div>
          )}
        />
      </div>
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
        name="date"
        render={({ field }) => (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Date</p>
            <Calendar value={field.value} onChange={field.onChange} />
            <p className="mt-1 text-xs text-red-600" role="alert">
              {error('date')}
            </p>
          </div>
        )}
      />
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">
          Note <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <Textarea {...form.register('note')} />
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error('note')}
        </p>
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
