import {afterAll, afterEach, beforeAll, describe, expect, it} from 'vitest';
import argon2 from 'argon2';

import {createDatabaseContext, type DatabaseContext} from '../src/lib/database.js';
import type {AppEnv} from '../src/lib/env.js';
import {seedDemo} from '../prisma/seed.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!databaseUrl);

suite('Demo seed integration', () => {
  let database: DatabaseContext;

  beforeAll(async () => {
    const env: AppEnv = {
      APP_ORIGIN: 'http://localhost:5173',
      APP_VERSION: 'seed-test',
      DATABASE_URL: databaseUrl!,
      ENABLE_DEMO_SEED: false,
      HOST: '127.0.0.1',
      JWT_SECRET: 'integration-secret-integration-secret-123',
      NODE_ENV: 'test',
      PORT: 3001,
      SESSION_COOKIE_NAME: 'taverna_session',
    };
    database = createDatabaseContext(env);
  });

  afterEach(async () => {
    await database.prisma.campaign.deleteMany({
      where: {inviteToken: {in: ['demoStrahd01', 'demoRavens02']}},
    });
    await database.prisma.user.deleteMany({
      where: {email: {endsWith: '@tavern.app'}},
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('creates the same populated world on every run', async () => {
    await seedDemo(database.prisma, {
      demoEmail: 'demo@tavern.app',
      demoPassword: 'local-demo-password',
    });
    await seedDemo(database.prisma, {
      demoEmail: 'demo@tavern.app',
      demoPassword: 'local-demo-password',
    });

    expect(await database.prisma.campaign.count({where: {inviteToken: {in: ['demoStrahd01', 'demoRavens02']}}})).toBe(2);
    expect(await database.prisma.note.count({where: {campaign: {inviteToken: {in: ['demoStrahd01', 'demoRavens02']}}}})).toBe(10);
    expect(await database.prisma.npc.count({where: {campaign: {inviteToken: {in: ['demoStrahd01', 'demoRavens02']}}}})).toBe(12);
    expect(await database.prisma.npcRelation.count({where: {fromNpc: {campaign: {inviteToken: 'demoStrahd01'}}}})).toBe(4);

    const demo = await database.prisma.user.findUniqueOrThrow({where: {email: 'demo@tavern.app'}});
    expect(await argon2.verify(demo.passwordHash, 'local-demo-password')).toBe(true);
    expect(await database.prisma.membership.count({where: {userId: demo.id, leftAt: null}})).toBe(2);
  });
});
