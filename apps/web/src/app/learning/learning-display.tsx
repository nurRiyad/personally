import Link from 'next/link';
import type { LearningEpic, LearningTask } from '@personally/validation';
import { Card } from '../../components/ui/card';
export function formatMinutes(minutes: number) {
  const value = Math.round(Math.abs(minutes));
  const hours = Math.floor(value / 60),
    rest = value % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ''}` : `${rest}m`;
}
const statusStyles: Record<string, string> = {
  Todo: 'bg-slate-100 text-slate-600',
  'In progress': 'bg-amber-100 text-amber-800',
  Done: 'bg-emerald-100 text-emerald-800',
  Blocked: 'bg-rose-100 text-rose-800',
  Cancelled: 'bg-slate-100 text-slate-400',
};
export function Status({ value }: { value: string }) {
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

export function Summary({ label, value }: { label: string; value: string }) {
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
export function EpicCard({ epic }: { epic: LearningEpic }) {
  const progress = epic.progress;
  const actual = epic.actualMinutes;
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
              <Status value={epic.status} />
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
              {shortDateFormatter.format(
                new Date(`${epic.targetDate}T12:00:00`),
              )}
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

export function TaskRow({
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
