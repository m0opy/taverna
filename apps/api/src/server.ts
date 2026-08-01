import { buildApp } from './app.js';
import { createDatabaseContext } from './lib/database.js';
import { parseAppEnv } from './lib/env.js';

async function main(): Promise<void> {
  const env = parseAppEnv();
  const database = createDatabaseContext(env);
  const app = await buildApp({
    env,
    healthcheck: database.healthcheck,
    prisma: database.prisma,
  });

  app.addHook('onClose', async () => {
    await database.close();
  });

  const shutdown = async (signal: NodeJS.Signals) => {
    app.log.info({ signal }, 'Shutting down API server');
    await app.close();
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void shutdown(signal);
    });
  }

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT,
    });
  } catch (error) {
    app.log.error({ err: error }, 'Failed to start API server');
    await app.close();
    process.exit(1);
  }
}

void main();
