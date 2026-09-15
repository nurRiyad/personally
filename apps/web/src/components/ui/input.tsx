import type { ComponentProps } from 'react';
export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className={`min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:opacity-50 ${className}`}
    />
  );
}
