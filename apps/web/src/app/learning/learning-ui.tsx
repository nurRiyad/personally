'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pencil } from 'lucide-react';
import * as s from '@personally/validation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Select } from '../../components/ui/select';
import { Pagination } from '../../components/ui/pagination';
import { Dialog } from '../../components/ui/dialog';
import { apiRequest, ApiError } from '../../lib/api/client';
import {
  epicPath,
  taskPath,
  learningRecord,
  learningRequest,
  jsonRequest,
  queryString,
} from '../../lib/api/learning';
import {
  useLearningQuery,
  useLearningMutation,
  useLearningTimer,
  errorMessage,
} from './learning-provider';
import {
  EpicForm,
  TaskForm,
  ManualForm,
  StopwatchForm,
  NotesForm,
} from './learning-forms';
import {
  Status,
  Summary,
  EpicCard,
  TaskRow,
  formatMinutes,
} from './learning-display';

function Frame({ children }: { children: ReactNode }) {
  return (
    <main
      id="main-content"
      className="page-transition mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 sm:py-8"
    >
      {children}
    </main>
  );
}
function QueryState({
  error,
  retry,
}: {
  error: unknown;
  retry: () => unknown;
}) {
  return (
    <div className="py-10" role={error ? 'alert' : 'status'}>
      {error ? (
        <>
          <p>
            {error instanceof ApiError && error.status === 404
              ? 'This learning record was not found.'
              : errorMessage(error)}
          </p>
          {error instanceof ApiError && error.status === 401 ? (
            <Link href="/auth" className="underline">
              Sign in
            </Link>
          ) : (
            <Button className="mt-3" onClick={() => retry()}>
              Try again
            </Button>
          )}
          <Link className="ml-4 underline" href="/learning">
            All learning
          </Link>
        </>
      ) : (
        <p>Loading learning…</p>
      )}
    </div>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="px-6 py-12 text-center text-sm text-slate-500">{children}</p>
  );
}
function useClampedPage(
  totalPages: number | undefined,
  page: number,
  setPage: (v: number) => void,
) {
  useEffect(() => {
    if (totalPages !== undefined && page > Math.max(1, totalPages))
      setPage(Math.max(1, totalPages));
  }, [totalPages, page, setPage]);
}
function DeleteDialog({
  open,
  title,
  onClose,
  onDelete,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onDelete: () => Promise<unknown>;
}) {
  const mutation = useLearningMutation();
  return (
    <Dialog
      open={open}
      title={title}
      description="This removes the record and its saved time permanently."
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
    >
      {mutation.error && (
        <p role="alert" className="mb-3 text-sm text-rose-700">
          {errorMessage(mutation.error)}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button disabled={mutation.isPending} variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={mutation.isPending}
          className="bg-rose-600 hover:bg-rose-700"
          onClick={() =>
            void mutation
              .mutateAsync(onDelete)
              .then(onClose)
              .catch(() => {})
          }
        >
          {mutation.isPending ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </Dialog>
  );
}
const epicSort: Record<string, s.EpicQuery['sort']> = {
  Newest: 'newest',
  Oldest: 'oldest',
  Name: 'name',
  Progress: 'progress',
};
const createdValues: Record<string, s.EpicQuery['created']> = {
  'All time': 'all',
  'Last 30 days': 'recent30',
  'Older than 30 days': 'older30',
};
const taskSort: Record<string, s.TaskQuery['sort']> = {
  'Weight (high to low)': 'weight-desc',
  'Weight (low to high)': 'weight-asc',
  Name: 'name',
  'Manual order': 'manual',
};

export function LearningOverview() {
  const [showCreate, setShowCreate] = useState(false),
    [status, setStatus] = useState('All'),
    [created, setCreated] = useState('All time'),
    [sort, setSort] = useState('Newest'),
    [page, setPage] = useState(1);
  const mutation = useLearningMutation();
  const params = {
    status,
    created: createdValues[created],
    sort: epicSort[sort],
    page,
    pageSize: 10,
  };
  const list = useLearningQuery(['epics', params], () =>
    learningRequest(
      '/learning/epics' + queryString(params),
      s.epicListResponseSchema,
    ),
  );
  const summary = useLearningQuery(['summary'], () =>
    learningRecord('/learning/summary', s.summaryResponseSchema),
  );
  useClampedPage(list.data?.meta.totalPages, page, setPage);
  const change = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  return (
    <Frame>
      <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Your learning workspace
        </h1>
        <Button onClick={() => setShowCreate(true)}>+ Create Epic</Button>
      </div>
      {summary.data ? (
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Summary label="Total Epics" value={String(summary.data.total)} />
          <Summary
            label="Completed Epics"
            value={String(summary.data.completed)}
          />
          <Summary
            label="In Progress Epics"
            value={String(summary.data.inProgress)}
          />
        </div>
      ) : (
        <QueryState error={summary.error} retry={summary.refetch} />
      )}
      <section className="mt-9">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Your Epics
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Filter and sort your learning outcomes.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <Select
              label="Status"
              value={status}
              onValueChange={change(setStatus)}
              options={['All', 'Todo', 'In progress', 'Done']}
            />
            <Select
              label="Created"
              value={created}
              onValueChange={change(setCreated)}
              options={Object.keys(createdValues)}
            />
            <Select
              label="Sort"
              value={sort}
              onValueChange={change(setSort)}
              options={Object.keys(epicSort)}
            />
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {list.error || !list.data ? (
            <QueryState error={list.error} retry={list.refetch} />
          ) : (
            <>
              {list.data.data.length ? (
                <>
                  <div className="hidden border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase text-slate-400 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <span>Epic</span>
                    <span className="grid grid-cols-3 gap-5">
                      <span>Created</span>
                      <span>Due</span>
                      <span>Tracked</span>
                    </span>
                  </div>
                  {list.data.data.map((epic) => (
                    <EpicCard key={epic.id} epic={epic} />
                  ))}
                </>
              ) : (
                <Empty>
                  {summary.data?.total === 0
                    ? 'Create your first epic to start learning.'
                    : 'No epics match these filters.'}
                </Empty>
              )}
              <Pagination
                page={page}
                totalPages={list.data.meta.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </section>
      <Dialog
        open={showCreate}
        title="Create a new epic"
        description="Define the outcome first. You can add tasks next."
        onClose={() => {
          if (!mutation.isPending) setShowCreate(false);
        }}
      >
        <EpicForm
          onCancel={() => setShowCreate(false)}
          onSubmit={async (values) => {
            await mutation.mutateAsync(() =>
              learningRecord(
                '/learning/epics',
                s.epicResponseSchema,
                jsonRequest('POST', values),
              ),
            );
            setPage(1);
            setShowCreate(false);
          }}
        />
      </Dialog>
    </Frame>
  );
}

export function EpicDetail({ id }: { id: string }) {
  const router = useRouter(),
    timer = useLearningTimer(),
    mutation = useLearningMutation();
  const epic = useLearningQuery(['epic', id], () =>
    learningRecord(epicPath(id), s.epicResponseSchema),
  );
  const [status, setStatus] = useState('All'),
    [sort, setSort] = useState('Weight (high to low)'),
    [page, setPage] = useState(1),
    [dialog, setDialog] = useState<'edit' | 'delete' | 'add' | 'order' | null>(
      null,
    );
  const params = { status, sort: taskSort[sort], page, pageSize: 10 };
  const list = useLearningQuery(['tasks', id, params], () =>
    learningRequest(
      `${epicPath(id)}/tasks${queryString(params)}`,
      s.taskListResponseSchema,
    ),
  );
  useClampedPage(list.data?.meta.totalPages, page, setPage);
  if (!epic.data || epic.error)
    return (
      <Frame>
        <QueryState error={epic.error} retry={epic.refetch} />
      </Frame>
    );
  const value = epic.data,
    close = () => {
      if (!mutation.isPending) setDialog(null);
    };
  const timerHere =
    timer.active?.task.epicId === id || timer.pending?.task.epicId === id;
  return (
    <Frame>
      <Link
        href="/learning"
        className="text-sm font-semibold text-slate-500 hover:text-slate-950"
      >
        ← All learning
      </Link>
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {value.name}
            </h1>
            <Status value={value.status} />
          </div>
          <p className="mt-3 text-slate-600">{value.description}</p>
          <p className="mt-2 text-sm text-slate-500">
            Target date: {value.targetDate}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setDialog('add')}>+ Add Task</Button>
          <Button variant="secondary" onClick={() => setDialog('edit')}>
            Edit
          </Button>
          <Button
            disabled={timerHere}
            title={
              timerHere ? 'Save or discard the active timer first' : undefined
            }
            variant="ghost"
            onClick={() => setDialog('delete')}
          >
            Delete
          </Button>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Summary label="Progress" value={`${value.progress}%`} />
        <Summary
          label="Target time"
          value={formatMinutes(value.targetMinutes)}
        />
        <Summary
          label="Actual time"
          value={formatMinutes(value.actualMinutes)}
        />
        <Summary
          label={value.differenceMinutes > 0 ? 'Over target' : 'Remaining'}
          value={formatMinutes(value.differenceMinutes)}
        />
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {Math.round(value.percentageUsed)}% of target time used ·{' '}
        {value.completedPoints}/{value.eligiblePoints} eligible points completed
      </p>
      <section className="mt-9">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Your Tasks
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Filter and sort the tasks in this epic.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <Select
              label="Task status"
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={['All', ...s.taskStatusSchema.options]}
            />
            <Select
              label="Sort tasks"
              value={sort}
              onValueChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              options={Object.keys(taskSort)}
            />
            <Button
              variant="secondary"
              className="min-h-10 rounded-lg px-3"
              disabled={!value.taskCount || timerHere}
              onClick={() => setDialog('order')}
            >
              Reorder
            </Button>
          </div>
        </div>
        <Card className="mt-4 divide-y divide-slate-100 rounded-2xl">
          {list.error || !list.data ? (
            <QueryState error={list.error} retry={list.refetch} />
          ) : (
            <>
              {list.data.data.length ? (
                <>
                  <div className="hidden bg-slate-50/70 px-5 py-2.5 text-xs font-semibold uppercase text-slate-400 lg:grid lg:grid-cols-[minmax(0,1fr)_5rem_8rem_6rem_6rem] lg:gap-5">
                    <span>Task</span>
                    <span>Weight</span>
                    <span>Status</span>
                    <span>Target</span>
                    <span>Actual</span>
                  </div>
                  {list.data.data.map((task, index) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      index={(page - 1) * 10 + index}
                      epicId={id}
                    />
                  ))}
                </>
              ) : (
                <Empty>
                  {value.taskCount
                    ? 'No tasks match this filter.'
                    : 'Add your first task to this epic.'}
                </Empty>
              )}
              <Pagination
                page={page}
                totalPages={list.data.meta.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      </section>
      <Card className="mt-5 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">Epic comment</h2>
          <Button
            variant="ghost"
            className="min-h-8 rounded-lg px-2.5 text-xs"
            onClick={() => setDialog('edit')}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Button>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-slate-700">
          {value.comment || 'No comment yet.'}
        </p>
      </Card>
      <Dialog open={dialog === 'add'} title="Add task" onClose={close}>
        <TaskForm
          onCancel={close}
          onSubmit={async (values) => {
            await mutation.mutateAsync(() =>
              learningRecord(
                `${epicPath(id)}/tasks`,
                s.taskResponseSchema,
                jsonRequest('POST', values),
              ),
            );
            setDialog(null);
          }}
        />
      </Dialog>
      <Dialog open={dialog === 'edit'} title="Edit epic" onClose={close}>
        <EpicForm
          defaults={{
            name: value.name,
            description: value.description,
            targetDate: value.targetDate,
            targetMinutes: value.targetMinutes,
            comment: value.comment ?? '',
          }}
          onCancel={close}
          onSubmit={async (values) => {
            await mutation.mutateAsync(() =>
              learningRecord(
                epicPath(id),
                s.epicResponseSchema,
                jsonRequest('PATCH', { ...values, version: value.version }),
              ),
            );
            setDialog(null);
          }}
        />
      </Dialog>
      <DeleteDialog
        open={dialog === 'delete'}
        title="Delete this epic?"
        onClose={close}
        onDelete={async () => {
          await apiRequest(
            epicPath(id),
            jsonRequest('DELETE', { version: value.version }),
          );
          router.push('/learning');
        }}
      />
      <Dialog
        open={dialog === 'order'}
        title="Reorder all tasks"
        description="Move tasks in their saved order. Filters do not affect this list."
        onClose={close}
      >
        {dialog === 'order' && (
          <OrderForm
            epic={value}
            onClose={() => {
              setDialog(null);
              setStatus('All');
              setSort('Manual order');
              setPage(1);
            }}
          />
        )}
      </Dialog>
    </Frame>
  );
}
function OrderForm({
  epic,
  onClose,
}: {
  epic: s.LearningEpic;
  onClose: () => void;
}) {
  const mutation = useLearningMutation();
  const [ordered, setOrdered] = useState<s.LearningTask[] | null>(null);
  const result = useLearningQuery(['order', epic.id], async () => {
    let page = 1;
    const rows: s.LearningTask[] = [];
    for (;;) {
      const r = await learningRequest(
        `${epicPath(epic.id)}/tasks${queryString({ page, pageSize: 100, status: 'All', sort: 'manual' })}`,
        s.taskListResponseSchema,
      );
      rows.push(...r.data);
      if (rows.length >= r.meta.total) return rows;
      page++;
    }
  });
  // Keep the version paired with the order being edited, including while parent queries refetch.
  const version = useRef(epic.version);
  if (!result.data || result.error)
    return <QueryState error={result.error} retry={result.refetch} />;
  const rows = ordered ?? result.data;
  const move = (index: number, direction: number) => {
    const next = [...rows];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    setOrdered(next);
  };
  return (
    <div className="space-y-5">
      <ol className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {rows.map((task, index) => (
          <li
            key={task.id}
            className="flex min-h-12 items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
              {index + 1}. {task.name}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Button
                aria-label={`Move ${task.name} up`}
                disabled={!index || mutation.isPending}
                variant="ghost"
                className="size-9 rounded-lg p-0 text-base"
                onClick={() => move(index, -1)}
              >
                ↑
              </Button>
              <Button
                aria-label={`Move ${task.name} down`}
                disabled={index === rows.length - 1 || mutation.isPending}
                variant="ghost"
                className="size-9 rounded-lg p-0 text-base"
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
            </span>
          </li>
        ))}
      </ol>
      {mutation.error && (
        <p role="alert" className="-mt-2 text-sm text-rose-700">
          {errorMessage(mutation.error)} Close and reopen to load the current
          order.
        </p>
      )}
      <div className="flex justify-end border-t border-slate-100 pt-4">
        <Button
          disabled={mutation.isPending}
          onClick={() =>
            void mutation
              .mutateAsync(() =>
                learningRecord(
                  `${epicPath(epic.id)}/task-order`,
                  s.epicResponseSchema,
                  jsonRequest('PUT', {
                    version: version.current,
                    taskIds: rows.map((t) => t.id),
                  }),
                ),
              )
              .then(onClose)
              .catch(() => {})
          }
        >
          {mutation.isPending ? 'Saving…' : 'Save order'}
        </Button>
      </div>
    </div>
  );
}

export function TaskDetail({
  epicId,
  taskId,
}: {
  epicId: string;
  taskId: string;
}) {
  const result = useLearningQuery(['task', epicId, taskId], () =>
    learningRecord(taskPath(epicId, taskId), s.taskResponseSchema),
  );
  if (!result.data || result.error)
    return (
      <Frame>
        <QueryState error={result.error} retry={result.refetch} />
      </Frame>
    );
  return <TaskContent key={taskId} task={result.data} />;
}
function TaskContent({ task }: { task: s.LearningTask }) {
  const router = useRouter(),
    timer = useLearningTimer(),
    mutation = useLearningMutation();
  const [dialog, setDialog] = useState<
    'edit' | 'notes' | 'delete' | 'manual' | 'complete' | 'start-status' | null
  >(null);
  const path = taskPath(task.epicId, task.id),
    running = timer.active?.task.id === task.id,
    pending = timer.pending?.task.id === task.id;
  const hasTimer = running || pending,
    paused = running && timer.active?.pausedAt !== null,
    otherTimer = !!(timer.active || timer.pending) && !hasTimer,
    eligible = ['Todo', 'In progress'].includes(task.status),
    canRequestStart = ['Todo', 'In progress', 'Done'].includes(task.status);
  const close = () => {
    if (!mutation.isPending && !timer.busy) setDialog(null);
  };
  const seconds = running ? timer.seconds : 0;
  return (
    <Frame>
      <Link
        href={epicPath(task.epicId)}
        className="text-sm font-semibold text-slate-500 hover:text-slate-950"
      >
        ← {task.epicName}
      </Link>
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {task.name}
            </h1>
            <Status value={task.status} />
          </div>
          <p className="mt-3 text-slate-600">{task.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            disabled={hasTimer}
            onClick={() => setDialog('edit')}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            disabled={hasTimer}
            onClick={() => setDialog('delete')}
          >
            Delete
          </Button>
          <fieldset disabled={hasTimer || mutation.isPending || timer.busy}>
            <Select
              label="Change task status"
              value={task.status}
              options={['Todo', 'In progress', 'Done', 'Blocked', 'Cancelled']}
              onValueChange={(status) =>
                void mutation
                  .mutateAsync(() =>
                    learningRecord(
                      `${path}/status`,
                      s.taskResponseSchema,
                      jsonRequest('PATCH', { version: task.version, status }),
                    ),
                  )
                  .catch(() => {})
              }
            />
          </fieldset>
        </div>
      </div>
      {mutation.error && (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          {errorMessage(mutation.error)}
        </p>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Summary
          label="Target time"
          value={formatMinutes(task.targetMinutes)}
        />
        <Summary
          label="Saved actual time"
          value={formatMinutes(task.actualMinutes)}
        />
        <Summary
          label={task.differenceMinutes > 0 ? 'Over target' : 'Remaining'}
          value={formatMinutes(task.differenceMinutes)}
        />
        <Summary label="Weight" value={String(task.weight)} />
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {Math.round(task.percentageUsed)}% of target time used
      </p>
      <Card className="mt-6 rounded-2xl p-5 text-center sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Current session
        </p>
        <p className="mt-2 font-mono text-5xl font-semibold tracking-tight sm:text-6xl">
          {String(Math.floor(seconds / 3600)).padStart(2, '0')}:
          {String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:
          {String(seconds % 60).padStart(2, '0')}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          {pending
            ? 'A save is pending. Retry it before starting another session.'
            : !eligible
              ? 'Change a blocked or cancelled task to Todo or In progress before working.'
              : running
                ? `${Math.floor(seconds / 60)} unsaved whole minutes`
                : 'Start a session to track time against this task.'}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {!running ? (
            <Button
              disabled={!canRequestStart || otherTimer || pending || timer.busy}
              onClick={() =>
                task.status === 'In progress'
                  ? void timer.start(task)
                  : setDialog('start-status')
              }
            >
              Start
            </Button>
          ) : paused ? (
            <Button
              disabled={timer.busy}
              variant="secondary"
              onClick={timer.resume}
            >
              Resume
            </Button>
          ) : (
            <Button
              disabled={timer.busy}
              variant="secondary"
              onClick={timer.pause}
            >
              Pause
            </Button>
          )}
          <Button
            disabled={!running || timer.busy}
            variant="ghost"
            onClick={() => void timer.finish(task).catch(() => {})}
          >
            Stop &amp; save
          </Button>
          <Button
            disabled={!eligible || otherTimer || pending || timer.busy}
            onClick={() => setDialog('complete')}
          >
            Complete &amp; save
          </Button>
          {pending && (
            <Button
              disabled={timer.busy}
              onClick={() => void timer.retry().catch(() => {})}
            >
              Retry save
            </Button>
          )}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Pause freezes the session. Stop &amp; save, and Complete &amp; save
          save whole minutes. Refreshing or leaving Learning loses unsaved time.
        </p>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">Saved time</h2>
            <Button
              disabled={hasTimer}
              variant="ghost"
              className="min-h-8 rounded-lg px-2.5 text-xs"
              onClick={() => setDialog('manual')}
            >
              + Add manual
            </Button>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {task.sessions} timer sessions · {formatMinutes(task.timerMinutes)}{' '}
            timed · {formatMinutes(task.manualMinutes)} manual
          </p>
          <TimeHistory task={task} locked={hasTimer} />
        </Card>
        <Card className="rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">Notes</h2>
            <Button
              variant="ghost"
              className="min-h-8 rounded-lg px-2.5 text-xs"
              onClick={() => setDialog('notes')}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </Button>
          </div>
          <div className="mt-4 space-y-4 text-sm">
            <p className="whitespace-pre-wrap text-slate-600">
              {task.comment || 'No notes yet.'}
            </p>
          </div>
        </Card>
      </div>
      <Dialog open={dialog === 'edit'} title="Edit task" onClose={close}>
        <TaskForm
          defaults={{
            name: task.name,
            description: task.description,
            targetMinutes: task.targetMinutes,
            weight: task.weight,
            comment: task.comment ?? '',
          }}
          onCancel={close}
          onSubmit={async (values) => {
            await mutation.mutateAsync(() =>
              learningRecord(
                path,
                s.taskResponseSchema,
                jsonRequest('PATCH', { ...values, version: task.version }),
              ),
            );
            setDialog(null);
          }}
        />
      </Dialog>
      <Dialog open={dialog === 'notes'} title="Edit notes" onClose={close}>
        <NotesForm
          comment={task.comment}
          onSubmit={(values) =>
            mutation
              .mutateAsync(() =>
                learningRecord(
                  path,
                  s.taskResponseSchema,
                  jsonRequest('PATCH', { ...values, version: task.version }),
                ),
              )
              .then(() => setDialog(null))
          }
        />
      </Dialog>
      <Dialog
        open={dialog === 'manual'}
        title="Add manual time"
        onClose={close}
      >
        {dialog === 'manual' && (
          <CreateManual task={task} onClose={() => setDialog(null)} />
        )}
      </Dialog>
      <Dialog
        open={dialog === 'complete'}
        title="Complete task"
        description="Any active timer time is saved together with completion."
        onClose={close}
      >
        <NotesForm
          submitLabel="Complete & save"
          comment={task.comment}
          onSubmit={async (notes) => {
            await timer.finish(task, true, notes);
            setDialog(null);
          }}
        />
      </Dialog>
      <Dialog
        open={dialog === 'start-status'}
        title={
          task.status === 'Done'
            ? 'Task is already done'
            : 'Move task to In progress?'
        }
        description={
          task.status === 'Done'
            ? 'Completed tasks cannot be restarted.'
            : 'A timer can only be started for a task that is In progress.'
        }
        onClose={close}
      >
        {task.status === 'Done' ? (
          <div className="flex justify-end">
            <Button variant="secondary" onClick={close}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              disabled={mutation.isPending || timer.busy}
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              disabled={mutation.isPending || timer.busy}
              onClick={() =>
                void mutation
                  .mutateAsync(() =>
                    learningRecord(
                      `${path}/status`,
                      s.taskResponseSchema,
                      jsonRequest('PATCH', {
                        version: task.version,
                        status: 'In progress',
                      }),
                    ),
                  )
                  .then(() => timer.start(task))
                  .then(() => setDialog(null))
                  .catch(() => {})
              }
            >
              Move to In progress &amp; start
            </Button>
          </div>
        )}
      </Dialog>
      <DeleteDialog
        open={dialog === 'delete'}
        title="Delete this task?"
        onClose={close}
        onDelete={async () => {
          await apiRequest(
            path,
            jsonRequest('DELETE', { version: task.version }),
          );
          router.push(epicPath(task.epicId));
        }}
      />
    </Frame>
  );
}
function CreateManual({
  task,
  onClose,
}: {
  task: s.LearningTask;
  onClose: () => void;
}) {
  const mutation = useLearningMutation(),
    id = useRef(crypto.randomUUID());
  return (
    <ManualForm
      onCancel={onClose}
      onSubmit={async (values) => {
        await mutation.mutateAsync(() =>
          learningRecord(
            `${taskPath(task.epicId, task.id)}/times`,
            s.timeResponseSchema,
            jsonRequest('POST', {
              type: 'manual',
              ...values,
              id: id.current,
              version: task.version,
            }),
          ),
        );
        onClose();
      }}
    />
  );
}
function TimeHistory({
  task,
  locked,
}: {
  task: s.LearningTask;
  locked: boolean;
}) {
  const [editing, setEditing] = useState<s.LearningTime | null>(null),
    [deleting, setDeleting] = useState<s.LearningTime | null>(null);
  const mutation = useLearningMutation(),
    path = taskPath(task.epicId, task.id);
  const times = useLearningQuery(['times', task.id], () =>
    learningRequest(
      `${path}/times${queryString({ page: 1, pageSize: 100 })}`,
      s.timeListResponseSchema,
    ),
  );
  const activities = [
    ...(times.data?.data ?? []).map((row) => ({
      id: row.id,
      date:
        row.type === 'stopwatch' ? row.startedAt : `${row.date}T00:00:00.000Z`,
      duration: row.type === 'stopwatch' ? row.durationMinutes : row.minutes,
      kind:
        row.type === 'stopwatch' ? ('Stopwatch' as const) : ('Manual' as const),
      time: row,
    })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return (
    <div className="mt-5 text-sm">
      {times.error ? (
        <QueryState error={times.error} retry={() => void times.refetch()} />
      ) : !times.data ? (
        <p className="py-4 text-slate-500">Loading saved time…</p>
      ) : activities.length ? (
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {activities.map((activity) => (
            <li key={`${activity.kind}-${activity.id}`} className="px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-slate-700">
                    {activity.kind} time · {formatMinutes(activity.duration)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(activity.date).toLocaleString()}
                  </p>
                </div>
                {activity.time && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      disabled={locked}
                      variant="ghost"
                      className="min-h-8 rounded-lg px-2 text-xs"
                      onClick={() => setEditing(activity.time)}
                    >
                      Edit
                    </Button>
                    <Button
                      disabled={locked}
                      variant="ghost"
                      className="min-h-8 rounded-lg px-2 text-xs text-rose-700"
                      onClick={() => setDeleting(activity.time)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-slate-500">No saved time yet.</p>
      )}
      <Dialog
        open={!!editing}
        title="Edit saved time"
        onClose={() => {
          if (!mutation.isPending) setEditing(null);
        }}
      >
        {editing?.type === 'manual' && (
          <ManualForm
            defaults={{
              date: editing.date,
              minutes: editing.minutes,
            }}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await mutation.mutateAsync(() =>
                learningRecord(
                  `${path}/times/${editing.id}`,
                  s.timeResponseSchema,
                  jsonRequest('PATCH', {
                    type: 'manual',
                    ...values,
                    version: task.version,
                    entryVersion: editing.version,
                  }),
                ),
              );
              setEditing(null);
            }}
          />
        )}
        {editing?.type === 'stopwatch' && (
          <StopwatchForm
            defaults={{ minutes: editing.durationMinutes }}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await mutation.mutateAsync(() =>
                learningRecord(
                  `${path}/times/${editing.id}`,
                  s.timeResponseSchema,
                  jsonRequest('PATCH', {
                    type: 'stopwatch',
                    ...values,
                    version: task.version,
                    entryVersion: editing.version,
                  }),
                ),
              );
              setEditing(null);
            }}
          />
        )}
      </Dialog>
      <DeleteDialog
        open={!!deleting}
        title="Delete saved time?"
        onClose={() => setDeleting(null)}
        onDelete={async () => {
          if (deleting)
            await apiRequest(
              `${path}/times/${deleting.id}`,
              jsonRequest('DELETE', {
                version: task.version,
                entryVersion: deleting.version,
              }),
            );
        }}
      />
    </div>
  );
}
