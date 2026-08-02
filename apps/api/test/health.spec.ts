import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import type { AppEnv } from '../src/lib/env.js';

const testEnv: AppEnv = {
  APP_ORIGIN: 'http://localhost:5173',
  APP_VERSION: '0.1.0-test',
  ALLOW_INSECURE_SESSION_COOKIES: false,
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/taverna_test',
  DEMO_EMAIL: 'demo@tavern.app',
  ENABLE_DEMO_SEED: false,
  HOST: '127.0.0.1',
  JWT_SECRET: 'test-secret-test-secret-test-secret',
  NODE_ENV: 'test',
  PORT: 3001,
  SESSION_COOKIE_NAME: 'taverna_session',
};

const apps = new Set<Awaited<ReturnType<typeof buildApp>>>();

afterEach(async () => {
  await Promise.all([...apps].map((app) => app.close()));
  apps.clear();
});

describe('GET /api/health', () => {
  it('returns 200 when the healthcheck passes', async () => {
    const app = await buildApp({
      env: testEnv,
      healthcheck: async () => ({ databaseVersion: 'PostgreSQL 18.0' }),
      logger: false,
    });
    apps.add(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      demoLoginAvailable: false,
      status: 'ok',
      database: 'up',
      version: '0.1.0-test',
    });
  });

  it('returns 503 when the healthcheck fails', async () => {
    const app = await buildApp({
      env: testEnv,
      healthcheck: async () => {
        throw new Error('database down');
      },
      logger: false,
    });
    apps.add(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      demoLoginAvailable: false,
      status: 'degraded',
      database: 'down',
    });
  });

  it('exposes demo login capability only when demo seed and credentials are configured', async () => {
    const app = await buildApp({
      env: {
        ...testEnv,
        DEMO_PASSWORD: '12345678',
        ENABLE_DEMO_SEED: true,
      },
      healthcheck: async () => ({ databaseVersion: 'PostgreSQL 18.0' }),
      logger: false,
    });
    apps.add(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      demoLoginAvailable: true,
      status: 'ok',
    });
  });
});
