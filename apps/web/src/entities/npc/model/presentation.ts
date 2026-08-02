import type {NpcAttitude} from '@taverna/contracts';

export const attitudeLabels: Record<NpcAttitude, string> = {
  ally: 'Союзник',
  neutral: 'Нейтральный',
  enemy: 'Враг',
  unknown: 'Неизвестно',
};

export const attitudeTone: Record<NpcAttitude, string> = {
  ally: 'ally',
  neutral: 'neutral',
  enemy: 'enemy',
  unknown: 'unknown',
};

const graphemeSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, {granularity: 'grapheme'})
  : null;

function firstGrapheme(value: string) {
  if (graphemeSegmenter) {
    const segment = graphemeSegmenter.segment(value)[Symbol.iterator]().next().value;
    return segment?.segment ?? '';
  }

  return Array.from(value)[0] ?? '';
}

export function npcInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(firstGrapheme)
    .join('')
    .toLocaleUpperCase();
}
