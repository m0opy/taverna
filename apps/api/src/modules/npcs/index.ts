import type { FastifyInstance } from 'fastify';
import {registerNpcsRoutes} from './route.js';

export async function registerNpcsModule(app: FastifyInstance): Promise<void> {
  await registerNpcsRoutes(app);
}
