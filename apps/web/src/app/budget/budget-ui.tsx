'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getBudget,
  createBudget,
  budgetDelete,
  budgetPatch,
  budgetRequest,
} from '../../lib/api/budget';
import type { BudgetMonth as ApiBudgetMonth } from '@personally/validation';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog } from '../../components/ui/dialog';
import { Select } from '../../components/ui/select';
import {
  BudgetItemForm,
  EditIncomeBlockForm,
  ExpenseForm,
  IncomeForm,
  MonthlyNoteForm,
  NewBudgetItemForm,
  NewGroupForm,
  NewIncomeBlockForm,
} from './budget-forms';
import {
  currency,
  monthLabel,
  percentage,
  totalSpent,
  totalSpentForMonth,
  totalIncome,
  totalPlanned,
  type BudgetGroup,
  type BudgetItem,
  type BudgetMonth,
} from './budget-data';

const fromApi = (value: ApiBudgetMonth): BudgetMonth => ({
  key: value.month,
  note: value.note ?? '',
  shopping: [],
  incomeBlocks: value.incomeSources.map((source) => ({
    id: source.id,
    name: source.name,
    planned: source.plannedAmount,
    recurring: source.isRecurring,
    income: source.income.map((entry) => ({
      id: entry.id,
      amount: entry.amount,
      date: entry.receivedOn,
      note: entry.note ?? undefined,
    })),
  })),
  items: value.groups.flatMap((group) =>
    group.items.map((item) => ({
      id: item.id,
      name: item.name,
      group: group.name,
      planned: item.plannedAmount,
      recurring: item.isRecurring,
      expenses: item.expenses.map((expense) => ({
        id: expense.id,
        amount: expense.amount,
        date: expense.spentOn,
        note: expense.note ?? undefined,
      })),
    })),
  ),
});

const monthKey = (offset: number) => {
  const date = new Date(2026, 8 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

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

function CircularProgress({ value }: { value: number }) {
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

function SummaryCard({
  label,
  amount,
  detail,
  tone,
}: {
  label: string;
  amount: string;
  detail: string;
  tone?: 'green' | 'amber';
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {amount}
      </p>
      <p
        className={`mt-2 text-xs ${tone === 'amber' ? 'text-amber-700' : tone === 'green' ? 'text-emerald-700' : 'text-slate-500'}`}
      >
        {detail}
      </p>
    </Card>
  );
}

function BudgetRow({
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
  const activate = () => onActivity();
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.name} expense activity`}
      className="group cursor-pointer border-t border-slate-100 px-5 py-4 outline-none transition-colors first:border-t-0 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 sm:px-6"
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 sm:w-[210px] sm:shrink-0">
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
        <div className="grid flex-1 grid-cols-3 gap-3 text-right text-sm sm:min-w-0 sm:gap-4">
          <div>
            <p className="text-xs text-slate-400">Planned</p>
            <p className="mt-1 font-medium text-slate-700">
              {currency(item.planned)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Spent</p>
            <p className="mt-1 font-medium text-slate-700">{currency(spent)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Remaining</p>
            <p
              className={`mt-1 font-semibold ${remaining < 0 ? 'text-amber-700' : 'text-emerald-700'}`}
            >
              {currency(remaining)}
            </p>
          </div>
        </div>
        <div
          className="flex gap-2 sm:ml-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Button
            variant="ghost"
            className="min-h-9 px-3"
            aria-label={`Edit ${item.name}`}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="secondary"
            className="min-h-9 px-3"
            onClick={onExpense}
          >
            <Plus className="size-4" /> Expense
          </Button>
        </div>
      </div>
    </div>
  );
}

function IncomeRow({
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
  const activate = () => onActivity();
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${block.name} income activity`}
      className="group cursor-pointer border-t border-slate-100 px-5 py-4 outline-none transition-colors first:border-t-0 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 sm:px-6"
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 sm:w-[210px] sm:shrink-0">
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
        <div className="grid flex-1 grid-cols-3 gap-3 text-right text-sm sm:min-w-0 sm:gap-4">
          <div>
            <p className="text-xs text-slate-400">Planned</p>
            <p className="mt-1 font-medium text-slate-700">
              {currency(block.planned)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Earned</p>
            <p className="mt-1 font-medium text-slate-700">
              {currency(received)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Remaining</p>
            <p
              className={`mt-1 font-semibold ${remaining < 0 ? 'text-amber-700' : 'text-emerald-700'}`}
            >
              {currency(remaining)}
            </p>
          </div>
        </div>
        <div
          className="flex gap-2 sm:ml-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Button
            variant="ghost"
            className="min-h-9 px-3"
            aria-label={`Edit ${block.name}`}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="secondary"
            className="min-h-9 px-3"
            onClick={onIncome}
          >
            <Plus className="size-4" /> Income
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BudgetWorkspace() {
  const [months, setMonths] = useState<Record<string, BudgetMonth>>({});
  const [selectedKey, setSelectedKey] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [version, setVersion] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dialog, setDialog] = useState<
    | 'expense'
    | 'income'
    | 'income-block'
    | 'income-edit'
    | 'income-delete'
    | 'income-entry-delete'
    | 'expense-delete'
    | 'group-delete'
    | 'item-delete'
    | 'edit'
    | 'copy'
    | 'group'
    | 'item'
    | 'activity'
    | 'note-edit'
    | null
  >(null);
  const [activeItemId, setActiveItemId] = useState<string>();
  const [activeIncomeBlockId, setActiveIncomeBlockId] = useState<string>();
  const [activeIncomeEntryId, setActiveIncomeEntryId] = useState<string>();
  const [activeExpenseId, setActiveExpenseId] = useState<string>();
  const [activeGroup, setActiveGroup] = useState<BudgetGroup>();
  const [groups, setGroups] = useState<BudgetGroup[]>([]);
  const [collapsed, setCollapsed] = useState<Record<BudgetGroup, boolean>>({
    Essentials: false,
    'Family & personal': false,
    Savings: false,
    'Flexible spending': false,
  });
  const savedMonth = months[selectedKey];
  const month: BudgetMonth = savedMonth ?? {
    key: selectedKey,
    note: '',
    incomeBlocks: [],
    items: [],
    shopping: [],
  };
  const refresh = async (key = selectedKey) => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getBudget(key);
      const mapped = fromApi(data);
      setMonths((current) => ({ ...current, [key]: mapped }));
      setGroups(data.groups.map((group) => group.name));
      setVersion(data.version);
    } catch (error: any) {
      if (error?.status === 404)
        setMonths((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        });
      else setLoadError(error?.message ?? 'Unable to load this budget.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh(selectedKey);
  }, [selectedKey]);
  const selectedItem = month.items.find((item) => item.id === activeItemId);
  const selectedIncomeBlock = month.incomeBlocks.find(
    (block) => block.id === activeIncomeBlockId,
  );
  const planned = totalPlanned(month);
  const spent = totalSpentForMonth(month);
  const income = totalIncome(month);
  const remaining = income - spent;
  const grouped = useMemo(
    () =>
      Object.fromEntries(
        groups.map((group) => [
          group,
          month.items.filter((item) => item.group === group),
        ]),
      ) as Record<BudgetGroup, BudgetItem[]>,
    [month],
  );
  const recentActivity = useMemo(
    () =>
      month.items
        .flatMap((item) =>
          item.expenses.map((expense) => ({
            ...expense,
            itemName: item.name,
            group: item.group,
          })),
        )
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10),
    [month],
  );
  const openExpense = (item?: BudgetItem) => {
    setActiveIncomeBlockId(undefined);
    setActiveItemId(item?.id);
    setDialog('expense');
  };
  const openIncome = (blockId: string) => {
    setActiveItemId(undefined);
    setActiveIncomeBlockId(blockId);
    setDialog('income');
  };
  const updateMonth = (_next: BudgetMonth) => void refresh();
  const moveMonth = (offset: number) => {
    const next = monthKey(Number(selectedKey.slice(5)) - 9 + offset);
    setSelectedKey(next);
  };
  const addExpense = (values: {
    amount: number;
    category: string;
    date: string;
    note?: string;
  }) => {
    const item =
      month.items.find(
        (entry) => entry.id === activeItemId || entry.name === values.category,
      ) ?? month.items.find((entry) => entry.name === 'Food')!;
    void budgetRequest(`/budget/items/${item.id}/expenses`, {
      amount: values.amount,
      spentOn: values.date,
      note: values.note || null,
      monthVersion: version,
    })
      .then(async () => {
        setDialog(null);
        await refresh();
      })
      .catch((error) =>
        setLoadError(error?.message ?? 'Unable to save expense.'),
      );
  };
  const addIncome = (values: {
    amount: number;
    blockId: string;
    date: string;
    note?: string;
  }) => {
    void budgetRequest(`/budget/income-sources/${values.blockId}/income`, {
      amount: values.amount,
      receivedOn: values.date,
      note: values.note || null,
      monthVersion: version,
    }).then(async () => {
      setDialog(null);
      await refresh();
    });
  };
  const addIncomeBlock = (values: {
    name: string;
    planned: number;
    recurring: boolean;
  }) => {
    void budgetRequest(`/budget/months/${selectedKey}/income-sources`, {
      name: values.name,
      plannedAmount: values.planned,
      isRecurring: values.recurring,
      monthVersion: version,
    }).then(async () => {
      setDialog(null);
      await refresh();
    });
  };
  const editItem = (values: {
    name: string;
    planned: number;
    group: BudgetGroup;
    recurring: boolean;
  }) => {
    if (!activeItemId) return;
    const groupId = undefined;
    void budgetPatch(`/budget/items/${activeItemId}`, {
      name: values.name,
      plannedAmount: values.planned,
      isRecurring: values.recurring,
      monthVersion: version,
      ...(groupId ? { groupId } : {}),
    }).then(async () => {
      setDialog(null);
      await refresh();
    });
  };
  const addGroup = (name: string) => {
    void budgetRequest(`/budget/months/${selectedKey}/groups`, {
      name,
      monthVersion: version,
    }).then(async () => {
      setDialog(null);
      await refresh();
    });
  };
  const addItem = (values: {
    name: string;
    planned: number;
    group: BudgetGroup;
    recurring: boolean;
    note: string;
  }) => {
    void getBudget(selectedKey)
      .then((data) => {
        const groupId = data.groups.find((g) => g.name === values.group)?.id;
        if (!groupId) throw new Error('Group not found');
        return budgetRequest(`/budget/months/${selectedKey}/items`, {
          groupId,
          name: values.name,
          plannedAmount: values.planned,
          isRecurring: values.recurring,
          note: values.note || null,
          monthVersion: version,
        });
      })
      .then(async () => {
        setDialog(null);
        await refresh();
      });
  };
  const copyBudget = (all: boolean) => {
    const next = monthKey(Number(selectedKey.slice(5)) - 9 + 1);
    void budgetRequest(`/budget/months/${selectedKey}/copy`, {
      targetMonth: next,
      mode: all ? 'all' : 'recurring',
      monthVersion: version,
    })
      .then(() => {
        setDialog(null);
        setSelectedKey(next);
      })
      .catch((error) =>
        setLoadError(error?.message ?? 'Unable to copy this budget.'),
      );
  };
  if (loading && !savedMonth)
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 text-slate-600">
        Loading budget…
      </main>
    );
  if (!savedMonth)
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        <h1 className="text-3xl font-semibold">Budget</h1>
        <p className="mt-3 text-slate-600">
          No budget exists for {monthLabel(selectedKey)}.
        </p>
        <Button
          className="mt-5"
          onClick={async () => {
            await createBudget(selectedKey);
            await refresh();
          }}
        >
          Create month
        </Button>
        {loadError && <p className="mt-3 text-sm text-red-600">{loadError}</p>}
      </main>
    );
  return (
    <main className="page-transition mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:px-8 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Budget
        </h1>
        <div className="order-3 flex w-full items-center justify-center gap-1 sm:order-2 sm:w-auto">
          <Button
            variant="ghost"
            className="min-h-10 px-3"
            aria-label="Previous month"
            onClick={() => moveMonth(-1)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Select
            label="Month"
            className="min-w-[150px]"
            value={monthLabel(selectedKey)}
            options={Object.keys(months).map(monthLabel)}
            onValueChange={(value) =>
              setSelectedKey(
                Object.keys(months).find((key) => monthLabel(key) === value) ??
                  selectedKey,
              )
            }
          />
          <Button
            variant="ghost"
            className="min-h-10 px-3"
            aria-label="Next month"
            onClick={() => moveMonth(1)}
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="order-2 ml-auto flex flex-wrap justify-end gap-2 sm:order-3">
          <Button variant="secondary" onClick={() => setDialog('copy')}>
            <Copy className="size-4" /> Copy budget
          </Button>
          <Button onClick={() => openExpense()}>
            <Plus className="size-4" /> Add expense
          </Button>
        </div>
      </header>
      <section
        aria-label="Monthly summary"
        className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <SummaryCard
          label="Income"
          amount={currency(income)}
          detail={`${month.incomeBlocks.length} income sources`}
          tone="green"
        />
        <SummaryCard
          label="Planned"
          amount={currency(planned)}
          detail={`${month.items.length} budget items`}
        />
        <SummaryCard
          label="Spent"
          amount={currency(spent)}
          detail={`${percentage(spent, planned)}% of plan used`}
          tone={spent / planned > 0.85 ? 'amber' : undefined}
        />
        <SummaryCard
          label="Remaining"
          amount={currency(remaining)}
          detail="Available this month"
          tone={remaining >= 0 ? 'green' : 'amber'}
        />
      </section>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2
                  id="income-heading"
                  className="text-lg font-semibold text-slate-950"
                >
                  Income
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add sources and record what you received this month.
                </p>
              </div>
              <Button
                className="min-h-9 px-3"
                variant="secondary"
                onClick={() => setDialog('income-block')}
              >
                <Plus className="size-4" /> Add item
              </Button>
            </div>
            {month.incomeBlocks.map((block) => (
              <IncomeRow
                key={block.id}
                block={block}
                onIncome={() => openIncome(block.id)}
                onEdit={() => {
                  setActiveItemId(undefined);
                  setActiveIncomeBlockId(block.id);
                  setDialog('income-edit');
                }}
                onActivity={() => {
                  setActiveItemId(undefined);
                  setActiveIncomeBlockId(block.id);
                }}
              />
            ))}
          </Card>
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Your budget
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Plan on the left, review what happened on the right.
                </p>
              </div>
              <Button
                variant="secondary"
                className="min-h-9 px-3"
                onClick={() => setDialog('group')}
              >
                <Plus className="size-4" /> Add block
              </Button>
            </div>
            {groups.map((group) => {
              const items = grouped[group] ?? [];
              const groupPlanned = items.reduce(
                (sum, item) => sum + item.planned,
                0,
              );
              const groupSpent = items.reduce(
                (sum, item) => sum + totalSpent(item),
                0,
              );
              return (
                <div key={group}>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-6">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-4 text-left hover:text-slate-950"
                      onClick={() =>
                        setCollapsed((value) => ({
                          ...value,
                          [group]: !value[group],
                        }))
                      }
                    >
                      <span>
                        <span className="font-semibold text-slate-800">
                          {group}
                        </span>
                        <span className="ml-3 text-xs text-slate-500">
                          {currency(groupSpent)} / {currency(groupPlanned)}
                        </span>
                      </span>
                      {collapsed[group] ? (
                        <ChevronDown className="size-4 text-slate-400" />
                      ) : (
                        <ChevronUp className="size-4 text-slate-400" />
                      )}
                    </button>
                    <Button
                      variant="ghost"
                      className="min-h-8 shrink-0 px-2 text-xs"
                      onClick={() => {
                        setActiveGroup(group);
                        setDialog('item');
                      }}
                    >
                      <Plus className="size-3.5" /> Add item
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-8 shrink-0 px-2"
                      aria-label={`Delete ${group}`}
                      onClick={() => {
                        setActiveGroup(group);
                        setDialog('group-delete');
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  {!collapsed[group] &&
                    items.map((item) => (
                      <BudgetRow
                        key={item.id}
                        item={item}
                        onEdit={() => {
                          setActiveIncomeBlockId(undefined);
                          setActiveItemId(item.id);
                          setDialog('edit');
                        }}
                        onExpense={() => openExpense(item)}
                        onActivity={() => {
                          setActiveIncomeBlockId(undefined);
                          setActiveItemId(item.id);
                        }}
                      />
                    ))}
                  {!collapsed[group] && items.length === 0 && (
                    <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">
                      No items yet. Add the first item to this block.
                    </p>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
        <aside className="space-y-6">
          <Card className="p-5 sm:p-6">
            {selectedItem ? (
              <div key={selectedItem.id} className="activity-detail-enter">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5 gap-y-3">
                  <div className="min-w-0 pt-0.5">
                    <a
                      href="#activity"
                      className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline"
                      onClick={() => setActiveItemId(undefined)}
                    >
                      <ArrowLeft className="size-4" /> All activity
                    </a>
                    <h2
                      className="mt-1 truncate text-xl font-semibold text-slate-950"
                      title={selectedItem.name}
                    >
                      {selectedItem.name}
                    </h2>
                  </div>
                  <div className="justify-self-end">
                    <CircularProgress
                      value={percentage(
                        totalSpent(selectedItem),
                        selectedItem.planned,
                      )}
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Planned</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {currency(selectedItem.planned)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Spent</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {currency(totalSpent(selectedItem))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Left</p>
                    <p className="mt-1 font-semibold text-emerald-700">
                      {currency(
                        selectedItem.planned - totalSpent(selectedItem),
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 divide-y divide-slate-100">
                  {selectedItem.expenses.length ? (
                    [...selectedItem.expenses]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {expense.note || 'Expense'}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {expense.date}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-slate-700">
                            {currency(expense.amount)}
                          </p>
                          <Button
                            variant="ghost"
                            className="min-h-8 shrink-0 px-2 text-red-700 hover:bg-red-50 hover:text-red-800"
                            aria-label={`Delete ${expense.note || 'expense'}`}
                            onClick={() => {
                              setActiveExpenseId(expense.id);
                              setDialog('expense-delete');
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))
                  ) : (
                    <p className="py-3 text-sm text-slate-500">
                      No expenses recorded yet.
                    </p>
                  )}
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() => openExpense(selectedItem)}
                >
                  <Plus className="size-4" /> Add expense
                </Button>
              </div>
            ) : selectedIncomeBlock ? (
              <div
                key={selectedIncomeBlock.id}
                className="activity-detail-enter"
              >
                <div className="min-w-0 pt-0.5">
                  <a
                    href="#activity"
                    className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline"
                    onClick={() => setActiveIncomeBlockId(undefined)}
                  >
                    <ArrowLeft className="size-4" /> All activity
                  </a>
                  <h2
                    className="mt-1 truncate text-xl font-semibold text-slate-950"
                    title={selectedIncomeBlock.name}
                  >
                    {selectedIncomeBlock.name}
                  </h2>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Planned</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {currency(selectedIncomeBlock.planned)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Earned</p>
                    <p className="mt-1 font-semibold text-emerald-700">
                      {currency(
                        selectedIncomeBlock.income.reduce(
                          (total, entry) => total + entry.amount,
                          0,
                        ),
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Remaining</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {currency(
                        selectedIncomeBlock.planned -
                          selectedIncomeBlock.income.reduce(
                            (total, entry) => total + entry.amount,
                            0,
                          ),
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 divide-y divide-slate-100">
                  {selectedIncomeBlock.income.length ? (
                    [...selectedIncomeBlock.income]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {entry.note || 'Income'}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {entry.date}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-emerald-700">
                            {currency(entry.amount)}
                          </p>
                          <Button
                            variant="ghost"
                            className="min-h-8 shrink-0 px-2 text-red-700 hover:bg-red-50 hover:text-red-800"
                            aria-label={`Delete ${entry.note || 'income entry'}`}
                            onClick={() => {
                              setActiveIncomeEntryId(entry.id);
                              setDialog('income-entry-delete');
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))
                  ) : (
                    <p className="py-3 text-sm text-slate-500">
                      No income recorded yet.
                    </p>
                  )}
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() => openIncome(selectedIncomeBlock.id)}
                >
                  <Plus className="size-4" /> Add income
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Recent activity
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Select a budget row to inspect its logs.
                    </p>
                  </div>
                  <Receipt className="size-5 text-slate-400" />
                </div>
                <div className="mt-5 divide-y divide-slate-100">
                  {recentActivity.length ? (
                    recentActivity.map((entry) => (
                      <button
                        key={entry.id}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left first:pt-0 last:pb-0 hover:text-slate-950"
                        onClick={() =>
                          setActiveItemId(
                            month.items.find(
                              (item) => item.name === entry.itemName,
                            )?.id,
                          )
                        }
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-slate-800">
                            {entry.note || entry.itemName}
                          </span>
                          <span className="mt-1 block truncate text-xs text-slate-500">
                            {entry.group} · {entry.date}
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold text-slate-700">
                          {currency(entry.amount)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="py-3 text-sm text-slate-500">
                      No expenses recorded yet.
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>
          <Card className="p-5 sm:p-6">
            <p className="text-sm font-medium text-slate-500">Monthly note</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {month.note ||
                'Add a note about this month when something changes.'}
            </p>
            <Button
              variant="secondary"
              className="mt-5 w-full"
              onClick={() => setDialog('note-edit')}
            >
              Edit note
            </Button>
          </Card>
        </aside>
      </div>
      <Dialog
        open={dialog === 'note-edit'}
        title="Edit monthly note"
        description={`Add context for ${monthLabel(selectedKey)}.`}
        onClose={() => setDialog(null)}
      >
        <MonthlyNoteForm
          note={month.note}
          onSubmit={(note) => {
            void budgetPatch(`/budget/months/${selectedKey}`, {
              note,
              monthVersion: version,
            })
              .then(async () => {
                setDialog(null);
                await refresh();
              })
              .catch((error) =>
                setLoadError(error?.message ?? 'Unable to save monthly note.'),
              );
          }}
        />
      </Dialog>
      <Dialog
        open={dialog === 'expense'}
        title={
          selectedItem ? `Add expense to ${selectedItem.name}` : 'Add expense'
        }
        description="Record a purchase against this month’s plan."
        onClose={() => setDialog(null)}
      >
        <ExpenseForm item={selectedItem} onSubmit={addExpense} />
      </Dialog>
      <Dialog
        open={dialog === 'income'}
        title={`Add income to ${month.incomeBlocks.find((block) => block.id === activeIncomeBlockId)?.name ?? 'source'}`}
        description="Record money received this month."
        onClose={() => setDialog(null)}
      >
        <IncomeForm
          block={month.incomeBlocks.find(
            (block) => block.id === activeIncomeBlockId,
          )}
          onSubmit={addIncome}
        />
      </Dialog>
      <Dialog
        open={dialog === 'income-block'}
        title="Add income block"
        description="Create a source such as salary, freelance work, or contracts."
        onClose={() => setDialog(null)}
      >
        <NewIncomeBlockForm onSubmit={addIncomeBlock} />
      </Dialog>
      <Dialog
        open={dialog === 'income-edit'}
        title="Edit income source"
        description="Adjust the name, expected amount, or recurring setting."
        onClose={() => setDialog(null)}
      >
        {selectedIncomeBlock && (
          <div className="space-y-5">
            <EditIncomeBlockForm
              block={selectedIncomeBlock}
              onSubmit={(values) => {
                void budgetPatch(
                  `/budget/income-sources/${selectedIncomeBlock.id}`,
                  {
                    name: values.name,
                    plannedAmount: values.planned,
                    isRecurring: values.recurring,
                    monthVersion: version,
                  },
                ).then(async () => {
                  setDialog(null);
                  await refresh();
                });
              }}
            />
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setDialog('income-delete')}
            >
              Delete income source
            </Button>
          </div>
        )}
      </Dialog>
      <Dialog
        open={dialog === 'income-delete'}
        title="Delete income source?"
        description="This cannot be undone."
        onClose={() => setDialog(null)}
      >
        {selectedIncomeBlock && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              Delete <strong>{selectedIncomeBlock.name}</strong>?
            </p>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertTriangle className="mr-2 inline size-4" />
              This source cannot be deleted while it has recorded income
              entries. Delete those entries first.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDialog('income-edit')}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() =>
                  void budgetDelete(
                    `/budget/income-sources/${selectedIncomeBlock.id}`,
                    { monthVersion: version },
                  )
                    .then(async () => {
                      setDialog(null);
                      setActiveIncomeBlockId(undefined);
                      await refresh();
                    })
                    .catch((error) =>
                      setLoadError(
                        error?.message ?? 'Unable to delete income source.',
                      ),
                    )
                }
              >
                Delete source
              </Button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog
        open={dialog === 'income-entry-delete'}
        title="Delete income entry?"
        description="This cannot be undone."
        onClose={() => setDialog(null)}
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-600">
            Delete this recorded income entry?
          </p>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle className="mr-2 inline size-4" />
            This permanently removes the recorded amount from this month.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                if (!activeIncomeEntryId) return;
                void budgetDelete(
                  `/budget/income-entries/${activeIncomeEntryId}`,
                  { monthVersion: version },
                )
                  .then(async () => {
                    setDialog(null);
                    setActiveIncomeEntryId(undefined);
                    await refresh();
                  })
                  .catch((error) =>
                    setLoadError(
                      error?.message ?? 'Unable to delete income entry.',
                    ),
                  );
              }}
            >
              Delete entry
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={dialog === 'expense-delete'}
        title="Delete expense?"
        description="This cannot be undone."
        onClose={() => setDialog(null)}
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-600">
            Delete this recorded expense?
          </p>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle className="mr-2 inline size-4" />
            This permanently removes the recorded amount from this month.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (!activeExpenseId) return;
                void budgetDelete(`/budget/expenses/${activeExpenseId}`, {
                  monthVersion: version,
                })
                  .then(async () => {
                    setDialog(null);
                    setActiveExpenseId(undefined);
                    await refresh();
                  })
                  .catch((error) =>
                    setLoadError(error?.message ?? 'Unable to delete expense.'),
                  );
              }}
            >
              Delete expense
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={dialog === 'edit'}
        title="Edit budget item"
        description="Adjust the plan without changing existing expenses."
        onClose={() => setDialog(null)}
      >
        {selectedItem && (
          <div className="space-y-5">
            <BudgetItemForm item={selectedItem} onSubmit={editItem} />
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setDialog('item-delete')}
            >
              Delete item
            </Button>
          </div>
        )}
      </Dialog>
      <Dialog
        open={dialog === 'item-delete'}
        title="Delete budget item?"
        description="Items with recorded expenses cannot be deleted."
        onClose={() => setDialog(null)}
      >
        {selectedItem && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              Delete <strong>{selectedItem.name}</strong>?
            </p>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertTriangle className="mr-2 inline size-4" />
              This item cannot be deleted while it has recorded expenses. Delete
              its expenses first.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDialog('edit')}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() =>
                  void budgetDelete(`/budget/items/${selectedItem.id}`, {
                    monthVersion: version,
                  })
                    .then(async () => {
                      setDialog(null);
                      setActiveItemId(undefined);
                      await refresh();
                    })
                    .catch((error) =>
                      setLoadError(error?.message ?? 'Unable to delete item.'),
                    )
                }
              >
                Delete item
              </Button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog
        open={dialog === 'activity'}
        title={`${selectedItem?.name ?? 'Item'} activity`}
        description="Every expense recorded against this budget item."
        onClose={() => setDialog(null)}
      >
        {selectedItem && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Planned</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {currency(selectedItem.planned)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Spent</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {currency(totalSpent(selectedItem))}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Left</p>
                <p className="mt-1 font-semibold text-emerald-700">
                  {currency(selectedItem.planned - totalSpent(selectedItem))}
                </p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {selectedItem.expenses.length ? (
                [...selectedItem.expenses]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {expense.note || 'Expense'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {expense.date}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-700">
                        {currency(expense.amount)}
                      </p>
                    </div>
                  ))
              ) : (
                <p className="py-3 text-sm text-slate-500">
                  No expenses recorded yet.
                </p>
              )}
            </div>
            <Button className="w-full" onClick={() => setDialog('expense')}>
              <Plus className="size-4" /> Add expense
            </Button>
          </div>
        )}
      </Dialog>
      <Dialog
        open={dialog === 'group'}
        title="Add budget block"
        description="Create a new group for a different kind of plan."
        onClose={() => setDialog(null)}
      >
        <NewGroupForm onSubmit={addGroup} />
      </Dialog>
      <Dialog
        open={dialog === 'group-delete'}
        title="Delete budget block?"
        description="Blocks can only be deleted when they have no items."
        onClose={() => setDialog(null)}
      >
        {activeGroup && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              Delete <strong>{activeGroup}</strong>?
            </p>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertTriangle className="mr-2 inline size-4" />
              This block cannot be deleted while it contains budget items. Move
              or delete every item first.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDialog(null)}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() =>
                  void getBudget(selectedKey)
                    .then((data) => {
                      const id = data.groups.find(
                        (group) => group.name === activeGroup,
                      )?.id;
                      if (!id) throw new Error('Block not found');
                      return budgetDelete(`/budget/groups/${id}`, {
                        monthVersion: version,
                      });
                    })
                    .then(async () => {
                      setDialog(null);
                      setActiveGroup(undefined);
                      await refresh();
                    })
                    .catch((error) =>
                      setLoadError(error?.message ?? 'Unable to delete block.'),
                    )
                }
              >
                Delete block
              </Button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog
        open={dialog === 'item'}
        title={`Add item to ${activeGroup ?? 'budget'}`}
        description="Add a planned amount to this block."
        onClose={() => setDialog(null)}
      >
        {activeGroup && (
          <NewBudgetItemForm group={activeGroup} onSubmit={addItem} />
        )}
      </Dialog>
      <Dialog
        open={dialog === 'copy'}
        title="Copy this budget"
        description={`Start a new month using ${monthLabel(selectedKey)} as your template.`}
        onClose={() => setDialog(null)}
      >
        <div className="space-y-5">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              <strong className="text-slate-900">{month.items.length}</strong>{' '}
              budget items will be reviewed.
            </p>
            <p className="mt-1">
              <strong className="text-slate-900">
                {month.items.filter((item) => item.recurring).length}
              </strong>{' '}
              recurring items will be copied with no expenses.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => copyBudget(false)}>
              Recurring only
            </Button>
            <Button onClick={() => copyBudget(true)}>Copy all items</Button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
