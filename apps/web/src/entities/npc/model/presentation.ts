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

export function npcInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
