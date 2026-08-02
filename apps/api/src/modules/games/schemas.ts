import {createGameRequestSchema, gameListQuerySchema, updateGameRequestSchema} from '@taverna/contracts';
import {z} from 'zod';

export const gamesParamsSchema = z.strictObject({campaignId: z.uuid()});
export const gameParamsSchema = gamesParamsSchema.extend({gameId: z.uuid()});

export function parseGameListQuery(query: unknown) {
  return gameListQuerySchema.parse(query);
}

export function parseGameWriteRequest(body: unknown) {
  return createGameRequestSchema.parse(body);
}

export function parseGameUpdateRequest(body: unknown) {
  return updateGameRequestSchema.parse(body);
}
