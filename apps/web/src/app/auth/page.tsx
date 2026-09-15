'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth, safeReturnTo } from '../../components/auth';
import { ApiError } from '../../lib/api/client';
import {
  loginRequestSchema,
  registerRequestSchema,
} from '@personally/validation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

type Mode = 'login' | 'signup';
function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  placeholder,
  registration,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  error?: { message?: string };
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === 'password';

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="relative mt-2">
        <Input
          {...registration}
          id={id}
          type={isPasswordField && isPasswordVisible ? 'text' : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`rounded-2xl px-4 ${isPasswordField ? 'pr-12' : ''} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : ''}`}
        />
        {isPasswordField ? (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-2xl text-slate-500 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset"
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-xs text-red-600"
        >
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.94 10.94 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.94 10.94 0 0 1-19.88 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c5 0 8.73 3.11 10 7a11.8 11.8 0 0 1-2.16 3.19M6.61 6.61A11.8 11.8 0 0 0 2 12c1.27 3.89 5 7 10 7a10.43 10.43 0 0 0 4.27-.92" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [formError, setFormError] = useState('');
  const form = useForm<Record<string, string>>({ mode: 'onBlur' });
  const { register, handleSubmit, setError, clearErrors, formState } = form;
  const errors = formState.errors;
  const { status, signIn, signUp } = useAuth();
  const router = useRouter();
  const [returnTo, setReturnTo] = useState('/');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('mode') === 'signup') {
      setMode('signup');
    }
    const requestedReturnTo = searchParams.get('returnTo');
    setReturnTo(requestedReturnTo ? safeReturnTo(requestedReturnTo) : '/');
  }, []);

  useEffect(() => {
    if (status === 'authenticated') router.replace(returnTo);
  }, [returnTo, router, status]);

  async function submit(values: Record<string, string>) {
    clearErrors();
    setFormError('');
    const request =
      mode === 'login'
        ? loginRequestSchema.safeParse(values)
        : registerRequestSchema.safeParse(values);
    if (!request.success) {
      setFormError('Please check the highlighted fields.');
      for (const issue of request.error.issues)
        setError(String(issue.path[0]), { message: issue.message });
      return;
    }
    try {
      if (mode === 'login') {
        await signIn(loginRequestSchema.parse(values));
      } else {
        await signUp(registerRequestSchema.parse(values));
      }
      router.replace(returnTo);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.fields) {
        for (const [key, messages] of Object.entries(error.fields))
          setError(key, { message: messages[0] ?? 'Invalid value.' });
      } else {
        setFormError(
          error instanceof ApiError
            ? error.message
            : 'Something went wrong. Please try again.',
        );
      }
    } finally {
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    clearErrors();
    setFormError('');
  }

  return (
    <main className="page-transition flex flex-1 items-center justify-center bg-[#f8faf8] px-5 py-12 sm:px-8 sm:py-20">
      <Card className="w-full max-w-md p-7 sm:p-9">
        <div className="text-center">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-slate-950"
          >
            Personally
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            {mode === 'login' ? 'Welcome back' : 'Start with clarity'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            {mode === 'login'
              ? 'Sign in to your workspace'
              : 'Create your account'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {mode === 'login'
              ? 'Keep your budget, assets, and learning in view.'
              : 'Make space for the life you are building.'}
          </p>
        </div>

        <form
          className="mt-8 space-y-5"
          noValidate
          onSubmit={handleSubmit(submit)}
        >
          {mode === 'login' ? (
            <Field
              id="identifier"
              label="Email, phone, or username"
              registration={register('identifier')}
              autoComplete="username"
              placeholder="you@example.com"
              error={errors.identifier}
            />
          ) : (
            <>
              <Field
                id="username"
                label="Username"
                registration={register('username')}
                autoComplete="username"
                placeholder="yourname"
                error={errors.username}
              />
              <Field
                id="email"
                label="Email"
                registration={register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email}
              />
              <Field
                id="phone"
                label="Phone"
                registration={register('phone')}
                type="tel"
                autoComplete="tel"
                placeholder="+1 555 000 0000"
                error={errors.phone}
              />
            </>
          )}
          <Field
            id="password"
            label="Password"
            registration={register('password')}
            type="password"
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            error={errors.password}
          />
          {mode === 'signup' ? (
            <Field
              id="confirmPassword"
              label="Confirm password"
              registration={register('confirmPassword')}
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword}
            />
          ) : null}
          {mode === 'login' ? (
            <div className="text-right">
              <button
                type="button"
                className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          ) : null}
          {formError ? (
            <p
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={formState.isSubmitting}
            className="w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {formState.isSubmitting
              ? mode === 'login'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </Button>
        </form>

        <p className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
          {mode === 'login' ? 'New to Personally?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            {mode === 'login' ? 'Create a new account' : 'Sign in'}
          </button>
        </p>
      </Card>
    </main>
  );
}
