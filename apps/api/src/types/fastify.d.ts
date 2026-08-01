import type { AppEnv } from '../lib/env.js';
import type { PrismaClient } from '@prisma/client';
import type { FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    appEnv: AppEnv;
    prisma: PrismaClient | null;
    authenticate(request: FastifyRequest): Promise<void>;
    requireCampaignMember(request: FastifyRequest, campaignId?: string): Promise<void>;
    setSession(reply: FastifyReply, userId: string): void;
    clearSession(reply: FastifyReply): void;
  }

  interface FastifyRequest {
    currentUserId: string | null;
  }
}
