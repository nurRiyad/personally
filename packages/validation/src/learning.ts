import { z } from 'zod';

const name = z.string().trim().min(1, 'Name is required.').max(120);
const description = z
  .string()
  .trim()
  .min(1, 'Description is required.')
  .max(500);
const minutes = z.number().int().positive().max(5256000);
const note = z.string().trim().max(500).nullable();
export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, 'Use a valid date.');
export const taskStatusSchema = z.enum([
  'Todo',
  'In progress',
  'Done',
  'Blocked',
  'Cancelled',
]);
export const epicInputSchema = z
  .object({
    name,
    description,
    targetDate: calendarDateSchema,
    targetMinutes: minutes,
    comment: note.optional(),
  })
  .strict();
export const taskInputSchema = z
  .object({
    name,
    description,
    targetMinutes: minutes,
    weight: z.number().int().min(1).max(10).default(1),
    comment: note.optional(),
  })
  .strict();
export const versionSchema = z
  .object({ version: z.number().int().positive() })
  .strict();
export const epicPatchSchema = epicInputSchema
  .partial()
  .extend(versionSchema.shape)
  .strict();
export const taskPatchSchema = taskInputSchema
  .partial()
  .extend(versionSchema.shape)
  .strict();
export const statusInputSchema = versionSchema
  .extend({ status: taskStatusSchema })
  .strict();
export const orderInputSchema = versionSchema
  .extend({ taskIds: z.array(z.string().min(1).max(100)).max(10000) })
  .strict();
export const sessionInputSchema = z
  .object({
    id: z.string().uuid(),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime(),
    durationMinutes: minutes,
  })
  .strict()
  .refine(
    (value) =>
      Math.ceil(
        (Date.parse(value.endedAt) - Date.parse(value.startedAt)) / 60000,
      ) === value.durationMinutes,
    'Duration must match the elapsed minutes rounded up to the next whole minute.',
  );
export const saveSessionSchema = versionSchema
  .extend({ session: sessionInputSchema })
  .strict();
export const completeInputSchema = versionSchema
  .extend({
    session: sessionInputSchema.optional(),
    comment: note.optional(),
  })
  .strict();
export const manualEntryInputSchema = z
  .object({
    date: calendarDateSchema,
    minutes: z.number().int().min(1).max(1440),
  })
  .strict();
export const createManualSchema = manualEntryInputSchema
  .extend({ id: z.string().uuid(), ...versionSchema.shape })
  .strict();
export const patchManualSchema = manualEntryInputSchema
  .extend({ ...versionSchema.shape, entryVersion: z.number().int().positive() })
  .strict();
export const deleteManualSchema = versionSchema
  .extend({ entryVersion: z.number().int().positive() })
  .strict();
export const stopwatchTimeInputSchema = z
  .object({
    type: z.literal('stopwatch'),
    id: z.string().uuid(),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime(),
    durationMinutes: minutes,
  })
  .strict();
export const stopwatchTimeEditSchema = z.object({
  minutes: z.coerce.number().int().positive(),
});
export const manualTimeInputSchema = z.object({
  type: z.literal('manual'),
  id: z.string().uuid(),
  date: calendarDateSchema,
  minutes: z.number().int().min(1).max(1440),
});
export const timeInputSchema = z.discriminatedUnion('type', [
  stopwatchTimeInputSchema,
  manualTimeInputSchema,
]);
export const createTimeSchema = z.discriminatedUnion('type', [
  stopwatchTimeInputSchema.extend({ version: z.number().int().positive() }),
  manualTimeInputSchema.extend({ version: z.number().int().positive() }),
]);
export const patchTimeSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('stopwatch'),
    minutes,
    version: z.number().int().positive(),
    entryVersion: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('manual'),
    date: calendarDateSchema,
    minutes: z.number().int().min(1).max(1440),
    version: z.number().int().positive(),
    entryVersion: z.number().int().positive(),
  }),
]);
export const deleteTimeSchema = deleteManualSchema;
export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export const epicQuerySchema = pageQuerySchema
  .extend({
    status: z.enum(['All', 'Todo', 'In progress', 'Done']).default('All'),
    created: z.enum(['all', 'recent30', 'older30']).default('all'),
    sort: z.enum(['newest', 'oldest', 'name', 'progress']).default('newest'),
  })
  .strict();
export const taskQuerySchema = pageQuerySchema
  .extend({
    status: z.union([taskStatusSchema, z.literal('All')]).default('All'),
    sort: z
      .enum(['weight-desc', 'weight-asc', 'name', 'manual'])
      .default('weight-desc'),
  })
  .strict();
export const learningEpicSchema = epicInputSchema.extend({
  targetMinutes: z.coerce.number().int().positive().max(5256000),
});
export const learningTaskSchema = taskInputSchema.extend({
  targetMinutes: z.coerce.number().int().positive().max(5256000),
  weight: z.coerce.number().int().min(1).max(10),
});
export const manualTimeSchema = manualEntryInputSchema.extend({
  minutes: z.coerce.number().int().min(1).max(1440),
});
const timestamps = {
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  version: z.number().int().positive(),
};
const totals = {
  actualMinutes: z.number(),
  timerMinutes: z.number(),
  manualMinutes: z.number(),
  sessions: z.number().int(),
  averageSessionMinutes: z.number(),
  differenceMinutes: z.number(),
  percentageUsed: z.number(),
};
export const epicResponseSchema = epicInputSchema.extend({
  id: z.string(),
  ...timestamps,
  status: z.enum(['Todo', 'In progress', 'Done']),
  actualMinutes: z.number(),
  differenceMinutes: z.number(),
  percentageUsed: z.number(),
  progress: z.number(),
  completedPoints: z.number(),
  eligiblePoints: z.number(),
  taskCount: z.number().int(),
});
export const taskResponseSchema = taskInputSchema.extend({
  id: z.string(),
  epicId: z.string(),
  epicName: z.string(),
  ...timestamps,
  ...totals,
  status: taskStatusSchema,
  sortOrder: z.number().int(),
});
export const sessionResponseSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  durationMinutes: z.number(),
  createdAt: z.string().datetime(),
});
export const manualResponseSchema = manualEntryInputSchema.extend({
  id: z.string(),
  taskId: z.string(),
  version: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export const timeResponseSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('stopwatch'),
    id: z.string(),
    taskId: z.string(),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime(),
    durationMinutes: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.number().int(),
  }),
  manualResponseSchema.extend({ type: z.literal('manual') }),
]);
export const summaryResponseSchema = z.object({
  total: z.number(),
  completed: z.number(),
  inProgress: z.number(),
});
export const pageMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export const epicListResponseSchema = z.object({
  data: z.array(epicResponseSchema),
  meta: pageMetaSchema,
});
export const taskListResponseSchema = z.object({
  data: z.array(taskResponseSchema),
  meta: pageMetaSchema,
});
export const sessionListResponseSchema = z.object({
  data: z.array(sessionResponseSchema),
  meta: pageMetaSchema,
});
export const manualListResponseSchema = z.object({
  data: z.array(manualResponseSchema),
  meta: pageMetaSchema,
});
export const timeListResponseSchema = z.object({
  data: z.array(timeResponseSchema),
  meta: pageMetaSchema,
});
export type LearningEpicInput = z.infer<typeof epicInputSchema>;
export type LearningTaskInput = z.infer<typeof taskInputSchema>;
export type LearningEpic = z.infer<typeof epicResponseSchema>;
export type LearningTask = z.infer<typeof taskResponseSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type EpicQuery = z.infer<typeof epicQuerySchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type PageQuery = z.infer<typeof pageQuerySchema>;
export type SessionInput = z.infer<typeof sessionInputSchema>;
export type CompleteInput = z.infer<typeof completeInputSchema>;
export type ManualEntry = z.infer<typeof manualResponseSchema>;
export type ManualInput = z.infer<typeof manualEntryInputSchema>;
export type LearningSession = z.infer<typeof sessionResponseSchema>;
export type LearningTime = z.infer<typeof timeResponseSchema>;
export type TimeInput = z.infer<typeof timeInputSchema>;
