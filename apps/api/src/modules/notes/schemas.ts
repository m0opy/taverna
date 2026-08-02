import {noteListQuerySchema, noteWriteRequestSchema} from '@taverna/contracts';
import { z } from 'zod';

import {
  calendarDateToUtcDate,
  serializeCalendarDate as serializeUtcCalendarDate,
} from '../../lib/calendar-date.js';

export const notesParamsSchema = z.strictObject({
  campaignId: z.uuid(),
});

export const noteParamsSchema = notesParamsSchema.extend({
  noteId: z.uuid(),
});

export function parseNoteWriteRequest(body: unknown) {
  return noteWriteRequestSchema.parse(body);
}

export function parseNoteListQuery(query: unknown) {
  return noteListQuerySchema.parse(query);
}

export function calendarDateToDate(value: string | null | undefined): Date | null {
  return calendarDateToUtcDate(value, 'sessionDate');
}

export function serializeCalendarDate(value: Date | null): string | null {
  return serializeUtcCalendarDate(value);
}
