import type {CoverKey} from '@taverna/contracts';

export const coverLabels: Record<CoverKey, string> = {
  city: 'Город',
  dungeon: 'Подземелье',
  forest: 'Лес',
  mountains: 'Горы',
  sea: 'Море',
  tavern: 'Таверна',
};

export const campaignSections = {
  home: 'Главная',
  notes: 'Заметки',
  npc: 'NPC',
  settings: 'Настройки',
} as const;

export type CampaignSection = keyof typeof campaignSections;
