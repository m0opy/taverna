import type { FastifyInstance } from 'fastify';

import { registerMembershipRoutes } from './route.js';

export async function registerMembershipsModule(app: FastifyInstance): Promise<void> {
  await registerMembershipRoutes(app);
}
