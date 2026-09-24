import * as s from '@personally/validation';
import { apiRequest } from './client';
const rec = <T>(
  path: string,
  schema: { parse(v: unknown): T },
  init?: RequestInit,
) =>
  apiRequest<{ data: unknown }>(path, init).then((r) => schema.parse(r.data));
const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
export const getBudget = (month: string) =>
  rec(
    `/budget/months/${encodeURIComponent(month)}`,
    s.budgetMonthResponseSchema,
  );
export const listBudgets = (year: number) =>
  apiRequest<{
    data: Array<{ month: string; summary: unknown; version: number }>;
  }>(`/budget/months?year=${year}`).then((x) => x.data);
export const createBudget = (month: string) =>
  rec('/budget/months', s.budgetMonthResponseSchema, json('POST', { month }));
export const budgetRequest = <T>(path: string, body: unknown) =>
  rec(path, s.budgetMonthResponseSchema, json('POST', body));
export const budgetPatch = (path: string, body: unknown) =>
  rec(path, s.budgetMonthResponseSchema, json('PATCH', body));
export const budgetDelete = (path: string, body: unknown) =>
  rec(path, s.budgetMonthResponseSchema, json('DELETE', body));
