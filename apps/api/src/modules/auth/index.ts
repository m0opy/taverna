import type { FastifyInstance } from 'fastify';
import { hash, verify } from 'argon2';
import { Prisma } from '@prisma/client';
import {
  loginRequestSchema,
  registerRequestSchema,
  type UserDto,
} from '@taverna/contracts';

import { AppError } from '../../lib/errors.js';

function userDto(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

function requirePrisma(app: FastifyInstance) {
  if (!app.prisma) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Database is unavailable');
  }
  return app.prisma;
}

const authRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '1 minute',
    },
  },
};

export async function registerAuthModule(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', authRateLimit, async (request, reply) => {
    const payload = registerRequestSchema.parse(request.body);
    const prisma = requirePrisma(app);

    try {
      const user = await prisma.user.create({
        data: {
          name: payload.name,
          email: payload.email,
          passwordHash: await hash(payload.password),
        },
      });
      app.setSession(reply, user.id);
      return reply.status(201).send(userDto(user));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(409, 'EMAIL_TAKEN', 'Email is already registered', {
          fields: { email: 'Email is already registered' },
        });
      }
      throw error;
    }
  });

  app.post('/auth/login', authRateLimit, async (request, reply) => {
    const payload = loginRequestSchema.parse(request.body);
    const user = await requirePrisma(app).user.findUnique({
      where: { email: payload.email },
    });
    const passwordMatches = user ? await verify(user.passwordHash, payload.password) : false;

    if (!user || !passwordMatches) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    app.setSession(reply, user.id);
    return reply.send(userDto(user));
  });

  app.post('/auth/guest', authRateLimit, async (_request, reply) => {
    if (!app.appEnv.DEMO_PASSWORD) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Demo login is not configured');
    }

    const user = await requirePrisma(app).user.findUnique({
      where: {email: app.appEnv.DEMO_EMAIL},
    });
    const passwordMatches = user ? await verify(user.passwordHash, app.appEnv.DEMO_PASSWORD) : false;

    if (!user || !passwordMatches) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid demo credentials');
    }

    app.setSession(reply, user.id);
    return reply.send(userDto(user));
  });

  app.post('/auth/logout', async (_request, reply) => {
    app.clearSession(reply);
    return reply.status(204).send();
  });

  app.get('/auth/me', { preHandler: app.authenticate }, async (request) => {
    const user = await requirePrisma(app).user.findUnique({
      where: { id: request.currentUserId! },
    });
    if (!user) {
      throw new AppError(401, 'SESSION_EXPIRED', 'Session expired');
    }
    return userDto(user);
  });
}
