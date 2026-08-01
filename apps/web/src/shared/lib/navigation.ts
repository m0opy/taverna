export function safeNext(value: string | null, fallback = '/campaigns'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}

export function authHref(path: '/login' | '/register', next: string): string {
  const params = new URLSearchParams({next});
  return `${path}?${params.toString()}`;
}
