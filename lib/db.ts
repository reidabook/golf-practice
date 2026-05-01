import postgres from 'postgres'

// Singleton guard for dev hot-reload
const globalForDb = globalThis as unknown as { sql: postgres.Sql }

export const sql = globalForDb.sql ?? postgres(process.env.DATABASE_URL!)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sql = sql
}
