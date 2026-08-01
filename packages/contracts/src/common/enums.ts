import { z } from 'zod';

export const coverKeys = [
  'forest',
  'dungeon',
  'tavern',
  'sea',
  'mountains',
  'city',
] as const;

export const npcAttitudes = ['ally', 'neutral', 'enemy', 'unknown'] as const;

export const campaignRoles = ['master', 'player'] as const;

export const errorCodes = [
  'VALIDATION_ERROR',
  'CONFIRMATION_MISMATCH',
  'OWNER_CANNOT_LEAVE',
  'NPC_SELF_RELATION',
  'TOO_MANY_RELATIONS',
  'CHARACTER_NAME_REQUIRED',
  'UNAUTHORIZED',
  'INVALID_CREDENTIALS',
  'SESSION_EXPIRED',
  'CAMPAIGN_FORBIDDEN',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVITE_INVALID',
  'ACTIVE_MEMBERSHIP_NOT_FOUND',
  'RELATED_NPC_NOT_FOUND',
  'EMAIL_TAKEN',
  'ALREADY_MEMBER',
  'CAMPAIGN_FULL',
  'CAMPAIGN_LIMIT_REACHED',
  'NOTE_LIMIT_REACHED',
  'NPC_LIMIT_REACHED',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export const coverKeySchema = z.enum(coverKeys);
export const npcAttitudeSchema = z.enum(npcAttitudes);
export const campaignRoleSchema = z.enum(campaignRoles);
export const errorCodeSchema = z.enum(errorCodes);

export type CoverKey = z.infer<typeof coverKeySchema>;
export type NpcAttitude = z.infer<typeof npcAttitudeSchema>;
export type CampaignRole = z.infer<typeof campaignRoleSchema>;
export type ErrorCode = z.infer<typeof errorCodeSchema>;
