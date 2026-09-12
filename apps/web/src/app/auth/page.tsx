'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

type Mode = 'login' | 'signup';
type FormErrors = Record<string, string>;

const inputClassName =
  'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClassName} mt-2 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : ''}`}
      />
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-xs text-red-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validate(mode: Mode, formData: FormData): FormErrors {
  const errors: FormErrors = {};
  const value = (name: string) => String(formData.get(name) ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (mode === 'login' && !value('identifier')) {
    errors.identifier = 'Enter your email, phone, or username.';
  }
  if (mode === 'signup') {
    if (!value('username')) errors.username = 'Enter a username.';
    if (!value('email') || !/^\S+@\S+\.\S+$/.test(value('email'))) {
      errors.email = 'Enter a valid email address.';
    }
    if (!value('phone')) errors.phone = 'Enter a phone number.';
  }
  if (!password) errors.password = 'Enter your password.';
  else if (password.length < 8) errors.password = 'Use at least 8 characters.';
  if (
    mode === 'signup' &&
    password !== String(formData.get('confirmPassword') ?? '')
  ) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(mode, new FormData(event.currentTarget));
    setErrors(nextErrors);
    // Backend authentication will be connected here later.
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setErrors({});
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

        <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
          {mode === 'login' ? (
            <Field
              id="identifier"
              label="Email, phone, or username"
              autoComplete="username"
              placeholder="you@example.com"
              error={errors.identifier}
            />
          ) : (
            <>
              <Field
                id="username"
                label="Username"
                autoComplete="username"
                placeholder="yourname"
                error={errors.username}
              />
              <Field
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email}
              />
              <Field
                id="phone"
                label="Phone"
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
          <Button type="submit" className="w-full">
            {mode === 'login' ? 'Log in' : 'Create account'}
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
