import type { FastifyInstance } from 'fastify';

import {registerNotesRoutes} from './route.js';

export async function registerNotesModule(app: FastifyInstance): Promise<void> {
  await registerNotesRoutes(app);
}
