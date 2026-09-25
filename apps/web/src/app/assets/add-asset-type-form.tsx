'use client';

import { assetTypeDraftSchema } from '@personally/validation';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export function AddAssetTypeForm({
  onCancel,
  onAdd,
}: {
  onCancel: () => void;
  onAdd: (name: string) => void;
}) {
  const form = useForm({ defaultValues: { name: '' } });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((value) => {
        const parsed = assetTypeDraftSchema.safeParse(value);
        if (!parsed.success) {
          form.setError('name', { message: parsed.error.issues[0]?.message });
          return;
        }
        onAdd(parsed.data.name);
      })}
      noValidate
    >
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-2 block">Type name</span>
        <Input
          autoComplete="off"
          placeholder="e.g. Gold, Business, or Agricultural land…"
          {...form.register('name')}
        />
        <p className="mt-1 text-xs text-red-600" role="alert">
          {form.formState.errors.name?.message}
        </p>
      </label>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create type</Button>
      </div>
    </form>
  );
}
