import {describe, expect, it} from 'vitest';

import {routePaths} from '../src/app/routes';

describe('MVP route registry', () => {
  it('contains every route promised by the requirements', () => {
    expect(routePaths).toHaveLength(10);
    expect(routePaths).toContain('/join/:token');
    expect(routePaths).toContain('/c/:id/settings');
  });
});
