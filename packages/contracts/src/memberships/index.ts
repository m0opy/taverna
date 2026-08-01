import { z } from 'zod';

import {
  isoTimestampSchema,
  nullableOptionalTrimmedString,
  nullableTrimmedString,
  trimmedString,
  uuidSchema,
} from '../common/validators.js';

export const membershipUserSchema = z.strictObject({
  id: uuidSchema,
  name: trimmedString(2, 40),
});

export const membershipDtoSchema = z.strictObject({
  id: uuidSchema,
  user: membershipUserSchema,
  characterName: nullableTrimmedString(2, 40),
  characterClass: z.union([z.null(), z.string().max(60)]),
  characterInfo: z.union([z.null(), z.string().max(300)]),
  joinedAt: isoTimestampSchema,
  isOwner: z.boolean(),
});

export const authorDtoSchema = z.strictObject({
  membershipId: uuidSchema,
  userName: trimmedString(2, 40),
  characterName: nullableTrimmedString(2, 40),
  isActive: z.boolean(),
});

export const updateCharacterRequestSchema = z
  .strictObject({
    characterName: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === undefined || value === null) {
          return value ?? null;
        }

        const normalized = value.trim();
        return normalized.length === 0 ? null : normalized;
      })
      .pipe(z.union([z.null(), z.string().min(2).max(40)]))
      .optional(),
    characterClass: nullableOptionalTrimmedString(60).optional(),
    characterInfo: nullableOptionalTrimmedString(300).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });

export type MembershipDto = z.infer<typeof membershipDtoSchema>;
export type AuthorDto = z.infer<typeof authorDtoSchema>;
export type UpdateCharacterRequest = z.infer<typeof updateCharacterRequestSchema>;
