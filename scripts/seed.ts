import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createDbClient, explainDbError } from "./db-connection";

const SEED_FILE = join(process.cwd(), "supabase/seed-apartments.sql");

async function main() {
  const sql = readFileSync(SEED_FILE, "utf8");
  const client = createDbClient();

  await client.connect();
  console.log("Conectado a la base de datos.");

  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
    console.log("✓ seed-apartments.sql ejecutado.");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(explainDbError(error));
  process.exit(1);
});
