'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { ProtectedRoute, useAuth } from '../../components/auth';
import { ApiError } from '../../lib/api/client';

export function AssetsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      <AccountAssets key={user?.id}>{children}</AccountAssets>
    </ProtectedRoute>
  );
}

function AccountAssets({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15000,
            retry: (count, error) =>
              !(
                error instanceof ApiError && [401, 404].includes(error.status)
              ) && count < 1,
          },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
