import { z } from 'zod';

import { coverKeySchema } from '../common/enums.js';
import { membershipDtoSchema } from '../memberships/index.js';
import {
  nullableOptionalTrimmedString,
  trimmedString,
  uuidSchema,
} from '../common/validators.js';

export const invitePreviewDtoSchema = z.strictObject({
  campaignId: uuidSchema,
  title: trimmedString(2, 60),
  synopsis: z.string().max(500),
  coverKey: coverKeySchema,
  membersCount: z.number().int().min(1).max(20),
  ownerName: trimmedString(2, 40),
  isFull: z.boolean(),
});

export const joinCampaignRequestSchema = z.strictObject({
  characterName: trimmedString(2, 40),
  characterClass: nullableOptionalTrimmedString(60).optional(),
  characterInfo: nullableOptionalTrimmedString(300).optional(),
});

export const joinCampaignResponseSchema = z.strictObject({
  campaignId: uuidSchema,
  membership: membershipDtoSchema,
});

export type InvitePreviewDto = z.infer<typeof invitePreviewDtoSchema>;
export type JoinCampaignRequest = z.infer<typeof joinCampaignRequestSchema>;
export type JoinCampaignResponse = z.infer<typeof joinCampaignResponseSchema>;
