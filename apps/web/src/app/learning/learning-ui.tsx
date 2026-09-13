'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  learningEpicSchema,
  learningTaskSchema,
  manualTimeSchema,
} from '@personally/validation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Select } from '../../components/ui/select';
import { Pagination } from '../../components/ui/pagination';
import { Dialog } from '../../components/ui/dialog';
import {
  epicProgress,
  epicStatus,
  formatMinutes,
  type LearningEpic,
  type LearningTask,
} from './learning-data';

const statusStyles: Record<string, string> = {
  Todo: 'bg-slate-100 text-slate-600',
  'In progress': 'bg-amber-100 text-amber-800',
  Done: 'bg-emerald-100 text-emerald-800',
  Blocked: 'bg-rose-100 text-rose-800',
  Cancelled: 'bg-slate-100 text-slate-400',
};
function Status({ value }: { value: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[value] ?? statusStyles.Todo}`}
    >
      {value}
    </span>
  );
}
function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-slate-950 transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function LearningForm({
  type,
  defaults,
  onSubmit,
  onCancel,
}: {
  type: 'epic' | 'task';
  defaults?: Record<string, string | number>;
  onSubmit: (values: Record<string, string | number>) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Record<string, string | number>>({ defaultValues: defaults });
  const submit = (values: Record<string, string | number>) => {
    const result =
      type === 'epic'
        ? learningEpicSchema.safeParse(values)
        : learningTaskSchema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) =>
        setError(String(issue.path[0]), { message: issue.message }),
      );
      return;
    }
    onSubmit(values);
  };
  const field = (name: string, label: string, inputType = 'text') => (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        {...register(name)}
        type={inputType}
        className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
      {errors[name] && (
        <span className="mt-1 block text-xs font-normal text-rose-600">
          {String(errors[name]?.message)}
        </span>
      )}
    </label>
  );
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      {field('name', type === 'epic' ? 'Epic name' : 'Task name')}
      {type === 'epic' ? (
        field('targetDate', 'Target completion date', 'date')
      ) : (
        <>
          {field('description', 'Description')}
          <div className="grid grid-cols-2 gap-3">
            {field('targetMinutes', 'Target minutes', 'number')}
            {field('weight', 'Weight', 'number')}
          </div>
        </>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export function LearningOverview({ epics }: { epics: LearningEpic[] }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [createdFilter, setCreatedFilter] = useState('All time');
  const [sortBy, setSortBy] = useState('Newest');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [statusFilter, createdFilter, sortBy]);
  const completedEpics = epics.filter(
    (epic) => epicStatus(epic) === 'Done',
  ).length;
  const inProgressEpics = epics.filter(
    (epic) => epicStatus(epic) === 'In progress',
  ).length;
  const visibleEpics = epics
    .filter((epic) => {
      const matchesStatus =
        statusFilter === 'All' || epicStatus(epic) === statusFilter;
      const age = Date.now() - new Date(epic.createdAt).getTime();
      const matchesCreated =
        createdFilter === 'All time' ||
        (createdFilter === 'Last 30 days' && age <= 30 * 24 * 60 * 60 * 1000) ||
        (createdFilter === 'Older than 30 days' &&
          age > 30 * 24 * 60 * 60 * 1000);
      return matchesStatus && matchesCreated;
    })
    .sort((first, second) => {
      if (sortBy === 'Oldest')
        return (
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime()
        );
      if (sortBy === 'Name') return first.name.localeCompare(second.name);
      if (sortBy === 'Progress')
        return epicProgress(second) - epicProgress(first);
      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  const pageSize = 10;
  const totalPages = Math.ceil(visibleEpics.length / pageSize);
  const paginatedEpics = visibleEpics.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  return (
    <main
      id="main-content"
      className="page-transition mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-8"
    >
      <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">
          Your learning workspace
        </h1>
        <Button
          className="shrink-0"
          onClick={() => setShowCreateForm((value) => !value)}
          aria-expanded={showCreateForm}
          aria-controls="new-epic"
        >
          + Create Epic
        </Button>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Summary label="Total Epics" value={String(epics.length)} />
        <Summary label="Completed Epics" value={String(completedEpics)} />
        <Summary label="In Progress Epics" value={String(inProgressEpics)} />
      </div>
      <Dialog
        open={showCreateForm}
        title="Create a new epic"
        description="Define the outcome first. You can add tasks next."
        onClose={() => setShowCreateForm(false)}
      >
        <LearningForm
          type="epic"
          onCancel={() => setShowCreateForm(false)}
          onSubmit={() => setShowCreateForm(false)}
        />
      </Dialog>
      <section className="mt-9">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Your Epics
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Filter and sort your learning outcomes.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <Select
              label="Status"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={['All', 'Todo', 'In progress', 'Done']}
            />
            <Select
              label="Created"
              value={createdFilter}
              onValueChange={setCreatedFilter}
              options={['All time', 'Last 30 days', 'Older than 30 days']}
            />
            <Select
              label="Sort"
              value={sortBy}
              onValueChange={setSortBy}
              options={['Newest', 'Oldest', 'Name', 'Progress']}
            />
          </div>
        </div>
        <div
          id="learning-list"
          className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {paginatedEpics.length ? (
            <>
              <div className="hidden border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-6">
                <span>Epic</span>
                <span className="grid grid-cols-3 gap-5">
                  <span>Created</span>
                  <span>Due</span>
                  <span>Tracked</span>
                </span>
              </div>
              {paginatedEpics.map((epic) => (
                <EpicCard key={epic.id} epic={epic} />
              ))}
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-slate-950">
                No epics match these filters.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try a different status or creation date.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="relative overflow-hidden rounded-2xl p-4 shadow-sm sm:p-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-slate-950" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 tabular-nums text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </Card>
  );
}
function CircularProgress({ value }: { value: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div
      className="relative h-14 w-14 shrink-0"
      aria-label={`${value}% complete`}
      role="img"
    >
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 44 44"
        aria-hidden="true"
      >
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-slate-100"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-slate-950 transition-[stroke-dashoffset] duration-500"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center tabular-nums text-xs font-bold text-slate-700">
        {value}%
      </span>
    </div>
  );
}
function EpicCard({ epic }: { epic: LearningEpic }) {
  const progress = epicProgress(epic);
  const actual = epic.tasks.reduce((sum, task) => sum + task.actualMinutes, 0);
  return (
    <div className="group border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
      <Link
        href={`/learning/epics/${epic.id}`}
        className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/80 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950 sm:flex-row sm:items-center sm:gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6"
      >
        <div className="flex min-w-0 items-center gap-4">
          <CircularProgress value={progress} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="truncate text-base font-semibold text-slate-950">
                {epic.name}
              </h3>
              <Status value={epicStatus(epic)} />
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
              {epic.description}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5 text-sm tabular-nums lg:w-[22rem] lg:shrink-0">
          <div>
            <p className="text-xs text-slate-400 lg:sr-only">Created</p>
            <p className="mt-1 whitespace-nowrap text-slate-600">
              {shortDateFormatter.format(new Date(epic.createdAt))}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 lg:sr-only">Due</p>
            <p className="mt-1 whitespace-nowrap text-slate-600">
              {shortDateFormatter.format(new Date(epic.targetDate))}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 lg:sr-only">Tracked</p>
            <p className="mt-1 whitespace-nowrap text-slate-600">
              {formatMinutes(actual)}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function EpicDetail({ epic }: { epic: LearningEpic }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Weight (high to low)');
  const [page, setPage] = useState(1);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  useEffect(() => setPage(1), [statusFilter, sortBy]);
  const actual = epic.tasks.reduce((sum, task) => sum + task.actualMinutes, 0);
  const progress = epicProgress(epic);
  const visibleTasks = epic.tasks
    .filter((task) => statusFilter === 'All' || task.status === statusFilter)
    .sort((first, second) =>
      sortBy === 'Weight (low to high)'
        ? first.weight - second.weight
        : sortBy === 'Name'
          ? first.name.localeCompare(second.name)
          : second.weight - first.weight,
    );
  const pageSize = 10;
  const totalPages = Math.ceil(visibleTasks.length / pageSize);
  const paginatedTasks = visibleTasks.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  return (
    <main className="page-transition mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-8">
      <Link
        href="/learning"
        className="text-sm font-semibold text-slate-500 hover:text-slate-950"
      >
        ← All learning
      </Link>
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {epic.name}
            </h1>
            <Status value={epicStatus(epic)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowAddTask(true)}>+ Add Task</Button>
          <Button variant="secondary" onClick={() => setShowEdit(true)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            className="text-slate-500"
            onClick={() => setShowDelete(true)}
          >
            Delete
          </Button>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Summary label="Progress" value={`${progress}%`} />
        <Summary
          label="Target time"
          value={formatMinutes(epic.targetMinutes)}
        />
        <Summary label="Actual time" value={formatMinutes(actual)} />
        <Summary
          label="Difference"
          value={formatMinutes(Math.abs(actual - epic.targetMinutes))}
        />
      </div>
      <section className="mt-9">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Your Tasks
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Filter and sort the tasks in this epic.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <Select
              label="Task status"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                'All',
                'Todo',
                'In progress',
                'Done',
                'Blocked',
                'Cancelled',
              ]}
            />
            <Select
              label="Sort tasks"
              value={sortBy}
              onValueChange={setSortBy}
              options={['Weight (high to low)', 'Weight (low to high)', 'Name']}
            />
          </div>
        </div>
        <Card className="mt-4 divide-y divide-slate-100 rounded-2xl">
          {paginatedTasks.length ? (
            <>
              <div className="hidden border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:grid lg:grid-cols-[minmax(0,1fr)_5rem_8rem_6rem_6rem] lg:items-center lg:gap-5">
                <span>Task</span>
                <span>Weight</span>
                <span>Status</span>
                <span>Target</span>
                <span>Actual</span>
              </div>
              {paginatedTasks.map((task, index) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={index}
                  epicId={epic.id}
                />
              ))}
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="font-semibold text-slate-950">
                No tasks match this filter.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try another status to see more tasks.
              </p>
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </Card>
      </section>
      {epic.comment && (
        <Card className="mt-5 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Epic comment
          </p>
          <p className="mt-3 text-slate-700">{epic.comment}</p>
        </Card>
      )}
      <Dialog
        open={showAddTask}
        title="Add task"
        description="Break this epic into a focused next step."
        onClose={() => setShowAddTask(false)}
      >
        <LearningForm
          type="task"
          onCancel={() => setShowAddTask(false)}
          onSubmit={() => setShowAddTask(false)}
        />
      </Dialog>
      <Dialog
        open={showEdit}
        title="Edit epic"
        onClose={() => setShowEdit(false)}
      >
        <LearningForm
          type="epic"
          defaults={{ name: epic.name, targetDate: epic.targetDate }}
          onCancel={() => setShowEdit(false)}
          onSubmit={() => setShowEdit(false)}
        />
      </Dialog>
      <Dialog
        open={showDelete}
        title="Delete this epic?"
        description="This action will remove the epic and its tasks. This cannot be undone."
        onClose={() => setShowDelete(false)}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => setShowDelete(false)}
            className="bg-rose-600 hover:bg-rose-700"
          >
            Delete epic
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
function TaskRow({
  task,
  index,
  epicId,
}: {
  task: LearningTask;
  index: number;
  epicId: string;
}) {
  return (
    <Link
      href={`/learning/epics/${epicId}/tasks/${task.id}`}
      className="flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50/80 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950 lg:grid lg:grid-cols-[minmax(0,1fr)_5rem_8rem_6rem_6rem] lg:items-center lg:gap-5"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="mt-1 text-sm font-semibold text-slate-400">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <span className="font-semibold text-slate-950">{task.name}</span>
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
            {task.description}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm tabular-nums sm:grid-cols-4 lg:contents">
        <div>
          <p className="text-xs text-slate-400 lg:sr-only">Weight</p>
          <p className="mt-1 font-semibold text-slate-600">{task.weight}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 lg:sr-only">Status</p>
          <div className="mt-1">
            <Status value={task.status} />
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 lg:sr-only">Target</p>
          <p className="mt-1 whitespace-nowrap text-slate-600">
            {formatMinutes(task.targetMinutes)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 lg:sr-only">Actual</p>
          <p className="mt-1 whitespace-nowrap text-slate-600">
            {formatMinutes(task.actualMinutes)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ManualTimeForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Record<string, string | number>>({
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });
  const submit = (values: Record<string, string | number>) => {
    const result = manualTimeSchema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) =>
        setError(String(issue.path[0]), { message: issue.message }),
      );
      return;
    }
    onSubmit();
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Date
        <input
          {...register('date')}
          type="date"
          className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3"
        />
        {errors.date && (
          <span className="mt-1 block text-xs font-normal text-rose-600">
            {String(errors.date.message)}
          </span>
        )}
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Duration in minutes
        <input
          {...register('minutes')}
          type="number"
          min="1"
          max="1440"
          placeholder="e.g. 45"
          className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3"
        />
        {errors.minutes && (
          <span className="mt-1 block text-xs font-normal text-rose-600">
            {String(errors.minutes.message)}
          </span>
        )}
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Note <span className="font-normal text-slate-400">(optional)</span>
        <textarea
          {...register('note')}
          maxLength={300}
          className="mt-1.5 min-h-20 w-full rounded-lg border border-slate-200 p-3"
          placeholder="What did you work on?…"
        />
        {errors.note && (
          <span className="mt-1 block text-xs font-normal text-rose-600">
            {String(errors.note.message)}
          </span>
        )}
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save time</Button>
      </div>
    </form>
  );
}

export function TaskDetail({
  epic,
  task,
}: {
  epic: LearningEpic;
  task: LearningTask;
}) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showManualTime, setShowManualTime] = useState(false);
  const [note, setNote] = useState(task.completionNote ?? '');
  const [savedNote, setSavedNote] = useState(task.completionNote ?? '');
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  const minutes = Math.floor(seconds / 60);
  const difference = task.actualMinutes - task.targetMinutes;
  return (
    <main className="page-transition mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-8">
      <Link
        href={`/learning/epics/${epic.id}`}
        className="text-sm font-semibold text-slate-500 hover:text-slate-950"
      >
        ← {epic.name}
      </Link>
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {task.name}
            </h1>
            <Status value={task.status} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowEdit(true)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            className="text-slate-500"
            onClick={() => setShowDelete(true)}
          >
            Delete
          </Button>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Summary
          label="Target time"
          value={formatMinutes(task.targetMinutes)}
        />
        <Summary
          label="Actual time"
          value={formatMinutes(task.actualMinutes + minutes)}
        />
        <Summary
          label="Difference"
          value={`${difference < 0 ? '-' : '+'}${formatMinutes(Math.abs(difference))}`}
        />
        <Summary
          label="Sessions"
          value={`${task.sessions} · avg ${formatMinutes(task.sessions ? Math.round(task.actualMinutes / task.sessions) : 0)}`}
        />
      </div>
      <Card className="mt-6 rounded-2xl p-5 text-center sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Current session
        </p>
        <p className="mt-2 font-mono text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
          {String(Math.floor(seconds / 3600)).padStart(2, '0')}:
          {String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:
          {String(seconds % 60).padStart(2, '0')}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Start a session to track time against this task.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {!running ? (
            <Button onClick={() => setRunning(true)}>Start</Button>
          ) : (
            <Button onClick={() => setRunning(false)} variant="secondary">
              Pause
            </Button>
          )}
          <Button
            onClick={() => {
              setRunning(false);
              setSeconds(0);
            }}
            variant="ghost"
          >
            Stop
          </Button>
          <Button
            onClick={() => {
              setRunning(false);
              setSeconds(0);
            }}
            variant="default"
          >
            Complete
          </Button>
        </div>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl p-5">
          <h2 className="font-semibold text-slate-950">Saved time</h2>
          <p className="mt-2 text-sm text-slate-500">
            {task.sessions} saved sessions · {formatMinutes(task.actualMinutes)}{' '}
            tracked
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => setShowManualTime(true)}
          >
            + Add manual time
          </Button>
        </Card>
        <Card className="rounded-2xl p-5">
          <h2 className="font-semibold text-slate-950">Notes</h2>
          <p className="mt-2 text-sm text-slate-500">
            Completion note and task comment will be saved with this task.
          </p>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
            placeholder="Add a private note…"
            maxLength={500}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400" aria-live="polite">
              {savedNote === note ? 'Saved' : 'Unsaved changes'}
            </span>
            <Button
              disabled={savedNote === note}
              onClick={() => setSavedNote(note)}
            >
              Save note
            </Button>
          </div>
        </Card>
      </div>
      <Dialog
        open={showManualTime}
        title="Add manual time"
        description="Record time spent outside the timer."
        onClose={() => setShowManualTime(false)}
      >
        <ManualTimeForm
          onCancel={() => setShowManualTime(false)}
          onSubmit={() => setShowManualTime(false)}
        />
      </Dialog>
      <Dialog
        open={showEdit}
        title="Edit task"
        onClose={() => setShowEdit(false)}
      >
        <LearningForm
          type="task"
          defaults={{
            name: task.name,
            description: task.description,
            targetMinutes: task.targetMinutes,
            weight: task.weight,
          }}
          onCancel={() => setShowEdit(false)}
          onSubmit={() => setShowEdit(false)}
        />
      </Dialog>
      <Dialog
        open={showDelete}
        title="Delete this task?"
        description="This action cannot be undone."
        onClose={() => setShowDelete(false)}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => setShowDelete(false)}
            className="bg-rose-600 hover:bg-rose-700"
          >
            Delete task
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
