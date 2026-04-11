/**
 * database.web.ts
 *
 * Web-specific WatermelonDB setup using the LokiJS adapter.
 * Metro automatically picks this file over database.ts on the web platform.
 * SQLiteAdapter (and better-sqlite3) must NOT be imported here.
 */

import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

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

const adapter = new LokiJSAdapter({
  schema: watermelonSchema,
  migrations,
  useWebWorker: false,   // keep it synchronous — simpler for web preview
  useIncrementalIndexedDB: true,
  dbName: 'silk_value_db',
  onSetUpError: (error: Error) => {
    console.error('[WatermelonDB] LokiJSAdapter setup error:', error);
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

export async function resetDatabase(): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}
