import {noteListQuerySchema, noteWriteRequestSchema} from '@taverna/contracts';
import { z } from 'zod';

import { AppError } from '../../lib/errors.js';

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
  if (value === undefined || value === null) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
      fields: {sessionDate: 'Expected a valid calendar date'},
    });
  }

  return date;
}

export function serializeCalendarDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }

  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
