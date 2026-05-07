// Runs a SQL migration file against the Supabase Postgres instance.
// Usage: node scripts/run-migration.mjs scripts/001-init-schema.sql
import { readFileSync } from "node:fs"
import { Client } from "pg"

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
if (!url) {
  console.error("Missing POSTGRES_URL_NON_POOLING / POSTGRES_URL env var.")
  process.exit(1)
}

const file = process.argv[2]
if (!file) {
  console.error("Usage: node scripts/run-migration.mjs <sql-file>")
  process.exit(1)
}

const sql = readFileSync(file, "utf8")

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  await client.query(sql)
  console.log(`Migration applied: ${file}`)
} catch (err) {
  console.error("Migration failed:", err.message)
  process.exit(1)
} finally {
  await client.end().catch(() => {})
}
