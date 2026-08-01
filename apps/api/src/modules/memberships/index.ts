import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import {
  joinCampaignRequestSchema,
  updateCharacterRequestSchema,
  type MembershipDto,
} from '@taverna/contracts';
import { z } from 'zod';

import { AppError } from '../../lib/errors.js';

const inviteParamsSchema = z.strictObject({
  token: z.string().min(1),
});
const campaignParamsSchema = z.strictObject({ id: z.string().uuid() });

function requirePrisma(app: FastifyInstance) {
  if (!app.prisma) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Database is unavailable');
  }
  return app.prisma;
}

function membershipDto(
  membership: {
    id: string;
    userId: string;
    characterName: string | null;
    characterClass: string | null;
    characterInfo: string | null;
    joinedAt: Date;
    user: { id: string; name: string };
  },
  ownerId: string,
): MembershipDto {
  return {
    id: membership.id,
    user: membership.user,
    characterName: membership.characterName,
    characterClass: membership.characterClass,
    characterInfo: membership.characterInfo,
    joinedAt: membership.joinedAt.toISOString(),
    isOwner: membership.userId === ownerId,
  };
}

export async function registerMembershipsModule(app: FastifyInstance): Promise<void> {
  app.get('/invites/:token', async (request) => {
    const { token } = inviteParamsSchema.parse(request.params);
    const campaign = await requirePrisma(app).campaign.findUnique({
      where: { inviteToken: token },
      include: {
        owner: { select: { name: true } },
        memberships: { where: { leftAt: null }, select: { id: true } },
      },
    });
    if (!campaign) {
      throw new AppError(404, 'INVITE_INVALID', 'Invite is invalid or expired');
    }

    return {
      campaignId: campaign.id,
      title: campaign.title,
      synopsis: campaign.synopsis,
      coverKey: campaign.coverKey,
      membersCount: campaign.memberships.length,
      ownerName: campaign.owner.name,
      isFull: campaign.memberships.length >= 20,
    };
  });

  app.post('/invites/:token/join', { preHandler: app.authenticate }, async (request, reply) => {
    const { token } = inviteParamsSchema.parse(request.params);
    const payload = joinCampaignRequestSchema.parse(request.body);
    const prisma = requirePrisma(app);
    const userId = request.currentUserId!;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const campaign = await tx.campaign.findUnique({
            where: { inviteToken: token },
            select: { id: true, ownerId: true },
          });
          if (!campaign) {
            throw new AppError(404, 'INVITE_INVALID', 'Invite is invalid or expired');
          }

          const existing = await tx.membership.findFirst({
            where: { campaignId: campaign.id, userId, leftAt: null },
            select: { id: true },
          });
          if (existing) {
            throw new AppError(409, 'ALREADY_MEMBER', 'Already a campaign member', {
              meta: { campaignId: campaign.id },
            });
          }

          const membersCount = await tx.membership.count({
            where: { campaignId: campaign.id, leftAt: null },
          });
          if (membersCount >= 20) {
            throw new AppError(409, 'CAMPAIGN_FULL', 'Campaign is full');
          }

          const membership = await tx.membership.create({
            data: {
              campaignId: campaign.id,
              userId,
              characterName: payload.characterName,
              characterClass: payload.characterClass,
              characterInfo: payload.characterInfo,
            },
            include: { user: { select: { id: true, name: true } } },
          });
          return { campaign, membership };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        return reply.status(201).send({
          campaignId: result.campaign.id,
          membership: membershipDto(result.membership, result.campaign.ownerId),
        });
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            const campaign = await prisma.campaign.findUnique({
              where: { inviteToken: token },
              select: { id: true },
            });
            throw new AppError(409, 'ALREADY_MEMBER', 'Already a campaign member', {
              meta: campaign ? { campaignId: campaign.id } : undefined,
            });
          }
          if (error.code === 'P2034' && attempt === 0) {
            continue;
          }
        }
        throw error;
      }
    }

    throw new AppError(409, 'CONFLICT', 'Please retry the request');
  });

  app.patch('/campaigns/:id/me', { preHandler: app.authenticate }, async (request) => {
    const { id } = campaignParamsSchema.parse(request.params);
    const payload = updateCharacterRequestSchema.parse(request.body);
    const prisma = requirePrisma(app);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });
    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    }

    const membership = await prisma.membership.findFirst({
      where: { campaignId: id, userId: request.currentUserId!, leftAt: null },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!membership) {
      throw new AppError(403, 'CAMPAIGN_FORBIDDEN', 'Campaign access denied');
    }

    const nextCharacterName =
      payload.characterName === undefined ? membership.characterName : payload.characterName;
    if (campaign.ownerId !== request.currentUserId && !nextCharacterName) {
      throw new AppError(400, 'CHARACTER_NAME_REQUIRED', 'Character name is required');
    }

    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: payload,
      include: { user: { select: { id: true, name: true } } },
    });
    return membershipDto(updated, campaign.ownerId);
  });
}
