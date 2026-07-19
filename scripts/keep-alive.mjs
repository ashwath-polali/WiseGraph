// Keeps the Supabase Postgres database awake.
//
// Supabase's free tier pauses a project after ~7 days with no activity, which
// is why WiseGraph "goes offline every 7 days." A scheduled query is real DB
// activity and resets that timer, so the project never pauses. A GitHub Action
// runs this once a day (see .github/workflows/keep-supabase-alive.yml), which
// is a 7x margin under the pause window.
//
// Run it yourself any time to confirm the DB is reachable:
//   node scripts/keep-alive.mjs
//
// It reads DATABASE_URL from the environment (the GitHub Action supplies it as a
// secret) and falls back to .env for local runs.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // local fallback: read .env without pulling in a dotenv dependency
  try {
    const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
    const line = readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .find((l) => l.trimStart().startsWith("DATABASE_URL="));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    /* no local .env — fine in CI */
  }
  return undefined;
}

async function pingOnce(url) {
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
    query_timeout: 15000,
  });
  await client.connect();
  try {
    const { rows } = await client.query("select now() as ts");
    return rows[0].ts;
  } finally {
    await client.end();
  }
}

const url = resolveDatabaseUrl();
if (!url) {
  console.error("DATABASE_URL is not set (env or .env). Nothing to ping.");
  process.exit(1);
}

const MAX_TRIES = 3;
for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
  try {
    const ts = await pingOnce(url);
    console.log(`✓ Supabase is awake — keep-alive query ran at ${new Date(ts).toISOString()}`);
    process.exit(0);
  } catch (err) {
    console.error(`Attempt ${attempt}/${MAX_TRIES} failed: ${err.message}`);
    if (attempt < MAX_TRIES) await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
}

console.error("✗ Could not reach the database after several tries. It may already be paused — restore it once, and the daily ping will keep it awake from then on.");
process.exit(1);
