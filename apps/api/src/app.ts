import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import type { PrismaClient } from '@prisma/client';

import type { DatabaseHealthcheck } from './lib/database.js';
import { parseAppEnv, type AppEnv } from './lib/env.js';
import { registerAuth } from './plugins/auth.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerAuthModule } from './modules/auth/index.js';
import { registerCampaignsModule } from './modules/campaigns/index.js';
import { registerHealthModule } from './modules/health/routes.js';
import { registerMembershipsModule } from './modules/memberships/index.js';
import { registerNotesModule } from './modules/notes/index.js';
import { registerNpcsModule } from './modules/npcs/index.js';

export interface BuildAppOptions {
  env?: AppEnv;
  healthcheck?: DatabaseHealthcheck;
  logger?: FastifyServerOptions['logger'];
  prisma?: PrismaClient;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? parseAppEnv();
  const app: FastifyInstance = Fastify({
    logger:
      options.logger ??
      {
        level: env.NODE_ENV === 'development' ? 'info' : 'warn',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
      },
  });

  app.decorate('prisma', options.prisma ?? null);

  await registerErrorHandler(app);
  await registerAuth(app, env);
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: (request) => ({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        requestId: request.id,
      },
    }),
  });

  await app.register(async (scopedApp) => {
    await registerHealthModule(scopedApp, {
      healthcheck:
        options.healthcheck ??
        (async () => {
          return { databaseVersion: 'unconfigured' };
        }),
      version: env.APP_VERSION,
    });
    await registerAuthModule(scopedApp);
    await registerCampaignsModule(scopedApp);
    await registerMembershipsModule(scopedApp);
    await registerNotesModule(scopedApp);
    await registerNpcsModule(scopedApp);
  }, { prefix: '/api' });

  return app;
}
