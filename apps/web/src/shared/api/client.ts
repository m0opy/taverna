import type {ErrorCode, ErrorResponse} from '@taverna/contracts';

import {notifyUnauthorized} from './auth-events';

const DEFAULT_ERROR_MESSAGE = 'Не удалось выполнить запрос';
const NETWORK_ERROR_MESSAGE = 'Не удалось связаться с таверной. Проверьте соединение и попробуйте снова.';
const DEFAULT_VALIDATION_MESSAGE = 'Проверьте поля формы и попробуйте снова.';
const PUBLIC_AUTH_PATHS = new Set(['/auth/login', '/auth/register', '/auth/guest', '/auth/me']);

const localizedMessages: Partial<Record<ErrorCode | 'UNKNOWN' | 'NETWORK_ERROR', string>> = {
  ACTIVE_MEMBERSHIP_NOT_FOUND: 'Активное участие не найдено.',
  ALREADY_MEMBER: 'Вы уже состоите в этой кампании.',
  CAMPAIGN_FORBIDDEN: 'У вас нет доступа к этой кампании.',
  CAMPAIGN_FULL: 'В кампании уже максимум участников.',
  CAMPAIGN_LIMIT_REACHED: 'Вы достигли лимита кампаний.',
  CHARACTER_NAME_REQUIRED: 'Укажите имя персонажа.',
  CONFIRMATION_MISMATCH: 'Подтверждение не совпадает.',
  EMAIL_TAKEN: 'Этот email уже зарегистрирован',
  FORBIDDEN: 'Недостаточно прав для этого действия.',
  INTERNAL_ERROR: 'Сервис временно недоступен. Попробуйте еще раз позже.',
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  INVITE_INVALID: 'Приглашение недействительно или устарело.',
  NOT_FOUND: 'Ничего не найдено.',
  NOTE_LIMIT_REACHED: 'Достигнут лимит заметок.',
  NPC_LIMIT_REACHED: 'Достигнут лимит персонажей.',
  NPC_SELF_RELATION: 'Нельзя связать персонажа с самим собой.',
  RATE_LIMITED: 'Слишком много попыток. Попробуйте чуть позже.',
  RELATED_NPC_NOT_FOUND: 'Связанный персонаж не найден.',
  NETWORK_ERROR: NETWORK_ERROR_MESSAGE,
  SESSION_EXPIRED: 'Сессия истекла. Войдите снова.',
  TOO_MANY_RELATIONS: 'Слишком много связей для одного персонажа.',
  UNAUTHORIZED: 'Нужно войти в аккаунт.',
  VALIDATION_ERROR: DEFAULT_VALIDATION_MESSAGE,
};

export class ApiError extends Error {
  override readonly name = 'ApiError';
  override readonly cause?: unknown;

  constructor(
    public readonly status: number,
    message: string,
    public readonly code: ErrorCode | 'UNKNOWN' | 'NETWORK_ERROR' = 'UNKNOWN',
    public readonly fields?: Record<string, string>,
    public readonly meta?: Record<string, unknown>,
    public readonly requestId?: string,
    options?: {cause?: unknown},
  ) {
    super(message);
    this.cause = options?.cause;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });
  } catch (error) {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE, 'NETWORK_ERROR', undefined, undefined, undefined, {cause: error});
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? ((await response.json().catch(() => null)) as ErrorResponse | T | null) : null;

  if (!response.ok) {
    const error = (payload as ErrorResponse | null)?.error;
    const apiError = new ApiError(
      response.status,
      localizeMessage(error?.code ?? 'UNKNOWN', error?.message, response.status),
      error?.code ?? 'UNKNOWN',
      localizeFields(error?.code ?? 'UNKNOWN', error?.fields),
      error?.meta,
      error?.requestId,
    );
    if (response.status === 401 && shouldNotifyUnauthorized(path)) {
      notifyUnauthorized(apiError);
    }
    throw apiError;
  }

  if (response.status === 204) return undefined as T;
  return payload as T;
}

function localizeMessage(code: ErrorCode | 'UNKNOWN', message: string | undefined, status: number) {
  if (message && /[А-Яа-яЁё]/.test(message)) return message;
  if (localizedMessages[code]) return localizedMessages[code];
  if (message && /^validation failed$/i.test(message)) return DEFAULT_VALIDATION_MESSAGE;
  if (status >= 500) return localizedMessages.INTERNAL_ERROR!;
  return message ?? DEFAULT_ERROR_MESSAGE;
}

function localizeFields(code: ErrorCode | 'UNKNOWN', fields: Record<string, string> | undefined) {
  if (!fields) return fields;
  return Object.fromEntries(
    Object.entries(fields).map(([field, message]) => [field, localizeFieldMessage(field, message, code)]),
  );
}

function shouldNotifyUnauthorized(path: string) {
  return !PUBLIC_AUTH_PATHS.has(path);
}

function localizeFieldMessage(field: string, message: string, code: ErrorCode | 'UNKNOWN') {
  if (/[А-Яа-яЁё]/.test(message)) return message;
  if (code === 'EMAIL_TAKEN' && field === 'email') {
    return localizedMessages.EMAIL_TAKEN!;
  }

  const normalized = message.trim().toLowerCase();
  if (normalized.includes('invalid email')) {
    return 'Введите корректный email';
  }
  if (normalized.includes('required')) {
    return requiredFieldMessage(field);
  }
  if (normalized.includes('too small') || normalized.includes('at least') || normalized.includes('>=')) {
    return minFieldMessage(field);
  }
  if (normalized.includes('too big') || normalized.includes('at most') || normalized.includes('<=')) {
    return maxFieldMessage(field);
  }
  if (normalized.includes('expected string')) {
    return requiredFieldMessage(field);
  }

  return DEFAULT_VALIDATION_MESSAGE;
}

function requiredFieldMessage(field: string) {
  switch (field) {
    case 'name':
      return 'Введите имя';
    case 'email':
      return 'Введите email';
    case 'password':
      return 'Введите пароль';
    default:
      return 'Заполните поле';
  }
}

function minFieldMessage(field: string) {
  switch (field) {
    case 'name':
      return 'Имя должно быть не короче 2 символов';
    case 'password':
      return 'Пароль должен быть не короче 8 символов';
    case 'email':
      return 'Введите корректный email';
    default:
      return 'Значение слишком короткое';
  }
}

function maxFieldMessage(field: string) {
  switch (field) {
    case 'name':
      return 'Имя должно быть не длиннее 40 символов';
    case 'password':
      return 'Пароль должен быть не длиннее 128 символов';
    case 'email':
      return 'Email должен быть не длиннее 254 символов';
    default:
      return 'Значение слишком длинное';
  }
}
