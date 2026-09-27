import { z } from 'zod';

const kinds = [
  'Opening',
  'Income',
  'Growth',
  'Transfer',
  'Contribution',
  'Lending',
  'Repayment',
  'External use',
] as const;
export const assetActivityKinds = kinds;
const editableKinds = [
  'Opening',
  'Income',
  'Growth',
  'Transfer',
  'Contribution',
  'Lending',
  'Repayment',
  'External use',
] as const;
const dateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Choose a valid date.');
const amountSchema = z.number().int().positive().max(999_999_999);
const idSchema = z.string().uuid();

export const assetTypeInputSchema = z.object({ name: z.string().trim().min(1).max(60) }).strict();
export const assetTypeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  assetCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AssetTypeResponse = z.infer<typeof assetTypeResponseSchema>;
export type AssetTypeInput = z.infer<typeof assetTypeInputSchema>;
export const assetTypesResponseSchema = z.array(assetTypeResponseSchema);
export const assetTypeDraftSchema = assetTypeInputSchema;
export type AssetTypeDraft = z.infer<typeof assetTypeInputSchema>;

export const assetCreateSchema = z
  .object({
    typeId: idSchema,
    name: z.string().trim().min(1).max(120),
    detail: z.string().trim().max(200).default(''),
    isLiquid: z.boolean().default(false),
    isReceivable: z.boolean().default(false),
    openedOn: dateSchema,
    openingValue: z.number().int().min(0).max(999_999_999),
  })
  .strict()
  .refine((value) => !(value.isLiquid && value.isReceivable), {
    path: ['isReceivable'],
    message: 'A receivable cannot be liquid money.',
  });
export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
export const assetPatchSchema = z
  .object({
    typeId: idSchema.optional(),
    name: z.string().trim().min(1).max(120).optional(),
    detail: z.string().trim().max(200).optional(),
    isLiquid: z.boolean().optional(),
    isReceivable: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.');
export type AssetPatchInput = z.infer<typeof assetPatchSchema>;
export const assetResponseSchema = z.object({
  id: z.string(),
  typeId: z.string(),
  typeName: z.string(),
  name: z.string(),
  detail: z.string(),
  isLiquid: z.boolean(),
  isReceivable: z.boolean(),
  openedOn: dateSchema,
  archivedAt: z.string().nullable(),
  currentValue: z.number(),
  periodChange: z.number(),
  openingValue: z.number(),
  activityCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AssetResponse = z.infer<typeof assetResponseSchema>;
export const assetListQuerySchema = z
  .object({
    typeId: idSchema.optional(),
    includeArchived: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .strict();
export const assetActivityEndpointSchema = z.union([
  z.object({ assetId: idSchema }).strict(),
  z.object({ endpoint: z.enum(['outside', 'growth_return', 'personal_use']) }).strict(),
]);
export type AssetActivityEndpoint = z.infer<typeof assetActivityEndpointSchema>;
export const assetActivityInputSchema = z
  .object({
    kind: z.enum(editableKinds),
    source: assetActivityEndpointSchema,
    destination: assetActivityEndpointSchema,
    amount: amountSchema,
    activityDate: dateSchema,
    note: z.string().trim().max(2000).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const srcAssetId = 'assetId' in value.source ? value.source.assetId : undefined;
    const srcEndpoint = 'endpoint' in value.source ? value.source.endpoint : undefined;
    const dstAssetId = 'assetId' in value.destination ? value.destination.assetId : undefined;
    const dstEndpoint = 'endpoint' in value.destination ? value.destination.endpoint : undefined;
    const srcAsset = srcAssetId !== undefined;
    const dstAsset = dstAssetId !== undefined;
    const valid =
      value.kind === 'Opening'
        ? !srcAsset && srcEndpoint === 'outside' && dstAsset
        : value.kind === 'Income'
          ? !srcAsset && srcEndpoint === 'outside' && dstAsset
          : value.kind === 'Growth'
            ? !srcAsset && srcEndpoint === 'growth_return' && dstAsset
            : value.kind === 'External use'
              ? srcAsset && !dstAsset && dstEndpoint === 'personal_use'
              : srcAsset && dstAsset && srcAssetId !== dstAssetId;
    if (!valid)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination'],
        message: 'Source and destination do not match this activity type.',
      });
  });
export type AssetActivityInput = z.infer<typeof assetActivityInputSchema>;
export const assetActivityResponseSchema = z.object({
  id: z.string(),
  kind: z.enum(kinds),
  amount: z.number(),
  activityDate: dateSchema,
  source: assetActivityEndpointSchema,
  destination: assetActivityEndpointSchema,
  sourceName: z.string(),
  destinationName: z.string(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AssetActivityResponse = z.infer<typeof assetActivityResponseSchema>;
export const assetActivityQuerySchema = z
  .object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    kind: z.enum(kinds).optional(),
    assetId: idSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ['to'],
    message: 'End date must be on or after start date.',
  });
export const assetDateRangeSchema = z
  .object({ from: dateSchema.optional(), to: dateSchema.optional() })
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ['to'],
    message: 'End date must be on or after start date.',
  });
export const assetDashboardResponseSchema = z.object({
  summary: z.object({
    totalAssets: z.number(),
    periodChange: z.number(),
    liquidMoney: z.number(),
    moneyLent: z.number(),
    assetCount: z.number(),
  }),
  assetMix: z.array(
    z.object({
      typeId: z.string(),
      typeName: z.string(),
      value: z.number(),
      percentage: z.number(),
    }),
  ),
  topGrowingAssets: z.array(
    assetResponseSchema.extend({
      growthRate: z.number().nullable(),
      growthLabel: z.string(),
    }),
  ),
  recentActivity: z.array(assetActivityResponseSchema),
  series: z.array(z.object({ date: dateSchema, value: z.number() })),
});
export type AssetDashboardResponse = z.infer<typeof assetDashboardResponseSchema>;
export const assetDetailResponseSchema = assetResponseSchema.extend({
  activities: z.array(assetActivityResponseSchema),
  series: z.array(z.object({ date: dateSchema, value: z.number() })),
});
export type AssetDetailResponse = z.infer<typeof assetDetailResponseSchema>;
export const assetListResponseSchema = z.array(assetResponseSchema);

// Temporary draft contracts retained by the existing forms while they are
// migrated to ID-based API requests.
export const assetActivityDraftSchema = z
  .object({
    kind: z.enum(editableKinds),
    source: z.string().trim().min(1),
    destination: z.string().trim().min(1),
    amount: amountSchema,
    date: dateSchema,
    note: z.string().trim().max(2000).optional(),
  })
  .refine((value) => value.source !== value.destination, {
    path: ['destination'],
    message: 'Choose a different destination.',
  });
export type AssetActivityDraft = z.infer<typeof assetActivityDraftSchema>;
export const assetDraftSchema = z.object({
  kind: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  openingValue: z.number().int().min(0).max(999_999_999),
  openedOn: dateSchema,
  detail: z.string().trim().max(200),
  isLiquid: z.boolean(),
  isReceivable: z.boolean().default(false),
});
export type AssetDraft = z.infer<typeof assetDraftSchema>;
