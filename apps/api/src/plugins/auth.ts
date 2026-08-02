import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import type { AppEnv } from '../lib/env.js';
import { AppError } from '../lib/errors.js';

interface SessionClaims {
  sub: string;
}

const sessionClaimsSchema = z.object({ sub: z.string().uuid() });
const sessionMaxAge = 60 * 60 * 24 * 7;

export async function registerAuth(app: FastifyInstance, env: AppEnv): Promise<void> {
  app.decorate('appEnv', env);
  app.decorateRequest('currentUserId', null);

  await app.register(cookie);
  await app.register(jwt, {
    cookie: {
      cookieName: env.SESSION_COOKIE_NAME,
      signed: false,
    },
    secret: env.JWT_SECRET,
  });

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production' && !env.ALLOW_INSECURE_SESSION_COOKIES,
    path: '/',
  };

  app.decorate('setSession', (reply: FastifyReply, userId: string) => {
    const token = app.jwt.sign({ sub: userId } satisfies SessionClaims, {
      expiresIn: sessionMaxAge,
    });
    reply.setCookie(env.SESSION_COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: sessionMaxAge,
    });
  });

  app.decorate('clearSession', (reply: FastifyReply) => {
    reply.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions);
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      const payload = sessionClaimsSchema.parse(await request.jwtVerify<SessionClaims>());
      request.currentUserId = payload.sub;
    } catch {
      throw new AppError(401, 'SESSION_EXPIRED', 'Session expired');
    }
  });

  app.decorate('requireCampaignMember', async (request: FastifyRequest, campaignId?: string) => {
    if (!request.currentUserId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (!campaignId || !app.prisma) {
      return;
    }

    const campaign = await app.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    }

    const membership = await app.prisma.membership.findFirst({
      where: { campaignId, userId: request.currentUserId, leftAt: null },
      select: { id: true },
    });
    if (!membership) {
      throw new AppError(403, 'CAMPAIGN_FORBIDDEN', 'Campaign access denied');
    }
  });
}
