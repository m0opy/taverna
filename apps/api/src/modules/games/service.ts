import type {CreateGameRequest, GameDto, GameListQuery, GameListResponse, UpdateGameRequest} from '@taverna/contracts';
import type {PrismaClient} from '@prisma/client';

import {calendarDateToUtcDate, monthRangeToUtcDates, serializeCalendarDate} from '../../lib/calendar-date.js';
import {AppError} from '../../lib/errors.js';
import {recomputeCampaignNextSession} from './next-session.js';
import {
  createGame,
  deleteGame,
  findActiveMembership,
  findCampaign,
  findGame,
  listGamesForMonth,
  updateGame,
  type GamesDb,
} from './repo.js';

async function requireCampaignMember(db: GamesDb, campaignId: string, userId: string) {
  const campaign = await findCampaign(db, campaignId);
  if (!campaign) {
    throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
  }

  const membership = await findActiveMembership(db, campaignId, userId);
  if (!membership) {
    throw new AppError(403, 'CAMPAIGN_FORBIDDEN', 'Campaign access denied');
  }

  return campaign;
}

async function requireCampaignOwner(db: GamesDb, campaignId: string, userId: string) {
  const campaign = await requireCampaignMember(db, campaignId, userId);
  if (campaign.ownerId !== userId) {
    throw new AppError(403, 'CAMPAIGN_FORBIDDEN', 'Campaign owner access required');
  }
}

function gameDto(game: {
  id: string;
  campaignId: string;
  scheduledFor: Date;
  scheduledTime: string | null;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}): GameDto {
  return {
    id: game.id,
    campaignId: game.campaignId,
    scheduledFor: serializeCalendarDate(game.scheduledFor)!,
    scheduledTime: game.scheduledTime,
    title: game.title,
    description: game.description,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
}

export async function getCampaignGames(
  db: GamesDb,
  campaignId: string,
  userId: string,
  query: GameListQuery,
): Promise<GameListResponse> {
  await requireCampaignMember(db, campaignId, userId);
  const {from, until} = monthRangeToUtcDates(query.month, 'month');
  const items = await listGamesForMonth(db, campaignId, from, until);
  return {items: items.map(gameDto)};
}

export async function createCampaignGame(
  db: PrismaClient,
  campaignId: string,
  userId: string,
  payload: CreateGameRequest,
): Promise<GameDto> {
  const game = await db.$transaction(async (tx) => {
    await requireCampaignOwner(tx, campaignId, userId);
    const created = await createGame(tx, {
      campaignId,
      scheduledFor: calendarDateToUtcDate(payload.scheduledFor, 'scheduledFor')!,
      scheduledTime: payload.scheduledTime,
      title: payload.title,
      description: payload.description,
    });
    await recomputeCampaignNextSession(tx, campaignId);
    return created;
  });

  return gameDto(game);
}

export async function updateCampaignGame(
  db: PrismaClient,
  campaignId: string,
  gameId: string,
  userId: string,
  payload: UpdateGameRequest,
): Promise<GameDto> {
  const updated = await db.$transaction(async (tx) => {
    await requireCampaignOwner(tx, campaignId, userId);
    const game = await findGame(tx, campaignId, gameId);
    if (!game) {
      throw new AppError(404, 'NOT_FOUND', 'Game not found');
    }

    const next = await updateGame(tx, gameId, {
      ...payload,
      ...(payload.scheduledFor === undefined
        ? {}
        : {scheduledFor: calendarDateToUtcDate(payload.scheduledFor, 'scheduledFor')!}),
    });
    await recomputeCampaignNextSession(tx, campaignId);
    return next;
  });

  return gameDto(updated);
}

export async function deleteCampaignGame(
  db: PrismaClient,
  campaignId: string,
  gameId: string,
  userId: string,
): Promise<void> {
  await db.$transaction(async (tx) => {
    await requireCampaignOwner(tx, campaignId, userId);
    const game = await findGame(tx, campaignId, gameId);
    if (!game) {
      throw new AppError(404, 'NOT_FOUND', 'Game not found');
    }

    await deleteGame(tx, gameId);
    await recomputeCampaignNextSession(tx, campaignId);
  });
}
