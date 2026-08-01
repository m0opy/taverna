import {Prisma, type PrismaClient} from '@prisma/client';
import type {NpcDto, NpcListResponse, NpcWriteRequest} from '@taverna/contracts';

import {AppError} from '../../lib/errors.js';
import {
  countNpcs,
  createNpc,
  deleteNpc,
  findActiveMembership,
  findCampaign,
  findNpc,
  findTargetNpcs,
  listNpcs,
  replaceOutgoingRelations,
  updateNpc,
  type NpcWithDetails,
  type NpcsDb,
} from './repo.js';

const npcLimit = 200;

type AccessContext = {
  campaignId: string;
  membershipId: string;
};

async function requireActiveMember(
  db: NpcsDb,
  campaignId: string,
  userId: string,
): Promise<AccessContext> {
  const campaign = await findCampaign(db, campaignId);
  if (!campaign) {
    throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
  }

  const membership = await findActiveMembership(db, campaignId, userId);
  if (!membership) {
    throw new AppError(403, 'CAMPAIGN_FORBIDDEN', 'Campaign access denied');
  }

  return {campaignId, membershipId: membership.id};
}

function toAuthor(author: NpcWithDetails['createdBy']) {
  return {
    membershipId: author.id,
    userName: author.user.name,
    characterName: author.characterName,
    isActive: author.leftAt === null,
  };
}

function npcDto(npc: NpcWithDetails): NpcDto {
  return {
    id: npc.id,
    campaignId: npc.campaignId,
    createdBy: toAuthor(npc.createdBy),
    name: npc.name,
    title: npc.title,
    attitude: npc.attitude,
    tags: npc.tags,
    notes: npc.notes,
    relations: npc.outgoingRelations.map((relation) => ({
      id: relation.id,
      toNpc: relation.toNpc,
      label: relation.label,
    })),
    createdAt: npc.createdAt.toISOString(),
    updatedAt: npc.updatedAt.toISOString(),
  };
}

function normalizeRelations(payload: NpcWriteRequest) {
  return payload.relations ?? [];
}

async function validateRelations(
  db: NpcsDb,
  campaignId: string,
  fromNpcId: string,
  relations: NpcWriteRequest['relations'],
) {
  const normalized = relations ?? [];
  if (normalized.some((relation) => relation.toNpcId === fromNpcId)) {
    throw new AppError(400, 'NPC_SELF_RELATION', 'NPC cannot relate to itself');
  }

  const targetIds = [...new Set(normalized.map((relation) => relation.toNpcId))];
  if (targetIds.length === 0) {
    return;
  }

  const targets = await findTargetNpcs(db, campaignId, targetIds);
  if (targets.length !== targetIds.length) {
    throw new AppError(404, 'RELATED_NPC_NOT_FOUND', 'Related NPC not found');
  }
}

async function saveRelations(
  db: NpcsDb,
  campaignId: string,
  fromNpcId: string,
  relations: NpcWriteRequest['relations'],
) {
  await validateRelations(db, campaignId, fromNpcId, relations);
  await replaceOutgoingRelations(db, fromNpcId, relations ?? []);
}

function availableTags(items: NpcWithDetails[]) {
  return [...new Set(items.flatMap((npc) => npc.tags))];
}

export async function getNpcs(
  db: NpcsDb,
  campaignId: string,
  userId: string,
  tag?: string,
): Promise<NpcListResponse> {
  await requireActiveMember(db, campaignId, userId);
  const allItems = await listNpcs(db, campaignId);
  const normalizedTag = tag?.trim().toLocaleLowerCase();
  const items = normalizedTag
    ? allItems.filter((npc) => npc.tags.some((item) => item.toLocaleLowerCase() === normalizedTag))
    : allItems;

  return {
    items: items.map(npcDto),
    availableTags: availableTags(allItems),
  };
}

export async function createCampaignNpc(
  db: PrismaClient,
  campaignId: string,
  userId: string,
  payload: NpcWriteRequest,
): Promise<NpcDto> {
  const context = await requireActiveMember(db, campaignId, userId);
  const npc = await db.$transaction(async (tx) => {
    if (await countNpcs(tx, campaignId) >= npcLimit) {
      throw new AppError(409, 'NPC_LIMIT_REACHED', 'NPC limit reached');
    }

    const created = await createNpc(tx, {
      campaignId,
      createdById: context.membershipId,
      name: payload.name,
      title: payload.title ?? '',
      attitude: payload.attitude ?? 'unknown',
      tags: payload.tags ?? [],
      notes: payload.notes ?? '',
    });
    await saveRelations(tx, campaignId, created.id, normalizeRelations(payload));
    return findNpc(tx, campaignId, created.id);
  }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});

  if (!npc) {
    throw new AppError(500, 'INTERNAL_ERROR', 'NPC was not created');
  }
  return npcDto(npc);
}

export async function updateCampaignNpc(
  db: PrismaClient,
  campaignId: string,
  npcId: string,
  userId: string,
  payload: NpcWriteRequest,
): Promise<NpcDto> {
  await requireActiveMember(db, campaignId, userId);
  const npc = await db.$transaction(async (tx) => {
    const current = await findNpc(tx, campaignId, npcId);
    if (!current) {
      throw new AppError(404, 'NOT_FOUND', 'NPC not found');
    }

    await saveRelations(tx, campaignId, npcId, normalizeRelations(payload));
    return updateNpc(tx, npcId, {
      name: payload.name,
      title: payload.title ?? '',
      attitude: payload.attitude ?? 'unknown',
      tags: payload.tags ?? [],
      notes: payload.notes ?? '',
    });
  }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});

  return npcDto(npc);
}

export async function deleteCampaignNpc(
  db: PrismaClient,
  campaignId: string,
  npcId: string,
  userId: string,
): Promise<void> {
  await requireActiveMember(db, campaignId, userId);
  const current = await findNpc(db, campaignId, npcId);
  if (!current) {
    throw new AppError(404, 'NOT_FOUND', 'NPC not found');
  }
  await deleteNpc(db, campaignId, npcId);
}
