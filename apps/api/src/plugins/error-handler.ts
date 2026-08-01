import type { FastifyInstance } from 'fastify';

import { toAppError } from '../lib/errors.js';

export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((error, request, reply) => {
    const appError = toAppError(error);

    if (appError.statusCode >= 500) {
      request.log.error({ err: error }, 'Unhandled request error');
    }

    void reply.status(appError.statusCode).send({
      error: {
        code: appError.code,
        message: appError.message,
        fields: appError.fields,
        meta: appError.meta,
        requestId: request.id,
      },
    });
  });
}
