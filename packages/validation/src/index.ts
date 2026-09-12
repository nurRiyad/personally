import { z } from 'zod';
export const healthSchema = z.object({
  data: z.object({ status: z.literal('ok') }),
});
