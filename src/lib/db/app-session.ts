import pg from "pg";
import { getDatabaseUrl } from "@/lib/db/connection";
import type { AppSession } from "@/lib/auth/session";

type QueryResult<T extends pg.QueryResultRow> = pg.QueryResult<T>;

type AppQuery = <T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) => Promise<QueryResult<T>>;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: getDatabaseUrl(),
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  }

  return pool;
}

function sessionToContext(session: AppSession) {
  if (session.type === "resident") {
    return {
      sessionType: "resident",
      apartmentId: session.apartmentId,
      adminId: null,
      staffRole: null,
    };
  }

  return {
    sessionType: "admin",
    apartmentId: null,
    adminId: session.adminId,
    staffRole: session.role,
  };
}

/**
 * Ejecuta consultas con el rol `portico_app` y contexto de sesión para que RLS aplique.
 */
export async function withAppSession<T>(
  session: AppSession,
  callback: (query: AppQuery) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query("begin");
    await client.query("set local role portico_app");

    const context = sessionToContext(session);
    await client.query(`select app_set_session_context($1, $2, $3, $4)`, [
      context.sessionType,
      context.apartmentId,
      context.adminId,
      context.staffRole,
    ]);

    const query: AppQuery = (text, params) => client.query(text, params);
    const result = await callback(query);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
