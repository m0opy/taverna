import {npcListQuerySchema, npcWriteRequestSchema} from '@taverna/contracts';
import {z} from 'zod';

export const npcsParamsSchema = z.strictObject({
  campaignId: z.uuid(),
});

export const npcParamsSchema = npcsParamsSchema.extend({
  npcId: z.uuid(),
});

export function parseNpcWriteRequest(body: unknown) {
  return npcWriteRequestSchema.parse(body);
}

export function parseNpcListQuery(query: unknown) {
  return npcListQuerySchema.parse(query);
}
