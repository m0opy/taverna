import { z } from 'zod';

import { membershipDtoSchema } from '../memberships/index.js';
import { coverKeySchema, campaignRoleSchema } from '../common/enums.js';
import {
  calendarDateSchema,
  isoTimestampSchema,
  trimmedString,
  uuidSchema,
} from '../common/validators.js';

export const CAMPAIGN_MEMBER_LIMIT = 10;

export const campaignSummaryDtoSchema = z.strictObject({
  id: uuidSchema,
  title: trimmedString(2, 60),
  coverKey: coverKeySchema,
  nextSessionAt: z.union([calendarDateSchema, z.null()]),
  membersCount: z.number().int().min(1).max(CAMPAIGN_MEMBER_LIMIT),
  myRole: campaignRoleSchema,
});

export const campaignDetailDtoSchema = campaignSummaryDtoSchema.extend({
  synopsis: z.string().max(500),
  ownerId: uuidSchema,
  inviteUrl: z.union([z.string().url(), z.null()]),
  myMembershipId: uuidSchema,
  members: z.array(membershipDtoSchema).max(CAMPAIGN_MEMBER_LIMIT),
  createdAt: isoTimestampSchema,
});

export const campaignListResponseSchema = z.strictObject({
  items: z.array(campaignSummaryDtoSchema),
});

export const createCampaignRequestSchema = z.strictObject({
  title: trimmedString(2, 60),
  synopsis: z.string().trim().max(500).optional().transform((value) => value ?? ''),
  coverKey: coverKeySchema,
});

export const updateCampaignRequestSchema = z
  .strictObject({
    title: trimmedString(2, 60).optional(),
    synopsis: z.string().trim().max(500).optional(),
    coverKey: coverKeySchema.optional(),
    nextSessionAt: z.union([calendarDateSchema, z.null()]).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });

export const deleteCampaignRequestSchema = z.strictObject({
  confirmationTitle: trimmedString(2, 60),
});

export const rotateInviteResponseSchema = z.strictObject({
  inviteUrl: z.string().url(),
});

export type CampaignSummaryDto = z.infer<typeof campaignSummaryDtoSchema>;
export type CampaignDetailDto = z.infer<typeof campaignDetailDtoSchema>;
export type CampaignListResponse = z.infer<typeof campaignListResponseSchema>;
export type CreateCampaignRequest = z.infer<typeof createCampaignRequestSchema>;
export type UpdateCampaignRequest = z.infer<typeof updateCampaignRequestSchema>;
export type DeleteCampaignRequest = z.infer<typeof deleteCampaignRequestSchema>;
export type RotateInviteResponse = z.infer<typeof rotateInviteResponseSchema>;
