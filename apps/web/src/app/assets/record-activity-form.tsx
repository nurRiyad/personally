'use client';

import {
  assetActivityDraftSchema,
  type AssetActivityDraft,
} from '@personally/validation';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';

const activityIntents = [
  {
    id: 'new-money',
    title: 'Add new money',
    description: 'Record money arriving from outside Assets into a holding.',
  },
  {
    id: 'move-money',
    title: 'Move money between assets',
    description:
      'Transfer money from one holding to another without creating new wealth.',
  },
  {
    id: 'emergency-use',
    title: 'Emergency or personal use',
    description:
      'Lend money to a friend or take money from a holding for personal use.',
  },
] as const;

type ActivityIntent = (typeof activityIntents)[number]['id'];

type RecordActivityFormProps = {
  assetNames: string[];
  onCancel: () => void;
  onRecord: (activity: AssetActivityDraft) => void;
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  ) : null;
}

function activityDescription(kind: AssetActivityDraft['kind']) {
  switch (kind) {
    case 'Income':
      return 'Record interest, crop income, or loan interest paid into an account.';
    case 'Transfer':
      return 'Move money between holdings without changing total assets.';
    case 'Contribution':
      return 'Put money into a deposit, DPS, or property.';
    case 'Lending':
      return 'Move money from an account into a borrower’s receivable balance.';
    case 'Repayment':
      return 'Record principal returned from a borrower to an account.';
    case 'External use':
      return 'Record money taken from a holding for a personal need.';
  }
}

export function RecordActivityForm({
  assetNames,
  onCancel,
  onRecord,
}: RecordActivityFormProps) {
  const form = useForm<AssetActivityDraft>({
    defaultValues: {
      kind: 'Income',
      source: assetNames[0] ?? '',
      destination: assetNames[1] ?? '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      note: '',
    },
  });
  const [kind, source, destination, amount, date, note] = form.watch([
    'kind',
    'source',
    'destination',
    'amount',
    'date',
    'note',
  ]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [intent, setIntent] = useState<ActivityIntent | null>(null);
  const lendingHolding =
    assetNames.find((name) => name.startsWith('Money lent')) ??
    assetNames[1] ??
    '';
  const destinationOptions =
    kind === 'External use' ? ['Personal use'] : assetNames;

  const chooseIntent = (nextIntent: ActivityIntent) => {
    setIntent(nextIntent);
    setIsReviewing(false);
    if (nextIntent === 'new-money') {
      form.reset({
        kind: 'Income',
        source: 'Outside Assets',
        destination: assetNames[0] ?? '',
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        note: '',
      });
      return;
    }
    if (nextIntent === 'move-money') {
      form.reset({
        kind: 'Transfer',
        source: assetNames[0] ?? '',
        destination: assetNames[1] ?? '',
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        note: '',
      });
      return;
    }
    form.reset({
      kind: 'Lending',
      source: assetNames[0] ?? '',
      destination: lendingHolding,
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      note: '',
    });
  };

  const review = (values: AssetActivityDraft) => {
    const parsed = assetActivityDraftSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field && field in values) {
          form.setError(field as keyof AssetActivityDraft, {
            message: issue.message,
          });
        }
      }
      return;
    }
    form.clearErrors();
    setIsReviewing(true);
  };

  if (isReviewing) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-950">
            Review activity
          </p>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            {activityDescription(kind)}
          </p>
        </div>
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
          {[
            ['Type', kind],
            ['From', source],
            ['To', destination],
            ['Amount', `৳${new Intl.NumberFormat('en-BD').format(amount)}`],
            ['Date', date],
            ...(note ? [['Note', note]] : []),
          ].map(([label, value]) => (
            <div key={label} className="flex gap-4 py-3 text-sm">
              <dt className="w-20 shrink-0 font-medium text-slate-500">
                {label}
              </dt>
              <dd className="min-w-0 break-words font-medium text-slate-900">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsReviewing(false)}
          >
            Edit details
          </Button>
          <Button type="button" onClick={() => onRecord(form.getValues())}>
            Record activity
          </Button>
        </div>
      </div>
    );
  }

  if (!intent) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-6 text-slate-600">
          What would you like to record?
        </p>
        {activityIntents.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => chooseIntent(option.id)}
            className="w-full rounded-xl border border-slate-200 p-4 text-left transition-[border-color,background-color] hover:border-emerald-300 hover:bg-emerald-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <span className="block text-sm font-semibold text-slate-900">
              {option.title}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              {option.description}
            </span>
          </button>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="mt-2 w-full"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(review)} noValidate>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm leading-6 text-slate-600">
          Step 2 of 3: add the movement details.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="shrink-0 px-3"
          onClick={() => setIntent(null)}
        >
          Change type
        </Button>
      </div>
      {intent === 'emergency-use' && (
        <Controller
          control={form.control}
          name="kind"
          render={({ field }) => (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                What happened?
              </p>
              <Select
                label="Emergency action"
                value={field.value}
                options={['Lending', 'External use']}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue(
                    'destination',
                    value === 'External use' ? 'Personal use' : lendingHolding,
                  );
                }}
                className="w-full"
              />
            </div>
          )}
        />
      )}
      <p className="text-xs leading-5 text-slate-500">
        {activityDescription(kind)}
      </p>
      <div
        className={
          intent === 'new-money' ? 'space-y-5' : 'grid gap-5 sm:grid-cols-2'
        }
      >
        {intent !== 'new-money' && (
          <Controller
            control={form.control}
            name="source"
            render={({ field }) => (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Source holding
                </p>
                <Select
                  label="Source holding"
                  value={field.value}
                  options={assetNames}
                  onValueChange={field.onChange}
                  className="w-full"
                />
                <FieldError message={form.formState.errors.source?.message} />
              </div>
            )}
          />
        )}
        <Controller
          control={form.control}
          name="destination"
          render={({ field }) => (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                {kind === 'External use' ? 'Used for' : 'Destination holding'}
              </p>
              <Select
                label={
                  kind === 'External use' ? 'Used for' : 'Destination holding'
                }
                value={field.value}
                options={destinationOptions}
                onValueChange={field.onChange}
                className="w-full"
              />
              <FieldError
                message={form.formState.errors.destination?.message}
              />
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
          autoComplete="off"
          aria-invalid={Boolean(form.formState.errors.amount)}
          aria-describedby="activity-amount-error"
          {...form.register('amount', { valueAsNumber: true })}
        />
        <span id="activity-amount-error">
          <FieldError message={form.formState.errors.amount?.message} />
        </span>
      </label>
      <Controller
        control={form.control}
        name="date"
        render={({ field }) => (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Activity date
            </p>
            <Calendar
              value={field.value}
              onChange={field.onChange}
              aria-invalid={Boolean(form.formState.errors.date)}
            />
            <FieldError message={form.formState.errors.date?.message} />
          </div>
        )}
      />
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">
          Note <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <Textarea
          placeholder="e.g. September DPS instalment…"
          maxLength={2000}
          {...form.register('note')}
        />
        <FieldError message={form.formState.errors.note?.message} />
      </label>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Review activity</Button>
      </div>
    </form>
  );
}
