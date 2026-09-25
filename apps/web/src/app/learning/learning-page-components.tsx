import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import { ApiError } from '../../lib/api/client';
import { errorMessage, useLearningMutation } from './learning-provider';

export function LearningFrame({ children }: { children: ReactNode }) {
  return (
    <main
      id="main-content"
      className="page-transition mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 sm:py-8"
    >
      {children}
    </main>
  );
}

export function LearningQueryState({
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

export function LearningEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="px-6 py-12 text-center text-sm text-slate-500">{children}</p>
  );
}

export function LearningDeleteDialog({
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
          variant="destructive"
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
