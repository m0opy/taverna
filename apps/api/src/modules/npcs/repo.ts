import type {Prisma, PrismaClient} from '@prisma/client';

export type NpcsDb = PrismaClient | Prisma.TransactionClient;

const npcInclude = {
  createdBy: {
    select: {
      id: true,
      userId: true,
      characterName: true,
      leftAt: true,
      user: {select: {name: true}},
    },
  },
  outgoingRelations: {
    select: {
      id: true,
      label: true,
      toNpc: {select: {id: true, name: true}},
    },
    orderBy: {id: 'asc'},
  },
} satisfies Prisma.NpcInclude;

export type NpcWithDetails = Prisma.NpcGetPayload<{include: typeof npcInclude}>;

export function findCampaign(db: NpcsDb, campaignId: string) {
  return db.campaign.findUnique({
    where: {id: campaignId},
    select: {id: true, ownerId: true},
  });
}

export function findActiveMembership(db: NpcsDb, campaignId: string, userId: string) {
  return db.membership.findFirst({
    where: {campaignId, userId, leftAt: null},
    select: {id: true},
  });
}

export function listNpcs(db: NpcsDb, campaignId: string) {
  return db.npc.findMany({
    where: {campaignId},
    include: npcInclude,
    orderBy: [{updatedAt: 'desc'}, {id: 'asc'}],
  });
}

export function countNpcs(db: NpcsDb, campaignId: string) {
  return db.npc.count({where: {campaignId}});
}

export function findNpc(db: NpcsDb, campaignId: string, npcId: string) {
  return db.npc.findFirst({
    where: {id: npcId, campaignId},
    include: npcInclude,
  });
}

export function findTargetNpcs(db: NpcsDb, campaignId: string, npcIds: string[]) {
  return db.npc.findMany({
    where: {campaignId, id: {in: npcIds}},
    select: {id: true},
  });
}

export function createNpc(
  db: NpcsDb,
  data: {
    campaignId: string;
    createdById: string;
    name: string;
    title: string;
    attitude: 'ally' | 'neutral' | 'enemy' | 'unknown';
    tags: string[];
    notes: string;
  },
) {
  return db.npc.create({data, include: npcInclude});
}

export function updateNpc(
  db: NpcsDb,
  npcId: string,
  data: {
    name: string;
    title: string;
    attitude: 'ally' | 'neutral' | 'enemy' | 'unknown';
    tags: string[];
    notes: string;
  },
) {
  return db.npc.update({where: {id: npcId}, data, include: npcInclude});
}

export function replaceOutgoingRelations(
  db: NpcsDb,
  fromNpcId: string,
  relations: Array<{toNpcId: string; label: string}>,
) {
  return (async () => {
    await db.npcRelation.deleteMany({where: {fromNpcId}});
    for (const relation of relations) {
      await db.npcRelation.create({data: {...relation, fromNpcId}});
    }
  })();
}

export function deleteNpc(db: NpcsDb, campaignId: string, npcId: string) {
  return db.npc.delete({where: {id: npcId, campaignId}});
}
