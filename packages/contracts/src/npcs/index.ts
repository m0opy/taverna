import { z } from 'zod';

import { authorDtoSchema } from '../memberships/index.js';
import { npcAttitudeSchema } from '../common/enums.js';
import {
  isoTimestampSchema,
  nonEmptyStringArray,
  nullableOptionalTrimmedString,
  trimmedString,
  uuidSchema,
} from '../common/validators.js';

export const npcRelationInputSchema = z.strictObject({
  toNpcId: uuidSchema,
  label: trimmedString(1, 60),
});

export const npcRelationDtoSchema = z.strictObject({
  id: uuidSchema,
  toNpc: z.strictObject({
    id: uuidSchema,
    name: trimmedString(1, 60),
  }),
  label: trimmedString(1, 60),
});

export const npcDtoSchema = z.strictObject({
  id: uuidSchema,
  campaignId: uuidSchema,
  createdBy: authorDtoSchema,
  name: trimmedString(1, 60),
  title: z.string().max(60),
  attitude: npcAttitudeSchema,
  tags: z.array(z.string().trim().min(1).max(24)).max(5),
  notes: z.string().max(1000),
  relations: z.array(npcRelationDtoSchema).max(5),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export const npcWriteRequestSchema = z.strictObject({
  name: trimmedString(1, 60),
  title: nullableOptionalTrimmedString(60)
    .optional()
    .transform((value) => value ?? '')
    .pipe(z.string().max(60)),
  attitude: npcAttitudeSchema.optional(),
  tags: nonEmptyStringArray(24, 5).optional(),
  notes: nullableOptionalTrimmedString(1000)
    .optional()
    .transform((value) => value ?? '')
    .pipe(z.string().max(1000)),
  relations: z.array(npcRelationInputSchema).max(5).optional(),
});

export const npcListQuerySchema = z.strictObject({
  tag: z.string().trim().min(1).max(24).optional(),
});

export const npcListResponseSchema = z.strictObject({
  items: z.array(npcDtoSchema).max(200),
  availableTags: z.array(z.string().trim().min(1).max(24)),
});

export type NpcRelationInput = z.infer<typeof npcRelationInputSchema>;
export type NpcRelationDto = z.infer<typeof npcRelationDtoSchema>;
export type NpcDto = z.infer<typeof npcDtoSchema>;
export type NpcWriteRequest = z.infer<typeof npcWriteRequestSchema>;
export type NpcListQuery = z.infer<typeof npcListQuerySchema>;
export type NpcListResponse = z.infer<typeof npcListResponseSchema>;
