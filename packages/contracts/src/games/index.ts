import {z} from 'zod';

import {calendarDateSchema, isoTimestampSchema, trimmedString, uuidSchema} from '../common/validators.js';

export const gameTimeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm');

const scheduledTimeSchema = z.union([gameTimeSchema, z.null()]);

export const gameDtoSchema = z.strictObject({
  id: uuidSchema,
  campaignId: uuidSchema,
  scheduledFor: calendarDateSchema,
  scheduledTime: scheduledTimeSchema,
  title: trimmedString(1, 80),
  description: z.string().max(500),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export const createGameRequestSchema = z.strictObject({
  scheduledFor: calendarDateSchema,
  scheduledTime: scheduledTimeSchema.optional().transform((value) => value ?? null),
  title: trimmedString(1, 80),
  description: z.string().trim().max(500).optional().transform((value) => value ?? ''),
});

export const updateGameRequestSchema = z
  .strictObject({
    scheduledFor: calendarDateSchema.optional(),
    scheduledTime: scheduledTimeSchema.optional(),
    title: trimmedString(1, 80).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });

export const gameListQuerySchema = z.strictObject({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM'),
});

export const gameListResponseSchema = z.strictObject({
  items: z.array(gameDtoSchema).max(500),
});

export type GameDto = z.infer<typeof gameDtoSchema>;
export type CreateGameRequest = z.infer<typeof createGameRequestSchema>;
export type UpdateGameRequest = z.infer<typeof updateGameRequestSchema>;
export type GameListQuery = z.infer<typeof gameListQuerySchema>;
export type GameListResponse = z.infer<typeof gameListResponseSchema>;
