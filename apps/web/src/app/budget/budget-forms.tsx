'use client';

import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import {
  totalSpent,
  type BudgetGroup,
  type BudgetItem,
  type IncomeBlock,
} from './budget-data';

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  ) : null;
}

export function MonthlyNoteForm({
  note,
  onSubmit,
}: {
  note: string;
  onSubmit: (note: string) => void;
}) {
  const form = useForm({ defaultValues: { note } });
  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => onSubmit(values.note.trim()))}
    >
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Note</span>
        <Textarea
          placeholder="Add a note about this month…"
          {...form.register('note', {
            maxLength: {
              value: 2000,
              message: 'Keep the note under 2,000 characters.',
            },
          })}
        />
        <FieldError message={form.formState.errors.note?.message} />
      </label>
      <Button type="submit" className="w-full">
        Save note
      </Button>
    </form>
  );
}

export function CashInPocketForm({
  cashInPocket,
  onSubmit,
}: {
  cashInPocket: number;
  onSubmit: (amount: number) => void;
}) {
  const form = useForm({ defaultValues: { amount: String(cashInPocket) } });
  return (
    <form
      className="mt-5 flex gap-2"
      onSubmit={form.handleSubmit((values) => onSubmit(Number(values.amount)))}
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">Cash in pocket</span>
        <Input
          inputMode="numeric"
          placeholder="0"
          aria-label="Cash in pocket"
          {...form.register('amount', {
            required: 'Enter the cash amount.',
            min: { value: 0, message: 'Amount cannot be negative.' },
            max: { value: 999999999, message: 'Amount is too large.' },
            validate: (value) =>
              Number.isInteger(Number(value)) || 'Enter a whole taka amount.',
          })}
        />
        <FieldError message={form.formState.errors.amount?.message} />
      </label>
      <Button type="submit" variant="secondary" className="shrink-0">
        Save
      </Button>
    </form>
  );
}

export function IncomeForm({
  block,
  onSubmit,
}: {
  block?: IncomeBlock;
  onSubmit: (value: {
    amount: number;
    blockId: string;
    date: string;
    note?: string;
  }) => void;
}) {
  const remainingIncome = block
    ? Math.max(
        0,
        block.planned -
          block.income.reduce((total, entry) => total + entry.amount, 0),
      )
    : 0;
  const form = useForm({
    defaultValues: {
      amount: remainingIncome ? String(remainingIncome) : '',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    },
  });
  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({
          ...values,
          amount: Number(values.amount),
          blockId: block?.id ?? '',
        }),
      )}
    >
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Amount received</span>
        <Input
          inputMode="decimal"
          placeholder="0"
          {...form.register('amount', {
            required: 'Enter an amount',
            min: { value: 1, message: 'Amount must be greater than zero' },
          })}
        />
        <FieldError message={form.formState.errors.amount?.message} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Date received</span>
        <Calendar
          value={form.watch('date')}
          onChange={(value) => form.setValue('date', value)}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">
          Note <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <Textarea
          placeholder="e.g. Client A invoice…"
          {...form.register('note')}
        />
      </label>
      <Button type="submit" className="w-full">
        Save income
      </Button>
    </form>
  );
}

export function NewIncomeBlockForm({
  onSubmit,
}: {
  onSubmit: (value: {
    name: string;
    planned: number;
    recurring: boolean;
  }) => void;
}) {
  const form = useForm({
    defaultValues: { name: '', planned: '', recurring: false },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({
          name: values.name.trim(),
          planned: Number(values.planned),
          recurring: values.recurring,
        }),
      )}
    >
      <label className="block text-sm font-medium text-slate-700">
        Income source
        <Input
          placeholder="e.g. Consulting…"
          {...form.register('name', { required: 'Enter an income source' })}
        />
      </label>
      <FieldError message={form.formState.errors.name?.message} />
      <label className="block text-sm font-medium text-slate-700">
        Expected this month
        <Input
          inputMode="decimal"
          placeholder="0"
          {...form.register('planned', {
            required: 'Enter an expected amount',
            min: { value: 0, message: 'Amount cannot be negative' },
          })}
        />
      </label>
      <FieldError message={form.formState.errors.planned?.message} />
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          className="size-4 rounded border-slate-300"
          {...form.register('recurring')}
        />
        Recurring income
      </label>
      <Button type="submit" className="w-full">
        Add income block
      </Button>
    </form>
  );
}

export function EditIncomeBlockForm({
  block,
  onSubmit,
}: {
  block: IncomeBlock;
  onSubmit: (value: {
    name: string;
    planned: number;
    recurring: boolean;
  }) => void;
}) {
  const form = useForm({
    defaultValues: {
      name: block.name,
      planned: String(block.planned),
      recurring: block.recurring,
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({
          name: values.name.trim(),
          planned: Number(values.planned),
          recurring: values.recurring,
        }),
      )}
    >
      <label className="block text-sm font-medium text-slate-700">
        Income source
        <Input
          {...form.register('name', { required: 'Enter an income source' })}
        />
      </label>
      <FieldError message={form.formState.errors.name?.message} />
      <label className="block text-sm font-medium text-slate-700">
        Expected this month
        <Input
          inputMode="decimal"
          {...form.register('planned', {
            required: 'Enter an expected amount',
            min: { value: 0, message: 'Amount cannot be negative' },
          })}
        />
      </label>
      <FieldError message={form.formState.errors.planned?.message} />
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          className="size-4 rounded border-slate-300"
          {...form.register('recurring')}
        />
        Recurring income
      </label>
      <Button type="submit" className="w-full">
        Save changes
      </Button>
    </form>
  );
}

export function ExpenseForm({
  item,
  onSubmit,
}: {
  item?: BudgetItem;
  onSubmit: (value: {
    amount: number;
    category: string;
    date: string;
    note?: string;
  }) => void;
}) {
  const remainingSpend = item
    ? Math.max(0, item.planned - totalSpent(item))
    : 0;
  const form = useForm({
    defaultValues: {
      amount: remainingSpend ? String(remainingSpend) : '',
      category: item?.name ?? '',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    },
  });
  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => {
        const amount = Number(values.amount);
        if (!Number.isInteger(amount) || amount <= 0) {
          form.setError('amount', {
            message: 'Amount must be a whole number greater than zero',
          });
          return;
        }
        onSubmit({ ...values, amount });
      })}
    >
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Amount</span>
        <Input
          type="number"
          min="1"
          step="1"
          inputMode="decimal"
          placeholder="0"
          {...form.register('amount', {
            required: 'Enter an amount',
            min: { value: 1, message: 'Amount must be greater than zero' },
          })}
        />{' '}
        <FieldError message={form.formState.errors.amount?.message} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Category</span>
        <Select
          label="Category"
          className="w-full"
          value={form.watch('category')}
          options={
            item
              ? [item.name]
              : [
                  'Food',
                  'Shopping',
                  'Eating out',
                  'Pocket money',
                  'Family support',
                ]
          }
          onValueChange={(value: string) =>
            form.setValue('category', value, { shouldDirty: true })
          }
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Date</span>
        <Calendar
          value={form.watch('date')}
          onChange={(value) => form.setValue('date', value)}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">
          Note <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <Textarea
          placeholder="What was this for?…"
          {...form.register('note')}
        />
      </label>
      <Button type="submit" className="w-full">
        Save expense
      </Button>
    </form>
  );
}

export function BudgetItemForm({
  item,
  onSubmit,
}: {
  item: BudgetItem;
  onSubmit: (value: {
    name: string;
    planned: number;
    recurring: boolean;
  }) => void;
}) {
  const form = useForm({
    defaultValues: {
      name: item.name,
      planned: String(item.planned),
      recurring: item.recurring,
    },
  });
  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({
          ...values,
          planned: Number(values.planned),
          recurring: values.recurring,
        }),
      )}
    >
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Item name</span>
        <Input {...form.register('name', { required: 'Enter a name' })} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Planned amount</span>
        <Input
          inputMode="decimal"
          {...form.register('planned', { required: true, min: 0 })}
        />
      </label>
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          className="size-4 rounded border-slate-300"
          {...form.register('recurring')}
        />{' '}
        Recurring item
      </label>
      <Button type="submit" className="w-full">
        Save changes
      </Button>
    </form>
  );
}

export function NewGroupForm({
  onSubmit,
}: {
  onSubmit: (name: string) => void;
}) {
  const form = useForm({ defaultValues: { name: '' } });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => onSubmit(values.name.trim()))}
    >
      <label className="block text-sm font-medium text-slate-700">
        Block name
        <Input
          placeholder="e.g. Travel…"
          {...form.register('name', { required: 'Enter a block name' })}
        />
      </label>
      <FieldError message={form.formState.errors.name?.message} />
      <Button type="submit" className="w-full">
        Add block
      </Button>
    </form>
  );
}

export function NewBudgetItemForm({
  group,
  onSubmit,
}: {
  group: BudgetGroup;
  onSubmit: (value: {
    name: string;
    planned: number;
    group: BudgetGroup;
    recurring: boolean;
    note: string;
  }) => void;
}) {
  const form = useForm({
    defaultValues: { name: '', planned: '', recurring: false, note: '' },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({ ...values, planned: Number(values.planned), group }),
      )}
    >
      <label className="block text-sm font-medium text-slate-700">
        Item name
        <Input
          placeholder="e.g. Transport…"
          {...form.register('name', { required: 'Enter an item name' })}
        />
      </label>
      <FieldError message={form.formState.errors.name?.message} />
      <label className="block text-sm font-medium text-slate-700">
        Planned amount
        <Input
          inputMode="decimal"
          placeholder="0"
          {...form.register('planned', {
            required: 'Enter a planned amount',
            min: { value: 0, message: 'Amount cannot be negative' },
          })}
        />
      </label>
      <FieldError message={form.formState.errors.planned?.message} />
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          className="size-4 rounded border-slate-300"
          {...form.register('recurring')}
        />{' '}
        Recurring item
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Note <span className="font-normal text-slate-400">(optional)</span>
        <Textarea {...form.register('note')} />
      </label>
      <Button type="submit" className="w-full">
        Add item
      </Button>
    </form>
  );
}
