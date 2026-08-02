import { z } from 'zod';

import { authorDtoSchema } from '../memberships/index.js';
import {
  calendarDateSchema,
  isoTimestampSchema,
  trimmedString,
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

export const noteListSortSchema = z.enum([
  'sessionDateDesc',
  'sessionDateAsc',
  'updatedAtDesc',
  'updatedAtAsc',
]);

export const noteListQuerySchema = z.strictObject({
  search: trimmedString(1, 120).optional(),
  sort: noteListSortSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const noteListMetaSchema = z.strictObject({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  totalItems: z.number().int().min(0).max(500),
  totalPages: z.number().int().min(1),
  search: z.union([trimmedString(1, 120), z.null()]),
  sort: noteListSortSchema,
});

export const noteListResponseSchema = z.strictObject({
  items: z.array(noteDtoSchema).max(100),
  meta: noteListMetaSchema,
});

export type NoteDto = z.infer<typeof noteDtoSchema>;
export type NoteWriteRequest = z.infer<typeof noteWriteRequestSchema>;
export type NoteListSort = z.infer<typeof noteListSortSchema>;
export type NoteListQuery = z.infer<typeof noteListQuerySchema>;
export type NoteListMeta = z.infer<typeof noteListMetaSchema>;
export type NoteListResponse = z.infer<typeof noteListResponseSchema>;
