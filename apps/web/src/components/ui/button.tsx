import Link from 'next/link';
import type { ComponentProps } from 'react';

type ButtonVariant = 'default' | 'secondary' | 'ghost';

const variants: Record<ButtonVariant, string> = {
  default:
    'bg-slate-950 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-950',
  secondary:
    'border border-slate-200 bg-white text-slate-950 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-950',
  ghost:
    'text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-950',
};

const baseClassName =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]';

export function ButtonLink({
  href,
  variant = 'default',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link
      href={href}
      className={`${baseClassName} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Button({
  variant = 'default',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`${baseClassName} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
