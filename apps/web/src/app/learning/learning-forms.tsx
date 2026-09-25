'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  learningEpicSchema,
  learningTaskSchema,
  manualTimeSchema,
  stopwatchTimeEditSchema,
  taskPatchSchema,
  type LearningEpicInput,
  type LearningTaskInput,
  type ManualInput,
} from '@personally/validation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Calendar } from '../../components/ui/calendar';
import { ApiError } from '../../lib/api/client';
import { errorMessage } from './learning-provider';

type Values = Record<string, string | number | null>;
type Field = {
  name: string;
  label: string;
  type?: string;
  optional?: boolean;
  max?: number;
};
type Schema<T> = {
  safeParse(values: unknown):
    | { success: true; data: T }
    | {
        success: false;
        error: { issues: { path: (string | number)[]; message: string }[] };
      };
};
export function LearningForm<T>({
  fields,
  defaults,
  schema,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: {
  fields: Field[];
  defaults?: Values;
  schema: Schema<T>;
  onSubmit: (values: T) => Promise<unknown>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const form = useForm<Values>({ defaultValues: defaults }),
    id = useId();
  const locked = useRef(false);
  const [saved, setSaved] = useState(false);
  const { errors, isSubmitting, isDirty } = form.formState;
  const defaultsKey = JSON.stringify(defaults);
  useEffect(() => {
    if (!form.formState.isDirty) form.reset(defaults);
  }, [defaultsKey, form]);
  async function submit(values: Values) {
    if (locked.current) return;
    form.clearErrors();
    setSaved(false);
    const normalized = { ...values };
    for (const field of fields)
      if (field.optional && normalized[field.name] === '')
        normalized[field.name] = null;
    const result = schema.safeParse(normalized);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = fields.find(
          (item) => item.name === String(issue.path[0]),
        );
        const value = field ? normalized[field.name] : undefined;
        const message =
          field && !field.optional && (value === '' || value == null)
            ? `${field.label} is required.`
            : issue.message;
        form.setError(String(issue.path[0]), { message });
      }
      return;
    }
    locked.current = true;
    try {
      await onSubmit(result.data);
      form.reset(values);
      setSaved(true);
    } catch (error) {
      if (error instanceof ApiError && error.fields)
        for (const [field, messages] of Object.entries(error.fields))
          form.setError(field, { message: messages.join(' ') });
      form.setError('root', { message: errorMessage(error) });
    } finally {
      locked.current = false;
    }
  }
  return (
    <form
      aria-busy={isSubmitting}
      onSubmit={form.handleSubmit(submit)}
      className="space-y-5"
      noValidate
    >
      <fieldset disabled={isSubmitting} className="space-y-5">
        {fields.map((field) => {
          const inputId = `${id}-${field.name}`,
            error = errors[field.name];
          const props = {
            ...form.register(field.name),
            id: inputId,
            required: !field.optional,
            'aria-invalid': !!error,
            'aria-describedby': error ? `${inputId}-error` : undefined,
            maxLength: field.max,
            min: field.type === 'number' ? 1 : undefined,
            inputMode:
              field.type === 'number' ? ('numeric' as const) : undefined,
            className: error ? 'border-rose-300 bg-rose-50/30' : undefined,
          };
          return (
            <div key={field.name}>
              <label
                htmlFor={inputId}
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                {field.label}
                {field.optional ? ' (optional)' : ''}
              </label>
              {field.type === 'textarea' ? (
                <Textarea {...props} />
              ) : field.type === 'date' ? (
                <Controller
                  control={form.control}
                  name={field.name}
                  render={({ field: controllerField }) => (
                    <Calendar
                      id={inputId}
                      name={controllerField.name}
                      value={String(controllerField.value ?? '')}
                      onChange={controllerField.onChange}
                      disabled={isSubmitting}
                      aria-invalid={!!error}
                      aria-describedby={error ? `${inputId}-error` : undefined}
                    />
                  )}
                />
              ) : (
                <Input {...props} type={field.type ?? 'text'} />
              )}
              {error && (
                <p
                  id={`${inputId}-error`}
                  role="alert"
                  className="mt-1.5 text-xs leading-4 text-rose-700"
                >
                  {String(error.message)}
                </p>
              )}
            </div>
          );
        })}
      </fieldset>
      {errors.root && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {errors.root.message}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        {!onCancel && (
          <span
            role="status"
            aria-live="polite"
            className="mr-auto text-xs text-slate-500"
          >
            {isDirty ? 'Unsaved changes' : saved ? 'Saved' : ''}
          </span>
        )}
        {onCancel && (
          <Button
            disabled={isSubmitting}
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
const common: Field[] = [
  { name: 'name', label: 'Name', max: 120 },
  { name: 'description', label: 'Description', type: 'textarea', max: 500 },
  { name: 'targetMinutes', label: 'Target minutes', type: 'number' },
];
export function EpicForm({
  defaults,
  onSubmit,
  onCancel,
}: {
  defaults?: Values;
  onSubmit: (value: LearningEpicInput) => Promise<unknown>;
  onCancel: () => void;
}) {
  return (
    <LearningForm
      fields={[
        ...common,
        { name: 'targetDate', label: 'Target completion date', type: 'date' },
        {
          name: 'comment',
          label: 'Epic comment',
          type: 'textarea',
          optional: true,
          max: 500,
        },
      ]}
      defaults={defaults ?? { comment: '' }}
      schema={learningEpicSchema}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}
export function TaskForm({
  defaults,
  onSubmit,
  onCancel,
}: {
  defaults?: Values;
  onSubmit: (value: LearningTaskInput) => Promise<unknown>;
  onCancel: () => void;
}) {
  return (
    <LearningForm
      fields={[
        ...common,
        { name: 'weight', label: 'Weight (1–10)', type: 'number' },
        {
          name: 'comment',
          label: 'Notes',
          type: 'textarea',
          optional: true,
          max: 500,
        },
      ]}
      defaults={defaults ?? { weight: 1, comment: '' }}
      schema={learningTaskSchema}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}
export function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function ManualForm({
  defaults,
  onSubmit,
  onCancel,
}: {
  defaults?: Values;
  onSubmit: (value: ManualInput) => Promise<unknown>;
  onCancel: () => void;
}) {
  return (
    <LearningForm
      fields={[
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'minutes', label: 'Duration in minutes', type: 'number' },
      ]}
      defaults={defaults ?? { date: localDate() }}
      schema={manualTimeSchema}
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitLabel="Save time"
    />
  );
}
export function StopwatchForm({
  defaults,
  onSubmit,
  onCancel,
}: {
  defaults: { minutes: number };
  onSubmit: (value: { minutes: number }) => Promise<unknown>;
  onCancel: () => void;
}) {
  return (
    <LearningForm
      fields={[
        { name: 'minutes', label: 'Duration in minutes', type: 'number' },
      ]}
      defaults={defaults}
      schema={stopwatchTimeEditSchema}
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitLabel="Save time"
    />
  );
}
export function NotesForm({
  comment,
  onSubmit,
  submitLabel = 'Save notes',
}: {
  comment: string | null | undefined;
  submitLabel?: string;
  onSubmit: (values: { comment?: string | null }) => Promise<unknown>;
}) {
  return (
    <LearningForm
      fields={[
        {
          name: 'comment',
          label: 'Notes',
          type: 'textarea',
          optional: true,
          max: 500,
        },
      ]}
      defaults={{
        comment: comment ?? '',
      }}
      schema={taskPatchSchema.omit({ version: true })}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
    />
  );
}
