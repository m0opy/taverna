import { z } from 'zod';

import { isoTimestampSchema } from './validators.js';

export const healthStatusSchema = z.enum(['ok', 'degraded']);
export const healthDatabaseStateSchema = z.enum(['up', 'down']);

export const healthOkResponseSchema = z.strictObject({
  status: healthStatusSchema,
  database: healthDatabaseStateSchema,
  version: z.string().min(1),
  timestamp: isoTimestampSchema,
});

export const healthDegradedResponseSchema = z.strictObject({
  status: z.literal('degraded'),
  database: z.literal('down'),
});

export const healthResponseSchema = z.union([
  healthOkResponseSchema,
  healthDegradedResponseSchema,
]);

export type HealthOkResponse = z.infer<typeof healthOkResponseSchema>;
export type HealthDegradedResponse = z.infer<typeof healthDegradedResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
