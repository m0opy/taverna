import { randomBytes } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import {
  createCampaignRequestSchema,
  type CampaignDetailDto,
  type CampaignSummaryDto,
} from '@taverna/contracts';
import { z } from 'zod';

import { AppError } from '../../lib/errors.js';

const campaignParamsSchema = z.strictObject({ id: z.string().uuid() });

const campaignInclude = {
  memberships: {
    where: { leftAt: null },
    include: { user: true },
    orderBy: { joinedAt: 'asc' },
  },
} satisfies Prisma.CampaignInclude;

type CampaignWithMembers = Prisma.CampaignGetPayload<{ include: typeof campaignInclude }>;

function requirePrisma(app: FastifyInstance) {
  if (!app.prisma) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Database is unavailable');
  }
  return app.prisma;
}

function calendarDate(value: Date | null): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}

function summaryDto(campaign: CampaignWithMembers, userId: string): CampaignSummaryDto {
  return {
    id: campaign.id,
    title: campaign.title,
    coverKey: campaign.coverKey as CampaignSummaryDto['coverKey'],
    nextSessionAt: calendarDate(campaign.nextSessionAt),
    membersCount: campaign.memberships.length,
    myRole: campaign.ownerId === userId ? 'master' : 'player',
  };
}

export function detailDto(
  app: FastifyInstance,
  campaign: CampaignWithMembers,
  userId: string,
): CampaignDetailDto {
  const myMembership = campaign.memberships.find((membership) => membership.userId === userId);
  if (!myMembership) {
    throw new AppError(403, 'CAMPAIGN_FORBIDDEN', 'Campaign access denied');
  }

  return {
    ...summaryDto(campaign, userId),
    synopsis: campaign.synopsis,
    ownerId: campaign.ownerId,
    inviteUrl:
      campaign.ownerId === userId
        ? `${app.appEnv.APP_ORIGIN}/join/${campaign.inviteToken.trim()}`
        : null,
    myMembershipId: myMembership.id,
    members: campaign.memberships.map((membership) => ({
      id: membership.id,
      user: { id: membership.user.id, name: membership.user.name },
      characterName: membership.characterName,
      characterClass: membership.characterClass,
      characterInfo: membership.characterInfo,
      joinedAt: membership.joinedAt.toISOString(),
      isOwner: membership.userId === campaign.ownerId,
    })),
    createdAt: campaign.createdAt.toISOString(),
  };
}

export async function registerCampaignsModule(app: FastifyInstance): Promise<void> {
  app.get('/campaigns', { preHandler: app.authenticate }, async (request) => {
    const campaigns = await requirePrisma(app).campaign.findMany({
      where: {
        memberships: {
          some: { userId: request.currentUserId!, leftAt: null },
        },
      },
      include: campaignInclude,
      orderBy: { createdAt: 'desc' },
    });

    return { items: campaigns.map((campaign) => summaryDto(campaign, request.currentUserId!)) };
  });

  app.post('/campaigns', { preHandler: app.authenticate }, async (request, reply) => {
    const payload = createCampaignRequestSchema.parse(request.body);
    const userId = request.currentUserId!;
    const prisma = requirePrisma(app);

    const campaign = await prisma.$transaction(async (tx) => {
      const ownedCount = await tx.campaign.count({ where: { ownerId: userId } });
      if (ownedCount >= 20) {
        throw new AppError(409, 'CAMPAIGN_LIMIT_REACHED', 'Campaign limit reached');
      }

      return tx.campaign.create({
        data: {
          title: payload.title,
          synopsis: payload.synopsis,
          coverKey: payload.coverKey,
          inviteToken: randomBytes(9).toString('base64url'),
          ownerId: userId,
          memberships: { create: { userId } },
        },
        include: campaignInclude,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return reply.status(201).send(detailDto(app, campaign, userId));
  });

  app.get('/campaigns/:id', { preHandler: app.authenticate }, async (request) => {
    const { id } = campaignParamsSchema.parse(request.params);
    const prisma = requirePrisma(app);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: campaignInclude,
    });
    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    }
    return detailDto(app, campaign, request.currentUserId!);
  });
}
