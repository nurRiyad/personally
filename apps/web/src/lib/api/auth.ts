import {
  authTokenResponseSchema,
  meResponseSchema,
  type LoginRequest,
  type RegisterRequest,
} from '@personally/validation';
import { apiRequest } from './client';

export type AuthUser = ReturnType<
  typeof authTokenResponseSchema.parse
>['data']['user'];

export async function register(input: RegisterRequest) {
  return authTokenResponseSchema.parse(
    await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  ).data;
}

export async function login(input: LoginRequest) {
  return authTokenResponseSchema.parse(
    await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  ).data;
}

export async function getCurrentUser() {
  return meResponseSchema.parse(await apiRequest('/auth/me')).data.user;
}

export function logout() {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}
