import { Pool } from 'pg';
declare function initializeDb(): import("drizzle-orm/node-postgres").NodePgDatabase<Record<string, unknown>> & {
    $client: Pool;
};
export { initializeDb as db };
export * from './schema';
//# sourceMappingURL=database.d.ts.map