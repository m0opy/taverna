import type { FastifyInstance } from 'fastify';

import { registerCampaignRoutes } from './route.js';

export async function registerCampaignsModule(app: FastifyInstance): Promise<void> {
  await registerCampaignRoutes(app);
}
