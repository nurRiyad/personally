import type { ComponentProps } from 'react';
export function Textarea({
  className = '',
  ...props
}: ComponentProps<'textarea'>) {
  return (
    <textarea
      {...props}
      className={`min-h-20 w-full rounded-lg border border-slate-200 bg-white p-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:opacity-50 ${className}`}
    />
  );
}
