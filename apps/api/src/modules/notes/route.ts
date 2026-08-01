import type { FastifyInstance } from 'fastify';

import { AppError } from '../../lib/errors.js';
import {
  createCampaignNote,
  deleteCampaignNote,
  getNotes,
  updateCampaignNote,
} from './service.js';
import {
  noteParamsSchema,
  notesParamsSchema,
  parseNoteWriteRequest,
} from './schemas.js';

function requirePrisma(app: FastifyInstance) {
  if (!app.prisma) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Database is unavailable');
  }
  return app.prisma;
}

export async function registerNotesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/campaigns/:campaignId/notes', {preHandler: app.authenticate}, async (request) => {
    const {campaignId} = notesParamsSchema.parse(request.params);
    return getNotes(requirePrisma(app), campaignId, request.currentUserId!);
  });

  app.post('/campaigns/:campaignId/notes', {preHandler: app.authenticate}, async (request, reply) => {
    const {campaignId} = notesParamsSchema.parse(request.params);
    const payload = parseNoteWriteRequest(request.body);
    const note = await createCampaignNote(
      requirePrisma(app),
      campaignId,
      request.currentUserId!,
      payload,
    );
    return reply.status(201).send(note);
  });

  app.patch('/campaigns/:campaignId/notes/:noteId', {preHandler: app.authenticate}, async (request) => {
    const {campaignId, noteId} = noteParamsSchema.parse(request.params);
    const payload = parseNoteWriteRequest(request.body);
    return updateCampaignNote(
      requirePrisma(app),
      campaignId,
      noteId,
      request.currentUserId!,
      payload,
    );
  });

  app.delete('/campaigns/:campaignId/notes/:noteId', {preHandler: app.authenticate}, async (request, reply) => {
    const {campaignId, noteId} = noteParamsSchema.parse(request.params);
    await deleteCampaignNote(requirePrisma(app), campaignId, noteId, request.currentUserId!);
    return reply.status(204).send();
  });
}
