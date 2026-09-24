import { z } from 'zod';
export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM.');
export const budgetDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(+d) && d.toISOString().slice(0, 10) === v;
  }, 'Use a valid date.');
const name = z.string().trim().min(1, 'Name is required.').max(120);
const note = z.string().trim().max(2000).nullable();
const amount = z.number().int().min(0).max(999999999);
const positive = amount.min(1, 'Amount must be greater than zero.');
const version = z.number().int().positive();
export const budgetVersionSchema = z.object({ monthVersion: version }).strict();
export const budgetMonthInputSchema = z
  .object({ month: monthKeySchema, note: note.optional() })
  .strict();
export const budgetMonthPatchSchema = z
  .object({ note, monthVersion: version })
  .strict();
export const incomeSourceInputSchema = z
  .object({
    name,
    plannedAmount: amount,
    isRecurring: z.boolean(),
    monthVersion: version,
  })
  .strict();
export const incomeSourcePatchSchema = z
  .object({
    name: name.optional(),
    plannedAmount: amount.optional(),
    isRecurring: z.boolean().optional(),
    monthVersion: version,
  })
  .strict();
export const incomeEntryInputSchema = z
  .object({
    amount: positive,
    receivedOn: budgetDateSchema,
    note: note.optional(),
    monthVersion: version,
  })
  .strict();
export const budgetGroupInputSchema = z
  .object({ name, monthVersion: version })
  .strict();
export const budgetItemInputSchema = z
  .object({
    groupId: z.string().uuid(),
    name,
    plannedAmount: amount,
    isRecurring: z.boolean(),
    note: note.optional(),
    monthVersion: version,
  })
  .strict();
export const budgetItemPatchSchema = z
  .object({
    groupId: z.string().uuid().optional(),
    name: name.optional(),
    plannedAmount: amount.optional(),
    isRecurring: z.boolean().optional(),
    note: note.optional(),
    monthVersion: version,
  })
  .strict();
export const expenseInputSchema = z
  .object({
    amount: positive,
    spentOn: budgetDateSchema,
    note: note.optional(),
    monthVersion: version,
  })
  .strict();
export const copyBudgetInputSchema = z
  .object({
    targetMonth: monthKeySchema,
    mode: z.enum(['recurring', 'all']),
    monthVersion: version,
  })
  .strict();
export const budgetMonthsQuerySchema = z
  .object({ year: z.coerce.number().int().min(2000).max(9999) })
  .strict();
const summary = z.object({
  earnedAmount: z.number().int(),
  plannedAmount: z.number().int(),
  spentAmount: z.number().int(),
  remainingAmount: z.number().int(),
  usagePercentage: z.number().int(),
});
const expense = z.object({
  id: z.string(),
  amount: z.number().int(),
  spentOn: budgetDateSchema,
  note: z.string().nullable(),
});
const income = z.object({
  id: z.string(),
  amount: z.number().int(),
  receivedOn: budgetDateSchema,
  note: z.string().nullable(),
});
export const budgetMonthResponseSchema = z.object({
  id: z.string(),
  month: monthKeySchema,
  note: z.string().nullable(),
  version: z.number().int(),
  summary,
  incomeSources: z.array(
    z.object({
      id: z.string(),
      name,
      plannedAmount: amount,
      isRecurring: z.boolean(),
      position: z.number().int(),
      summary: summary.pick({
        earnedAmount: true,
        remainingAmount: true,
        usagePercentage: true,
      }),
      income: z.array(income),
    }),
  ),
  groups: z.array(
    z.object({
      id: z.string(),
      name,
      position: z.number().int(),
      items: z.array(
        z.object({
          id: z.string(),
          name,
          plannedAmount: amount,
          isRecurring: z.boolean(),
          note: z.string().nullable(),
          position: z.number().int(),
          summary: summary.pick({
            spentAmount: true,
            remainingAmount: true,
            usagePercentage: true,
          }),
          expenses: z.array(expense),
        }),
      ),
    }),
  ),
  recentActivity: z.array(
    expense.extend({
      itemId: z.string(),
      itemName: z.string(),
      groupName: z.string(),
    }),
  ),
});
export type BudgetMonth = z.infer<typeof budgetMonthResponseSchema>;
