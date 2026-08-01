import { z } from 'zod';

export const uuidSchema = z.uuid();

export const isoTimestampSchema = z.iso.datetime({ offset: true });

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const trimmedString = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const optionalTrimmedString = (max: number) =>
  z.string().trim().max(max).optional();

export const nullableTrimmedString = (min: number, max: number) =>
  z.union([z.null(), trimmedString(min, max)]);

export const nullableOptionalTrimmedString = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === undefined || value === null) {
        return null;
      }

      const normalized = value.trim();
      return normalized.length === 0 ? null : normalized;
    })
    .pipe(z.union([z.null(), z.string().max(max)]));

export const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254);

export const nonEmptyStringArray = (itemMax: number, maxItems: number) =>
  z
    .array(z.string().trim().min(1).max(itemMax))
    .max(maxItems)
    .transform((items) => [...new Set(items)]);
