import { z } from 'zod';

import { errorCodeSchema } from './enums.js';

export const fieldErrorMapSchema = z.record(z.string(), z.string()).optional();
export const errorMetaSchema = z.record(z.string(), z.unknown()).optional();

export const errorShapeSchema = z.strictObject({
  code: errorCodeSchema,
  message: z.string().min(1),
  fields: fieldErrorMapSchema,
  meta: errorMetaSchema,
  requestId: z.string().min(1),
});

export const errorResponseSchema = z.strictObject({
  error: errorShapeSchema,
});

export type ErrorShape = z.infer<typeof errorShapeSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
