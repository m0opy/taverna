import type { FastifyInstance } from 'fastify';

import type { DatabaseHealthcheck } from '../../lib/database.js';

export interface HealthModuleOptions {
  demoLoginAvailable: boolean;
  healthcheck: DatabaseHealthcheck;
  version: string;
}

export async function registerHealthModule(
  app: FastifyInstance,
  options: HealthModuleOptions,
): Promise<void> {
  app.get('/health', async (_request, reply) => {
    try {
      await withTimeout(options.healthcheck(), 2_000);

      return reply.status(200).send({
        demoLoginAvailable: options.demoLoginAvailable,
        status: 'ok',
        database: 'up',
        version: options.version,
        timestamp: new Date().toISOString(),
      });
    } catch {
      return reply.status(503).send({
        demoLoginAvailable: options.demoLoginAvailable,
        status: 'degraded',
        database: 'down',
      });
    }
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}
