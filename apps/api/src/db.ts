import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (/\/umami(\?|$)/i.test(connectionString) && !/hiperxp/i.test(connectionString)) {
    throw new Error("DATABASE_URL points at Umami DB; use database hiperxp");
  }
  pool = new Pool({
    connectionString,
    ssl:
      process.env.DATABASE_SSLMODE === "require"
        ? { rejectUnauthorized: false }
        : undefined,
    max: Number(process.env.PG_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  return pool;
}

export async function checkDb(): Promise<boolean> {
  try {
    const res = await getPool().query("SELECT 1 AS ok");
    return res.rowCount === 1;
  } catch {
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}
