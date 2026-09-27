import * as s from '@personally/validation';
import { apiRequest } from './client';

const record = <T>(
  path: string,
  schema: { parse(value: unknown): T },
  init?: RequestInit,
) =>
  apiRequest<{ data: unknown }>(path, init).then((response) =>
    schema.parse(response.data),
  );
const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const search = (
  values: Record<string, string | number | boolean | undefined>,
) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== '') params.set(key, String(value));
  const query = params.toString();
  return query ? `?${query}` : '';
};

export type AssetType = s.AssetTypeResponse;
export type AssetRecord = s.AssetResponse;
export type AssetActivity = s.AssetActivityResponse;
export type AssetActivityInput = s.AssetActivityInput;
export type AssetCreateInput = s.AssetCreateInput;
export type AssetTypeInput = s.AssetTypeInput;
export type AssetPatchInput = s.AssetPatchInput;
export type AssetActivityEndpoint = s.AssetActivityEndpoint;
export type AssetDashboard = s.AssetDashboardResponse;
export type AssetDetail = s.AssetDetailResponse;

export const assetsKey = ['assets'] as const;
export const getAssetTypes = () =>
  record('/assets/types', s.assetTypesResponseSchema);
export const createAssetType = (input: AssetTypeInput) =>
  record('/assets/types', s.assetTypeResponseSchema, json('POST', input));
export const patchAssetType = (id: string, input: AssetTypeInput) =>
  record(
    `/assets/types/${id}`,
    s.assetTypeResponseSchema,
    json('PATCH', input),
  );
export const deleteAssetType = (id: string) =>
  apiRequest(`/assets/types/${id}`, json('DELETE'));
export const getAssets = (
  options: {
    typeId?: string;
    includeArchived?: boolean;
    from?: string;
    to?: string;
  } = {},
) => record(`/assets${search(options)}`, s.assetListResponseSchema);
export const createAsset = (input: AssetCreateInput) =>
  record('/assets', s.assetResponseSchema, json('POST', input));
export const patchAsset = (id: string, input: AssetPatchInput) =>
  record(`/assets/${id}`, s.assetResponseSchema, json('PATCH', input));
export const archiveAsset = (id: string) =>
  apiRequest(`/assets/${id}`, json('DELETE'));
export const getAsset = (
  id: string,
  range: { from?: string; to?: string } = {},
) => record(`/assets/${id}${search(range)}`, s.assetDetailResponseSchema);
export const getAssetActivities = (
  options: {
    from?: string;
    to?: string;
    kind?: string;
    assetId?: string;
    pageSize?: number;
  } = {},
) =>
  apiRequest<{
    data: AssetActivity[];
    meta: { total: number; totalPages: number };
  }>(
    `/assets/activities${search({ page: '1', pageSize: options.pageSize ?? 100, ...options })}`,
  ).then((r) => r.data);
export const createAssetActivity = (input: AssetActivityInput) =>
  record(
    '/assets/activities',
    s.assetActivityResponseSchema,
    json('POST', input),
  );
export const patchAssetActivity = (id: string, input: AssetActivityInput) =>
  record(
    `/assets/activities/${id}`,
    s.assetActivityResponseSchema,
    json('PATCH', input),
  );
export const deleteAssetActivity = (id: string) =>
  apiRequest(`/assets/activities/${id}`, json('DELETE'));
export const getAssetDashboard = (range: { from?: string; to?: string } = {}) =>
  record(`/assets/dashboard${search(range)}`, s.assetDashboardResponseSchema);
