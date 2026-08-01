import { z } from 'zod';

const appEnvSchema = z.strictObject({
  APP_VERSION: z.string().trim().min(1).default('0.1.0'),
  APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().trim().min(1),
  DEMO_EMAIL: z.string().trim().email().default('demo@tavern.app'),
  DEMO_PASSWORD: z.string().min(8).optional(),
  ENABLE_DEMO_SEED: z
    .enum(['true', 'false', '1', '0'])
    .default('false')
    .transform((value) => value === 'true' || value === '1'),
  HOST: z.string().trim().min(1).default('0.0.0.0'),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  SESSION_COOKIE_NAME: z.string().trim().min(1).default('taverna_session'),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export function parseAppEnv(
  source: Record<string, string | undefined> = process.env,
): AppEnv {
  return appEnvSchema.parse({
    APP_VERSION: source.APP_VERSION,
    APP_ORIGIN: source.APP_ORIGIN,
    DATABASE_URL: source.DATABASE_URL,
    DEMO_EMAIL: source.DEMO_EMAIL,
    DEMO_PASSWORD: source.DEMO_PASSWORD,
    ENABLE_DEMO_SEED: source.ENABLE_DEMO_SEED,
    HOST: source.HOST,
    JWT_SECRET: source.JWT_SECRET,
    NODE_ENV: source.NODE_ENV,
    PORT: source.PORT,
    SESSION_COOKIE_NAME: source.SESSION_COOKIE_NAME,
  });
}
