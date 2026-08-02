const APP_TITLE = 'Таверна';

export function buildDocumentTitle(...parts: Array<string | false | null | undefined>): string {
  const labels = parts
    .filter((part): part is string => typeof part === 'string')
    .map((part) => part.trim())
    .filter(Boolean);

  return labels.length > 0 ? `${labels.join(' · ')} · ${APP_TITLE}` : APP_TITLE;
}
