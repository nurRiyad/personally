import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in or create your private Personally workspace.',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
