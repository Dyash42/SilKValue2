import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

// Version 1 is the initial schema — no migrations needed yet.
// Add migration steps here when bumping SCHEMA_VERSION in schema.ts.
export const migrations = schemaMigrations({ migrations: [] });
