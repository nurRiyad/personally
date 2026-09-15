import * as s from '@personally/validation';
import { apiRequest } from './client';

export const epicPath = (id: string) =>
  `/learning/epics/${encodeURIComponent(id)}`;
export const taskPath = (epic: string, id: string) =>
  `${epicPath(epic)}/tasks/${encodeURIComponent(id)}`;
export async function learningRequest<T>(
  path: string,
  schema: { parse(value: unknown): T },
  init?: RequestInit,
) {
  return schema.parse(await apiRequest<unknown>(path, init));
}
export async function learningRecord<T>(
  path: string,
  schema: { parse(value: unknown): T },
  init?: RequestInit,
) {
  const response = await apiRequest<{ data: unknown }>(path, init);
  return schema.parse(response.data);
}
export const getTask = (epic: string, id: string) =>
  learningRecord(taskPath(epic, id), s.taskResponseSchema);
export const jsonRequest = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
export const queryString = (values: Record<string, string | number>) =>
  `?${new URLSearchParams(Object.entries(values).map(([key, value]) => [key, String(value)]))}`;
