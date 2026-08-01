import type {ErrorCode, ErrorResponse} from '@taverna/contracts';

export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    public readonly status: number,
    message: string,
    public readonly code: ErrorCode | 'UNKNOWN' = 'UNKNOWN',
    public readonly fields?: Record<string, string>,
    public readonly meta?: Record<string, unknown>,
    public readonly requestId?: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? ((await response.json().catch(() => null)) as ErrorResponse | T | null) : null;

  if (!response.ok) {
    const error = (payload as ErrorResponse | null)?.error;
    throw new ApiError(
      response.status,
      error?.message ?? 'Не удалось выполнить запрос',
      error?.code ?? 'UNKNOWN',
      error?.fields,
      error?.meta,
      error?.requestId,
    );
  }

  if (response.status === 204) return undefined as T;
  return payload as T;
}
