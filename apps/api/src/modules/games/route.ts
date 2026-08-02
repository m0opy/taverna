import type {FastifyInstance} from 'fastify';

import {AppError} from '../../lib/errors.js';
import {createCampaignGame, deleteCampaignGame, getCampaignGames, updateCampaignGame} from './service.js';
import {
  gameParamsSchema,
  gamesParamsSchema,
  parseGameListQuery,
  parseGameUpdateRequest,
  parseGameWriteRequest,
} from './schemas.js';

function requirePrisma(app: FastifyInstance) {
  if (!app.prisma) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Database is unavailable');
  }
  return app.prisma;
}

export async function registerGamesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/campaigns/:campaignId/games', {preHandler: app.authenticate}, async (request) => {
    const {campaignId} = gamesParamsSchema.parse(request.params);
    return getCampaignGames(requirePrisma(app), campaignId, request.currentUserId!, parseGameListQuery(request.query));
  });

  app.post('/campaigns/:campaignId/games', {preHandler: app.authenticate}, async (request, reply) => {
    const {campaignId} = gamesParamsSchema.parse(request.params);
    const game = await createCampaignGame(requirePrisma(app), campaignId, request.currentUserId!, parseGameWriteRequest(request.body));
    return reply.status(201).send(game);
  });

  app.patch('/campaigns/:campaignId/games/:gameId', {preHandler: app.authenticate}, async (request) => {
    const {campaignId, gameId} = gameParamsSchema.parse(request.params);
    return updateCampaignGame(requirePrisma(app), campaignId, gameId, request.currentUserId!, parseGameUpdateRequest(request.body));
  });

  app.delete('/campaigns/:campaignId/games/:gameId', {preHandler: app.authenticate}, async (request, reply) => {
    const {campaignId, gameId} = gameParamsSchema.parse(request.params);
    await deleteCampaignGame(requirePrisma(app), campaignId, gameId, request.currentUserId!);
    return reply.status(204).send();
  });
}
