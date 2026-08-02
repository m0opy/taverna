import type {Prisma, PrismaClient} from '@prisma/client';

export type GamesDb = PrismaClient | Prisma.TransactionClient;

export function findCampaign(db: GamesDb, campaignId: string) {
  return db.campaign.findUnique({
    where: {id: campaignId},
    select: {id: true, ownerId: true},
  });
}

export function findActiveMembership(db: GamesDb, campaignId: string, userId: string) {
  return db.membership.findFirst({
    where: {campaignId, userId, leftAt: null},
    select: {id: true},
  });
}

export function listGamesForMonth(db: GamesDb, campaignId: string, from: Date, until: Date) {
  return db.game.findMany({
    where: {
      campaignId,
      scheduledFor: {gte: from, lt: until},
    },
    orderBy: [
      {scheduledFor: 'asc'},
      {scheduledTime: {sort: 'asc', nulls: 'last'}},
      {createdAt: 'asc'},
    ],
  });
}

export function createGame(
  db: GamesDb,
  data: {
    campaignId: string;
    scheduledFor: Date;
    scheduledTime: string | null;
    title: string;
    description: string;
  },
) {
  return db.game.create({data});
}

export function findGame(db: GamesDb, campaignId: string, gameId: string) {
  return db.game.findFirst({where: {id: gameId, campaignId}});
}

export function updateGame(
  db: GamesDb,
  gameId: string,
  data: Prisma.GameUpdateInput,
) {
  return db.game.update({where: {id: gameId}, data});
}

export function deleteGame(db: GamesDb, gameId: string) {
  return db.game.delete({where: {id: gameId}});
}
