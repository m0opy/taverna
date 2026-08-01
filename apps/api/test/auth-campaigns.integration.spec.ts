import {afterAll, afterEach, beforeAll, describe, expect, it} from 'vitest';

import {buildApp} from '../src/app.js';
import {createDatabaseContext, type DatabaseContext} from '../src/lib/database.js';
import type {AppEnv} from '../src/lib/env.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!databaseUrl);

function cookieFrom(headers: Record<string, string | string[] | undefined>): string {
  const value = headers['set-cookie'];
  const cookie = Array.isArray(value) ? value[0] : value;
  if (!cookie) throw new Error('Expected Set-Cookie header');
  return cookie.split(';', 1)[0]!;
}

suite('Task 002 auth and campaign integration', () => {
  let database: DatabaseContext;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    const env: AppEnv = {
      APP_ORIGIN: 'http://localhost:5173',
      APP_VERSION: 'task-002-test',
      DATABASE_URL: databaseUrl!,
      DEMO_EMAIL: 'guest@example.com',
      DEMO_PASSWORD: 'strong-password',
      ENABLE_DEMO_SEED: false,
      HOST: '127.0.0.1',
      JWT_SECRET: 'integration-secret-integration-secret-123',
      NODE_ENV: 'test',
      PORT: 3001,
      SESSION_COOKIE_NAME: 'taverna_session',
    };
    database = createDatabaseContext(env);
    app = await buildApp({env, logger: false, prisma: database.prisma});
  });

  afterEach(async () => {
    await database.prisma.campaign.deleteMany();
    await database.prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await database.close();
  });

  async function register(name: string, email: string) {
    const response = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: {name, email, password: 'strong-password'},
    });
    expect(response.statusCode).toBe(201);
    return {body: response.json(), cookie: cookieFrom(response.headers)};
  }

  it('registers, normalizes email, restores session, logs in and logs out', async () => {
    const owner = await register('  Полина  ', '  POLINA@example.com ');
    expect(owner.body).toMatchObject({name: 'Полина', email: 'polina@example.com'});
    expect(String((await app.inject({method: 'GET', url: '/api/auth/me', headers: {cookie: owner.cookie}})).statusCode)).toBe('200');

    const duplicate = await app.inject({method: 'POST', url: '/api/auth/register', payload: {name: 'Другая', email: 'Polina@Example.com', password: 'strong-password'}});
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.code).toBe('EMAIL_TAKEN');

    const invalid = await app.inject({method: 'POST', url: '/api/auth/login', payload: {email: 'polina@example.com', password: 'wrong-password'}});
    expect(invalid.statusCode).toBe(401);
    expect(invalid.json().error.code).toBe('INVALID_CREDENTIALS');

    const login = await app.inject({method: 'POST', url: '/api/auth/login', payload: {email: 'POLINA@example.com', password: 'strong-password'}});
    expect(login.statusCode).toBe(200);
    const logout = await app.inject({method: 'POST', url: '/api/auth/logout', headers: {cookie: cookieFrom(login.headers)}});
    expect(logout.statusCode).toBe(204);
    expect(logout.body).toBe('');
    expect(String(logout.headers['set-cookie'])).toContain('Max-Age=0');
  });

  it('logs into the configured demo account through the guest flow', async () => {
    await register('Демо-гость', 'guest@example.com');

    const guestLogin = await app.inject({method: 'POST', url: '/api/auth/guest'});
    expect(guestLogin.statusCode).toBe(200);
    expect(guestLogin.json()).toMatchObject({name: 'Демо-гость', email: 'guest@example.com'});
    expect(String(guestLogin.headers['set-cookie'])).toContain('taverna_session=');
  });

  it('creates campaign with owner membership and forbids an outsider', async () => {
    const owner = await register('Мастер', 'master@example.com');
    const created = await app.inject({method: 'POST', url: '/api/campaigns', headers: {cookie: owner.cookie}, payload: {title: 'Красный тракт', synopsis: 'Дорога зовёт', coverKey: 'forest'}});
    expect(created.statusCode).toBe(201);
    const campaign = created.json();
    expect(campaign).toMatchObject({title: 'Красный тракт', myRole: 'master', membersCount: 1});
    expect(campaign.members[0]).toMatchObject({isOwner: true});
    expect(await database.prisma.membership.count({where: {campaignId: campaign.id, leftAt: null}})).toBe(1);

    const outsider = await register('Чужак', 'outsider@example.com');
    const forbidden = await app.inject({method: 'GET', url: `/api/campaigns/${campaign.id}`, headers: {cookie: outsider.cookie}});
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.json().error.code).toBe('CAMPAIGN_FORBIDDEN');
  });

  it('previews invite, joins once and rejects a repeated join', async () => {
    const owner = await register('Мастер', 'master@example.com');
    const created = await app.inject({method: 'POST', url: '/api/campaigns', headers: {cookie: owner.cookie}, payload: {title: 'Тихая гавань', coverKey: 'sea'}});
    const campaign = created.json();
    const token = new URL(campaign.inviteUrl).pathname.split('/').pop()!;

    const invalidPreview = await app.inject({method: 'GET', url: '/api/invites/not-a-real-token'});
    expect(invalidPreview.statusCode).toBe(404);
    expect(invalidPreview.json().error.code).toBe('INVITE_INVALID');

    const preview = await app.inject({method: 'GET', url: `/api/invites/${token}`});
    expect(preview.statusCode).toBe(200);
    expect(preview.json()).toMatchObject({title: 'Тихая гавань', ownerName: 'Мастер', membersCount: 1, isFull: false});

    const player = await register('Игрок', 'player@example.com');
    const joined = await app.inject({method: 'POST', url: `/api/invites/${token}/join`, headers: {cookie: player.cookie}, payload: {characterName: 'Мира', characterClass: 'Следопыт'}});
    expect(joined.statusCode).toBe(201);
    expect(joined.json()).toMatchObject({campaignId: campaign.id, membership: {characterName: 'Мира', isOwner: false}});

    const repeated = await app.inject({method: 'POST', url: `/api/invites/${token}/join`, headers: {cookie: player.cookie}, payload: {characterName: 'Мира'}});
    expect(repeated.statusCode).toBe(409);
    expect(repeated.json().error).toMatchObject({code: 'ALREADY_MEMBER', meta: {campaignId: campaign.id}});

    const detail = await app.inject({method: 'GET', url: `/api/campaigns/${campaign.id}`, headers: {cookie: player.cookie}});
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({myRole: 'player', inviteUrl: null, membersCount: 2});
  });

  it('lets only the owner update campaign fields and rotate an invite', async () => {
    const owner = await register('Мастер', 'owner-settings@example.com');
    const created = await app.inject({method: 'POST', url: '/api/campaigns', headers: {cookie: owner.cookie}, payload: {title: 'Старая башня', coverKey: 'forest'}});
    const campaign = created.json();
    const oldToken = new URL(campaign.inviteUrl).pathname.split('/').pop()!;
    const player = await register('Игрок', 'player-settings@example.com');
    await app.inject({method: 'POST', url: `/api/invites/${oldToken}/join`, headers: {cookie: player.cookie}, payload: {characterName: 'Мира'}});

    const forbidden = await app.inject({method: 'PATCH', url: `/api/campaigns/${campaign.id}`, headers: {cookie: player.cookie}, payload: {title: 'Нельзя'}});
    expect(forbidden.statusCode).toBe(403);
    const invalidDate = await app.inject({method: 'PATCH', url: `/api/campaigns/${campaign.id}`, headers: {cookie: owner.cookie}, payload: {nextSessionAt: '2026-02-30'}});
    expect(invalidDate.statusCode).toBe(400);
    const updated = await app.inject({method: 'PATCH', url: `/api/campaigns/${campaign.id}`, headers: {cookie: owner.cookie}, payload: {title: 'Новая башня', synopsis: 'Туман', coverKey: 'city', nextSessionAt: '2026-08-12'}});
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({title: 'Новая башня', nextSessionAt: '2026-08-12'});
    const cleared = await app.inject({method: 'PATCH', url: `/api/campaigns/${campaign.id}`, headers: {cookie: owner.cookie}, payload: {nextSessionAt: null}});
    expect(cleared.json().nextSessionAt).toBeNull();

    const rotated = await app.inject({method: 'POST', url: `/api/campaigns/${campaign.id}/invite/rotate`, headers: {cookie: owner.cookie}});
    expect(rotated.statusCode).toBe(200);
    expect(await app.inject({method: 'GET', url: `/api/invites/${oldToken}`})).toMatchObject({statusCode: 404});
  });

  it('records player leave, lets owner remove a player and requires exact campaign deletion confirmation', async () => {
    const owner = await register('Мастер', 'owner-members@example.com');
    const created = await app.inject({method: 'POST', url: '/api/campaigns', headers: {cookie: owner.cookie}, payload: {title: 'Лунный путь', coverKey: 'sea'}});
    const campaign = created.json();
    const token = new URL(campaign.inviteUrl).pathname.split('/').pop()!;
    const player = await register('Игрок', 'player-members@example.com');
    const join = await app.inject({method: 'POST', url: `/api/invites/${token}/join`, headers: {cookie: player.cookie}, payload: {characterName: 'Лис'}});
    const membershipId = join.json().membership.id;
    expect((await app.inject({method: 'DELETE', url: `/api/campaigns/${campaign.id}/members/${membershipId}`, headers: {cookie: player.cookie}})).statusCode).toBe(204);
    expect(await database.prisma.membership.findUnique({where: {id: membershipId}})).toMatchObject({leftAt: expect.any(Date)});
    const ownerLeave = await app.inject({method: 'DELETE', url: `/api/campaigns/${campaign.id}/members/${campaign.myMembershipId}`, headers: {cookie: owner.cookie}});
    expect(ownerLeave.statusCode).toBe(403);
    const wrong = await app.inject({method: 'DELETE', url: `/api/campaigns/${campaign.id}`, headers: {cookie: owner.cookie}, payload: {confirmationTitle: 'Не то'}});
    expect(wrong.statusCode).toBe(400);
    expect((await app.inject({method: 'DELETE', url: `/api/campaigns/${campaign.id}`, headers: {cookie: owner.cookie}, payload: {confirmationTitle: 'Лунный путь'}})).statusCode).toBe(204);
  });
});
