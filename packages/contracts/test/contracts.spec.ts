import { describe, expect, it } from 'vitest';

import {
  errorResponseSchema,
  joinCampaignRequestSchema,
  loginRequestSchema,
  npcWriteRequestSchema,
  registerRequestSchema,
  updateCampaignRequestSchema,
  updateCharacterRequestSchema,
} from '../src/index.js';

describe('contracts', () => {
  it('normalizes auth payloads', () => {
    const register = registerRequestSchema.parse({
      name: '  Полина  ',
      email: '  Polina@Example.com ',
      password: '12345678',
    });

    const login = loginRequestSchema.parse({
      email: '  Polina@Example.com ',
      password: '12345678',
    });

    expect(register).toEqual({
      name: 'Полина',
      email: 'polina@example.com',
      password: '12345678',
    });
    expect(login.email).toBe('polina@example.com');
  });

  it('rejects unknown fields on strict objects', () => {
    expect(() =>
      joinCampaignRequestSchema.parse({
        characterName: 'Мира',
        extra: true,
      }),
    ).toThrow();
  });

  it('normalizes nullable optional membership fields', () => {
    const payload = updateCharacterRequestSchema.parse({
      characterClass: '   ',
      characterInfo: '  Следопыт из леса  ',
    });

    expect(payload).toEqual({
      characterClass: null,
      characterInfo: 'Следопыт из леса',
    });
  });

  it('requires non-empty partial campaign updates', () => {
    expect(() => updateCampaignRequestSchema.parse({})).toThrow();
  });

  it('deduplicates npc tags and normalizes empty strings', () => {
    const payload = npcWriteRequestSchema.parse({
      name: 'Борден',
      title: '  ',
      tags: ['merchant', 'merchant', ' rumor '],
      notes: ' ',
      relations: [],
    });

    expect(payload).toEqual({
      name: 'Борден',
      title: '',
      tags: ['merchant', 'rumor'],
      notes: '',
      relations: [],
    });
  });

  it('accepts canonical error responses', () => {
    const parsed = errorResponseSchema.parse({
      error: {
        code: 'EMAIL_TAKEN',
        message: 'Такой email уже зарегистрирован',
        fields: { email: 'Уже занят' },
        requestId: 'req-123',
      },
    });

    expect(parsed.error.code).toBe('EMAIL_TAKEN');
  });
});
