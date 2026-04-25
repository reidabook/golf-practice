import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL!

// Singleton guard for dev hot-reload
const globalForDb = globalThis as unknown as { sql: ReturnType<typeof neon> }

export const sql = globalForDb.sql ?? neon(connectionString)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sql = sql
}
