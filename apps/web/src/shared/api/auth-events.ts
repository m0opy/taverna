import type {ApiError} from './client';

type UnauthorizedListener = (error: ApiError) => void;

const listeners = new Set<UnauthorizedListener>();

export function subscribeUnauthorized(listener: UnauthorizedListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyUnauthorized(error: ApiError) {
  listeners.forEach((listener) => listener(error));
}
