import type {FastifyInstance} from 'fastify';

import {registerGamesRoutes} from './route.js';

export async function registerGamesModule(app: FastifyInstance): Promise<void> {
  await registerGamesRoutes(app);
}
