'use client';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
  useMutation,
} from '@tanstack/react-query';
import {
  type LearningTask,
  type SessionInput,
  type CompleteInput,
  taskResponseSchema,
} from '@personally/validation';
import { ProtectedRoute, useAuth } from '../../components/auth';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import {
  getTask,
  taskPath,
  learningRecord,
  jsonRequest,
} from '../../lib/api/learning';
import { ApiError } from '../../lib/api/client';

export function LearningProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      <AccountLearning key={user?.id} userId={user?.id ?? ''}>
        {children}
      </AccountLearning>
    </ProtectedRoute>
  );
}
function AccountLearning({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15000,
            retry: (count, error) =>
              !(
                error instanceof ApiError && [401, 404].includes(error.status)
              ) && count < 1,
          },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  return (
    <QueryClientProvider client={client}>
      <UserKey.Provider value={userId}>
        <TimerProvider>{children}</TimerProvider>
      </UserKey.Provider>
    </QueryClientProvider>
  );
}
const UserKey = createContext('');
export function useLearningQuery<T>(
  key: readonly unknown[],
  fn: () => Promise<T>,
) {
  const user = useContext(UserKey);
  return useQuery({ queryKey: ['learning', user, ...key], queryFn: fn });
}
export function useLearningMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSettled: () => client.invalidateQueries({ queryKey: ['learning'] }),
  });
}
export function errorMessage(error: unknown) {
  return error instanceof ApiError && error.status === 401
    ? 'Your session expired. Sign in again.'
    : error instanceof Error
      ? error.message
      : 'Unable to save. Please try again.';
}

type Active = {
  task: LearningTask;
  startedAt: number;
  sessionId: string;
  pausedAt: number | null;
};
type Pending = {
  task: LearningTask;
  session?: SessionInput;
  complete: boolean;
  notes?: Pick<CompleteInput, 'comment'>;
};
type TimerValue = {
  active: Active | null;
  pending: Pending | null;
  seconds: number;
  busy: boolean;
  error: string;
  message: string;
  start: (task: LearningTask) => Promise<void>;
  pause: () => void;
  resume: () => void;
  finish: (
    task: LearningTask,
    complete?: boolean,
    notes?: Pending['notes'],
  ) => Promise<void>;
  retry: () => Promise<void>;
  discard: () => void;
};
const TimerContext = createContext<TimerValue | null>(null);
export function useLearningTimer() {
  const value = useContext(TimerContext);
  if (!value) throw new Error('Learning timer requires its provider');
  return value;
}
function TimerProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [active, setActive] = useState<Active | null>(null),
    [pending, setPending] = useState<Pending | null>(null),
    [now, setNow] = useState(Date.now()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [showDiscard, setShowDiscard] = useState(false);
  const activeRef = useRef<Active | null>(null),
    pendingRef = useRef<Pending | null>(null),
    locked = useRef(false);
  const changeActive = (value: Active | null) => {
    activeRef.current = value;
    setActive(value);
  };
  const changePending = (value: Pending | null) => {
    pendingRef.current = value;
    setPending(value);
  };
  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [active]);
  useEffect(() => {
    if (!active && !pending) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [active, pending]);
  async function save(value: Pending) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const latest = await getTask(value.task.epicId, value.task.id);
      if (value.complete)
        await learningRecord(
          `${taskPath(latest.epicId, latest.id)}/complete`,
          taskResponseSchema,
          jsonRequest('POST', {
            version: latest.version,
            session: value.session,
            ...value.notes,
          }),
        );
      else if (value.session)
        await learningRecord(
          `${taskPath(latest.epicId, latest.id)}/times`,
          taskResponseSchema,
          jsonRequest('POST', {
            version: latest.version,
            type: 'stopwatch',
            ...value.session,
          }),
        );
      changePending(null);
      setMessage(
        value.complete
          ? 'Task completed.'
          : value.session
            ? 'Time saved.'
            : 'No whole minute elapsed; no time was saved.',
      );
    } catch (e) {
      setError(errorMessage(e));
      throw e;
    } finally {
      await client.invalidateQueries({ queryKey: ['learning'] });
      locked.current = false;
      setBusy(false);
    }
  }
  async function start(task: LearningTask) {
    if (locked.current || activeRef.current || pendingRef.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      let current = await getTask(task.epicId, task.id);
      if (!['Todo', 'In progress'].includes(current.status))
        throw new Error(
          'Change the task to Todo or In progress before starting.',
        );
      if (current.status === 'Todo')
        current = await learningRecord(
          `${taskPath(task.epicId, task.id)}/status`,
          taskResponseSchema,
          jsonRequest('PATCH', {
            version: current.version,
            status: 'In progress',
          }),
        );
      const startedAt = Date.now();
      setNow(startedAt);
      changeActive({
        task: current,
        startedAt,
        sessionId: crypto.randomUUID(),
        pausedAt: null,
      });
      await client.invalidateQueries({ queryKey: ['learning'] });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function pause() {
    const current = activeRef.current;
    if (!current || current.pausedAt !== null) return;
    changeActive({ ...current, pausedAt: Date.now() });
  }
  function resume() {
    const current = activeRef.current;
    if (!current || current.pausedAt === null) return;
    const pausedDuration = Date.now() - current.pausedAt;
    changeActive({
      ...current,
      startedAt: current.startedAt + pausedDuration,
      pausedAt: null,
    });
    setNow(Date.now());
  }
  async function finish(
    task: LearningTask,
    complete = false,
    notes?: Pending['notes'],
  ) {
    if (locked.current) return;
    if (pendingRef.current) {
      await save(pendingRef.current);
      return;
    }
    const running = activeRef.current;
    if (running && running.task.id !== task.id)
      throw new Error('Save the active task timer first.');
    const endedAt = running?.pausedAt ?? Date.now(),
      elapsedMilliseconds = running ? endedAt - running.startedAt : 0,
      durationMinutes = running ? Math.ceil(elapsedMilliseconds / 60000) : 0;
    const value: Pending = {
      task,
      complete,
      notes,
      session:
        running && elapsedMilliseconds > 0
          ? {
              id: running.sessionId,
              startedAt: new Date(running.startedAt).toISOString(),
              endedAt: new Date(endedAt).toISOString(),
              durationMinutes,
            }
          : undefined,
    };
    changeActive(null);
    changePending(value);
    await save(value);
  }
  const seconds = active
    ? Math.max(
        0,
        Math.floor(((active.pausedAt ?? now) - active.startedAt) / 1000),
      )
    : 0;
  const value: TimerValue = {
    active,
    pending,
    seconds,
    busy,
    error,
    message,
    start,
    pause,
    resume,
    finish,
    retry: async () => {
      if (pendingRef.current) await save(pendingRef.current);
    },
    discard: () => setShowDiscard(true),
  };
  return (
    <TimerContext.Provider value={value}>
      {error && (
        <p
          role="alert"
          className="mx-auto mt-3 max-w-7xl px-5 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {children}
      <Dialog
        open={showDiscard}
        title="Discard unsaved timer time?"
        description="Saved time stays in your task. The current unsaved interval will be lost."
        onClose={() => setShowDiscard(false)}
      >
        <Button
          variant="destructive"
          onClick={() => {
            changeActive(null);
            changePending(null);
            setError('');
            setShowDiscard(false);
          }}
        >
          Discard unsaved time
        </Button>
      </Dialog>
    </TimerContext.Provider>
  );
}
