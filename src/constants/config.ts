// All environment-driven config, App constants, sync settings
export const Config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://vjxuqkstltkbflhhwgoe.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqeHVxa3N0bHRrYmZsaGh3Z29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjM4ODAsImV4cCI6MjA5MDIzOTg4MH0.2pQh0G2XliS9j7l_oz6jnxv8MhR_v4mwxu1hAB8JnNk',
  },
  sync: {
    intervalMs: 30_000,          // sync every 30s when online
    maxRetries: 5,
    baseRetryDelayMs: 1_000,
    maxRetryDelayMs: 30_000,
    pullBatchSize: 200,
  },
  ticket: {
    photoMaxCount: 5,
    idempotencyKeyPrefix: 'silk:ticket',
  },
  offline: {
    maxPendingTickets: 500,
    syncQueueDrainIntervalMs: 5_000,
  },
} as const;
