import type { ErrorCode } from '@taverna/contracts';
import { ZodError } from 'zod';

export type AppErrorFields = Record<string, string> | undefined;
export type AppErrorMeta = Record<string, unknown> | undefined;

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly fields?: AppErrorFields;
  readonly meta?: AppErrorMeta;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    options?: {
      fields?: AppErrorFields;
      meta?: AppErrorMeta;
    },
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.fields = options?.fields;
    this.meta = options?.meta;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    const fields = Object.fromEntries(
      error.issues.map((issue) => [
        issue.path.join('.') || 'root',
        issue.message,
      ]),
    );

    return new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
      fields,
    });
  }

  if (isJwtAuthError(error)) {
    return new AppError(401, 'SESSION_EXPIRED', 'Session expired');
  }

  return new AppError(500, 'INTERNAL_ERROR', 'Internal server error');
}

function isJwtAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';
  return (
    error.name === 'JsonWebTokenError' ||
    error.name === 'TokenExpiredError' ||
    code.startsWith('FST_JWT_')
  );
}
