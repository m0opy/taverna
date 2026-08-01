import {describe, expect, it} from 'vitest';

import {getMemberSubtitle} from './member';

describe('getMemberSubtitle', () => {
  it('keeps the current member presentation rules', () => {
    expect(getMemberSubtitle({isOwner: true, characterName: null, characterClass: null, user: {name: 'Полина'}})).toBe('Мастер кампании');
    expect(getMemberSubtitle({isOwner: true, characterName: 'Лорас', characterClass: null, user: {name: 'Полина'}})).toBe('Мастер · Полина');
    expect(getMemberSubtitle({isOwner: false, characterName: 'Лорас', characterClass: 'Бард', user: {name: 'Полина'}})).toBe('Бард · Полина');
    expect(getMemberSubtitle({isOwner: false, characterName: null, characterClass: null, user: {name: 'Полина'}})).toBe('Игрок');
  });
});
