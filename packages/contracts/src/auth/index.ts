import { z } from 'zod';

import {
  isoTimestampSchema,
  normalizedEmailSchema,
  trimmedString,
  uuidSchema,
} from '../common/validators.js';

export const userDtoSchema = z.strictObject({
  id: uuidSchema,
  name: trimmedString(2, 40),
  email: normalizedEmailSchema,
  createdAt: isoTimestampSchema,
});

export const registerRequestSchema = z.strictObject({
  name: trimmedString(2, 40),
  email: normalizedEmailSchema,
  password: z.string().min(8).max(128),
});

export const loginRequestSchema = z.strictObject({
  email: normalizedEmailSchema,
  password: z.string().min(8).max(128),
});

export type UserDto = z.infer<typeof userDtoSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
