import mysql from "mysql2/promise";

declare global {
  var __superappsPool: mysql.Pool | undefined;
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "superapps",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
  });
}

// Reuse pool across dev hot-reloads.
export const pool = global.__superappsPool ?? createPool();
if (process.env.NODE_ENV !== "production") global.__superappsPool = pool;

/** Run a single query (async). */
export async function query<T = unknown>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** Run a single row lookup. */
export async function queryOne<T = unknown>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length ? rows[0] : null;
}

/** Execute a write/update statement, returns affected rows. */
export async function execute(
  sql: string,
  params?: any[]
): Promise<number> {
  const [res] = await pool.execute(sql, params);
  return (res as mysql.ResultSetHeader).affectedRows ?? 0;
}

export type { RowDataPacket } from "mysql2";
