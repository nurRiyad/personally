'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getCurrentUser,
  login,
  logout,
  register,
  type AuthUser,
} from '../../lib/api/auth';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../../lib/auth/storage';
import type { LoginRequest, RegisterRequest } from '@personally/validation';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  signIn(input: LoginRequest): Promise<AuthUser>;
  signUp(input: RegisterRequest): Promise<AuthUser>;
  signOut(): Promise<void>;
  refresh(): Promise<AuthUser | null>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus('authenticated');
      return currentUser;
    } catch {
      clearAccessToken();
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (input: LoginRequest) => {
    const result = await login(input);
    setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
    return result.user;
  }, []);
  const signUp = useCallback(async (input: RegisterRequest) => {
    const result = await register(input);
    setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
    return result.user;
  }, []);
  const signOut = useCallback(async () => {
    try {
      if (getAccessToken()) await logout();
    } finally {
      clearAccessToken();
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);
  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut, refresh }),
    [user, status, signIn, signUp, signOut, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
