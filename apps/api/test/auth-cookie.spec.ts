import Fastify from 'fastify';
import {describe, expect, it} from 'vitest';

import type {AppEnv} from '../src/lib/env.js';
import {registerAuth} from '../src/plugins/auth.js';

const sessionUserId = '11111111-1111-4111-8111-111111111111';

function productionEnv(allowInsecureSessionCookies: boolean): AppEnv {
  return {
    APP_ORIGIN: 'http://localhost:5173',
    APP_VERSION: 'auth-cookie-test',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/taverna_test',
    DEMO_EMAIL: 'demo@example.com',
    DEMO_PASSWORD: 'strong-password',
    ENABLE_DEMO_SEED: false,
    HOST: '127.0.0.1',
    JWT_SECRET: 'test-secret-test-secret-test-secret',
    NODE_ENV: 'production',
    PORT: 3001,
    SESSION_COOKIE_NAME: 'taverna_session',
    ALLOW_INSECURE_SESSION_COOKIES: allowInsecureSessionCookies,
  };
}

async function issueSessionCookie(allowInsecureSessionCookies: boolean): Promise<string> {
  const app = Fastify();
  await registerAuth(app, productionEnv(allowInsecureSessionCookies));
  app.get('/session', (_request, reply) => {
    app.setSession(reply, sessionUserId);
    return reply.code(204).send();
  });

  try {
    const response = await app.inject({method: 'GET', url: '/session'});
    expect(response.statusCode).toBe(204);
    return String(response.headers['set-cookie']);
  } finally {
    await app.close();
  }
}

describe('session cookie transport', () => {
  it('relaxes Secure only when temporary HTTP is explicitly enabled', async () => {
    await expect(issueSessionCookie(false)).resolves.toContain('Secure');
    await expect(issueSessionCookie(true)).resolves.not.toContain('Secure');
  });
});
