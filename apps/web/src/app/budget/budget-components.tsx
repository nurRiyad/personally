import type { ReactNode } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
  currency,
  percentage,
  totalSpent,
  type BudgetItem,
  type BudgetMonth,
} from './budget-data';

function Progress({
  value,
  tone = 'emerald',
}: {
  value: number;
  tone?: 'emerald' | 'amber';
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${tone === 'amber' ? 'bg-amber-400' : 'bg-emerald-500'}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function CircularProgress({ value }: { value: number }) {
  return (
    <div
      className="relative flex size-[68px] shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#10b981 ${value}%, #e2e8f0 ${value}% 100%)`,
      }}
      role="img"
      aria-label={`${value}% of budget spent`}
    >
      <div className="flex size-[52px] items-center justify-center rounded-full bg-white">
        <span className="text-base font-semibold leading-none text-slate-950">
          {value}%
        </span>
      </div>
    </div>
  );
}

export function SummaryCard({
  icon,
  label,
  plannedAmount,
  actualAmount,
  detail,
}: {
  icon: ReactNode;
  label: string;
  plannedAmount: number;
  actualAmount: number;
  detail: string;
}) {
  return (
    <Card className="p-5 text-slate-950 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span
          className="rounded-xl bg-slate-100 p-2 text-slate-600 ring-1 ring-slate-200"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Planned
          </p>
          <p className="mt-1 whitespace-nowrap text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
            {currency(plannedAmount)}
          </p>
        </div>
        <div className="min-w-0 border-l border-slate-200 pl-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Actual
          </p>
          <p className="mt-1 whitespace-nowrap text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
            {currency(actualAmount)}
          </p>
        </div>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {detail}
      </p>
    </Card>
  );
}

export function BudgetRow({
  item,
  onEdit,
  onExpense,
  onActivity,
}: {
  item: BudgetItem;
  onEdit: () => void;
  onExpense: () => void;
  onActivity: () => void;
}) {
  const spent = totalSpent(item);
  const remaining = item.planned - spent;
  return (
    <div className="border-t border-slate-100 px-5 py-4 transition-colors hover:bg-slate-50 first:border-t-0 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          aria-label={`Open ${item.name} expense activity`}
          className="grid min-w-0 flex-1 cursor-pointer grid-cols-1 gap-4 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:grid-cols-[210px_minmax(0,1fr)] sm:items-center"
          onClick={onActivity}
        >
          <div className="min-w-0 sm:shrink-0">
            <div className="flex min-w-0 items-center gap-2">
              <p
                className="max-w-[150px] truncate font-medium text-slate-900"
                title={item.name}
              >
                {item.name}
              </p>
              {item.recurring && (
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  Recurring
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {item.expenses.length}{' '}
              {item.expenses.length === 1 ? 'expense' : 'expenses'}
            </p>
            <div className="mt-3 max-w-[175px]">
              <Progress
                value={percentage(spent, item.planned)}
                tone={remaining < 0 ? 'amber' : 'emerald'}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-right text-sm sm:min-w-0 sm:gap-4">
            <Metric label="Planned" value={currency(item.planned)} />
            <Metric label="Spent" value={currency(spent)} />
            <Metric
              label="Remaining"
              value={currency(remaining)}
              tone={remaining < 0 ? 'amber' : 'green'}
            />
          </div>
        </button>
        <div className="flex gap-2 sm:ml-2">
          <Button
            variant="ghost"
            className="min-h-9 cursor-pointer px-3"
            aria-label={`Edit ${item.name}`}
            onClick={onEdit}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="secondary"
            className="min-h-9 cursor-pointer px-3"
            onClick={onExpense}
          >
            <Plus className="size-4" aria-hidden="true" /> Expense
          </Button>
        </div>
      </div>
    </div>
  );
}

export function IncomeRow({
  block,
  onIncome,
  onEdit,
  onActivity,
}: {
  block: BudgetMonth['incomeBlocks'][number];
  onIncome: () => void;
  onEdit: () => void;
  onActivity: () => void;
}) {
  const received = block.income.reduce(
    (total, entry) => total + entry.amount,
    0,
  );
  const remaining = block.planned - received;
  return (
    <div className="border-t border-slate-100 px-5 py-4 transition-colors hover:bg-slate-50 first:border-t-0 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          aria-label={`Open ${block.name} income activity`}
          className="grid min-w-0 flex-1 cursor-pointer grid-cols-1 gap-4 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:grid-cols-[210px_minmax(0,1fr)] sm:items-center"
          onClick={onActivity}
        >
          <div className="min-w-0 sm:shrink-0">
            <div className="flex min-w-0 items-center gap-2">
              <p
                className="max-w-[150px] truncate font-medium text-slate-900"
                title={block.name}
              >
                {block.name}
              </p>
              {block.recurring && (
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  Recurring
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {block.income.length}{' '}
              {block.income.length === 1 ? 'income' : 'incomes'}
            </p>
            <div className="mt-3 max-w-[175px]">
              <Progress
                value={percentage(received, block.planned)}
                tone={remaining < 0 ? 'amber' : 'emerald'}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-right text-sm sm:min-w-0 sm:gap-4">
            <Metric label="Planned" value={currency(block.planned)} />
            <Metric label="Earned" value={currency(received)} />
            <Metric
              label="Remaining"
              value={currency(remaining)}
              tone={remaining < 0 ? 'amber' : 'green'}
            />
          </div>
        </button>
        <div className="flex gap-2 sm:ml-2">
          <Button
            variant="ghost"
            className="min-h-9 cursor-pointer px-3"
            aria-label={`Edit ${block.name}`}
            onClick={onEdit}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="secondary"
            className="min-h-9 cursor-pointer px-3"
            onClick={onIncome}
          >
            <Plus className="size-4" aria-hidden="true" /> Income
          </Button>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'amber' | 'green';
}) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={`mt-1 font-semibold ${tone === 'amber' ? 'text-amber-700' : tone === 'green' ? 'text-emerald-700' : 'text-slate-700'}`}
      >
        {value}
      </p>
    </div>
  );
}
