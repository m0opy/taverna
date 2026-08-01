import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import type { AppEnv } from './env.js';

export type DatabaseHealthcheck = () => Promise<{
  databaseVersion: string;
}>;

export interface DatabaseContext {
  close(): Promise<void>;
  healthcheck: DatabaseHealthcheck;
  pool: Pool;
  prisma: PrismaClient;
}

export function createDatabaseContext(env: AppEnv): DatabaseContext {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });
  const prisma = new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  return {
    async close() {
      await Promise.allSettled([prisma.$disconnect(), pool.end()]);
    },
    async healthcheck() {
      const result = await pool.query<{ ok: number; version: string }>(
        'SELECT 1 AS ok, version() AS version',
      );
      const row = result.rows[0];

      if (!row || row.ok !== 1) {
        throw new Error('Database health query returned unexpected payload');
      }

      return { databaseVersion: row.version };
    },
    pool,
    prisma,
  };
}
