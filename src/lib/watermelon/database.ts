import Database from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { watermelonSchema } from './schema';
import { migrations } from './migrations';

import {
  ClusterModel,
  ProfileModel,
  ReelerModel,
  RouteModel,
  RouteStopModel,
  CollectionTicketModel,
  PaymentModel,
} from '../../models';

const adapter = new SQLiteAdapter({
  schema: watermelonSchema,
  migrations,
  dbName: 'silk_value_db',
  // jsi: true,            // enable JSI for better perf on supported RN builds
  onSetUpError: (error: Error) => {
    console.error('[WatermelonDB] SQLiteAdapter setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    ClusterModel,
    ProfileModel,
    ReelerModel,
    RouteModel,
    RouteStopModel,
    CollectionTicketModel,
    PaymentModel,
  ],
});

/**
 * Wipes and recreates the local SQLite database.
 * Use only in development / debug flows — never in production user paths.
 */
export async function resetDatabase(): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}
