import { z } from 'zod';

const activityKinds = [
  'Income',
  'Transfer',
  'Contribution',
  'Lending',
  'Repayment',
  'External use',
] as const;

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.');

export const assetActivityDraftSchema = z
  .object({
    kind: z.enum(activityKinds),
    source: z.string().trim().min(1, 'Choose a source.'),
    destination: z.string().trim().min(1, 'Choose a destination.'),
    amount: z
      .number()
      .int('Enter a whole taka amount.')
      .positive('Amount must be greater than zero.')
      .max(999_999_999, 'Amount is too large.'),
    date: isoDateSchema,
    note: z
      .string()
      .trim()
      .max(2_000, 'Keep the note under 2,000 characters.')
      .optional(),
  })
  .refine((value) => value.source !== value.destination, {
    path: ['destination'],
    message: 'Choose a different destination.',
  });

export type AssetActivityDraft = z.infer<typeof assetActivityDraftSchema>;

export const assetDraftSchema = z.object({
  kind: z.string().trim().min(1, 'Choose an asset type.').max(60),
  name: z.string().trim().min(1, 'Enter a name.').max(120),
  openingValue: z
    .number()
    .int('Enter a whole taka amount.')
    .min(0, 'Amount cannot be negative.')
    .max(999_999_999, 'Amount is too large.'),
  openedOn: isoDateSchema,
  detail: z.string().trim().max(200, 'Keep the detail under 200 characters.'),
});

export type AssetDraft = z.infer<typeof assetDraftSchema>;

export const assetTypeDraftSchema = z.object({
  name: z.string().trim().min(1, 'Enter a type name.').max(60),
});
export type AssetTypeDraft = z.infer<typeof assetTypeDraftSchema>;
