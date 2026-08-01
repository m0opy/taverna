import {describe, expect, it} from 'vitest';

import {formatParticipantCount} from '../../src/shared/lib/russian';

describe('Russian participant count formatting', () => {
  it.each([
    [1, '1 участник'],
    [2, '2 участника'],
    [5, '5 участников'],
    [11, '11 участников'],
    [22, '22 участника'],
  ])('formats %s with the right case', (count, expected) => {
    expect(formatParticipantCount(count)).toBe(expected);
  });
});
