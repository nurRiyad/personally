import type { ComponentProps } from 'react';

export function Card({ className = '', ...props }: ComponentProps<'article'>) {
  return (
    <article
      className={`rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)] ${className}`}
      {...props}
    />
  );
}
