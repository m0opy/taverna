import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {createCampaignRequestSchema, deleteCampaignRequestSchema, updateCampaignRequestSchema} from '@taverna/contracts';
import {AppError} from '../../lib/errors.js';
import {createCampaign, deleteCampaign, getCampaign, listCampaigns, rotateInvite, updateCampaign} from './service.js';

const params = z.strictObject({id: z.string().uuid()});

export async function registerCampaignRoutes(app: FastifyInstance) {
  app.get('/campaigns', {preHandler: app.authenticate}, async (request) => listCampaigns(app, request.currentUserId!));
  app.post('/campaigns', {preHandler: app.authenticate}, async (request, reply) => reply.status(201).send(await createCampaign(app, request.currentUserId!, createCampaignRequestSchema.parse(request.body))));
  app.get('/campaigns/:id', {preHandler: app.authenticate}, async (request) => getCampaign(app, params.parse(request.params).id, request.currentUserId!));
  app.patch('/campaigns/:id', {preHandler: app.authenticate}, async (request) => updateCampaign(app, params.parse(request.params).id, request.currentUserId!, updateCampaignRequestSchema.parse(request.body)));
  app.post('/campaigns/:id/invite/rotate', {preHandler: app.authenticate}, async (request) => rotateInvite(app, params.parse(request.params).id, request.currentUserId!));
  app.delete('/campaigns/:id', {preHandler: app.authenticate}, async (request, reply) => {
    await deleteCampaign(app, params.parse(request.params).id, request.currentUserId!, deleteCampaignRequestSchema.parse(request.body));
    return reply.status(204).send();
  });
}
