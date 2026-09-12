import type { ComponentProps } from 'react';

type AvatarProps = ComponentProps<'span'> & {
  fallback: string;
};

export function Avatar({ fallback, className = '', ...props }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-700 ${className}`}
      {...props}
    >
      {fallback.slice(0, 1).toUpperCase()}
    </span>
  );
}
