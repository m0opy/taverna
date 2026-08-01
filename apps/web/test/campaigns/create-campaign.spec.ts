import {describe, expect, it} from 'vitest';

import {buildCreateCampaignPayload} from '../../src/features/campaign/create/model/use-create-campaign';

describe('create campaign payload', () => {
  it('keeps the existing contract shape for the create mutation', () => {
    expect(buildCreateCampaignPayload('  Башня  ', '  История  ', 'tavern')).toEqual({
      title: '  Башня  ',
      synopsis: '  История  ',
      coverKey: 'tavern',
    });
  });
});
