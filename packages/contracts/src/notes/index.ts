import { z } from 'zod';

import { authorDtoSchema } from '../memberships/index.js';
import {
  calendarDateSchema,
  isoTimestampSchema,
  uuidSchema,
} from '../common/validators.js';

export const noteDtoSchema = z.strictObject({
  id: uuidSchema,
  campaignId: uuidSchema,
  author: authorDtoSchema,
  body: z.string().trim().min(1).max(5000),
  sessionDate: z.union([calendarDateSchema, z.null()]),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  canEdit: z.boolean(),
  canDelete: z.boolean(),
});

export const noteWriteRequestSchema = z.strictObject({
  body: z.string().trim().min(1).max(5000),
  sessionDate: z.union([calendarDateSchema, z.null()]).optional(),
});

export const noteListResponseSchema = z.strictObject({
  items: z.array(noteDtoSchema).max(500),
});

export type NoteDto = z.infer<typeof noteDtoSchema>;
export type NoteWriteRequest = z.infer<typeof noteWriteRequestSchema>;
export type NoteListResponse = z.infer<typeof noteListResponseSchema>;
