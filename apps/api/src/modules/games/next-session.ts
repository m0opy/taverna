import type {Prisma, PrismaClient} from '@prisma/client';

import {calendarDateToUtcDate, currentCalendarDate} from '../../lib/calendar-date.js';

type GamesDb = PrismaClient | Prisma.TransactionClient;

function nextGameWhere(campaignId: string) {
  return {
    campaignId,
    scheduledFor: {gte: calendarDateToUtcDate(currentCalendarDate(), 'scheduledFor')!},
  };
}

async function findNextScheduledGame(db: GamesDb, campaignId: string) {
  return db.game.findFirst({
    where: nextGameWhere(campaignId),
    orderBy: [
      {scheduledFor: 'asc'},
      {scheduledTime: {sort: 'asc', nulls: 'last'}},
      {createdAt: 'asc'},
    ],
    select: {id: true, scheduledFor: true},
  });
}

export async function recomputeCampaignNextSession(db: GamesDb, campaignId: string) {
  const nextGame = await findNextScheduledGame(db, campaignId);

  await db.campaign.update({
    where: {id: campaignId},
    data: {nextSessionAt: nextGame?.scheduledFor ?? null},
  });

  return nextGame;
}

export async function moveOrCreateNextSessionGame(
  db: GamesDb,
  campaignId: string,
  scheduledFor: Date,
) {
  const nextGame = await findNextScheduledGame(db, campaignId);

  if (nextGame) {
    await db.game.update({where: {id: nextGame.id}, data: {scheduledFor}});
  } else {
    await db.game.create({
      data: {
        campaignId,
        scheduledFor,
        scheduledTime: null,
        title: 'Игра',
        description: '',
      },
    });
  }

  await recomputeCampaignNextSession(db, campaignId);
}
