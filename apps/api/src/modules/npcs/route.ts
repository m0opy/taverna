import type {FastifyInstance} from 'fastify';

import {AppError} from '../../lib/errors.js';
import {
  createCampaignNpc,
  deleteCampaignNpc,
  getNpcs,
  updateCampaignNpc,
} from './service.js';
import {npcParamsSchema, npcsParamsSchema, parseNpcListQuery, parseNpcWriteRequest} from './schemas.js';

function requirePrisma(app: FastifyInstance) {
  if (!app.prisma) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Database is unavailable');
  }
  return app.prisma;
}

export async function registerNpcsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/campaigns/:campaignId/npcs', {preHandler: app.authenticate}, async (request) => {
    const {campaignId} = npcsParamsSchema.parse(request.params);
    const {tag} = parseNpcListQuery(request.query);
    return getNpcs(requirePrisma(app), campaignId, request.currentUserId!, tag);
  });

  app.post('/campaigns/:campaignId/npcs', {preHandler: app.authenticate}, async (request, reply) => {
    const {campaignId} = npcsParamsSchema.parse(request.params);
    const payload = parseNpcWriteRequest(request.body);
    const npc = await createCampaignNpc(requirePrisma(app), campaignId, request.currentUserId!, payload);
    return reply.status(201).send(npc);
  });

  app.patch('/campaigns/:campaignId/npcs/:npcId', {preHandler: app.authenticate}, async (request) => {
    const {campaignId, npcId} = npcParamsSchema.parse(request.params);
    const payload = parseNpcWriteRequest(request.body);
    return updateCampaignNpc(requirePrisma(app), campaignId, npcId, request.currentUserId!, payload);
  });

  app.delete('/campaigns/:campaignId/npcs/:npcId', {preHandler: app.authenticate}, async (request, reply) => {
    const {campaignId, npcId} = npcParamsSchema.parse(request.params);
    await deleteCampaignNpc(requirePrisma(app), campaignId, npcId, request.currentUserId!);
    return reply.status(204).send();
  });
}
