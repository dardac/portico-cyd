import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createDbClient, explainDbError } from "./db-connection";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

async function ensureMigrationsTable(client: ReturnType<typeof createDbClient>) {
  await client.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function getAppliedMigrations(
  client: ReturnType<typeof createDbClient>,
): Promise<Set<string>> {
  const result = await client.query<{ id: string }>(
    "select id from schema_migrations order by id",
  );

  return new Set(result.rows.map((row) => row.id));
}

function getMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

async function applyMigration(
  client: ReturnType<typeof createDbClient>,
  file: string,
) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");

  await client.query("begin");

  try {
    await client.query(sql);
    await client.query("insert into schema_migrations (id) values ($1)", [file]);
    await client.query("commit");
    console.log(`✓ ${file}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function main() {
  const client = createDbClient();

  await client.connect();
  console.log("Conectado a la base de datos.");

  try {
    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);
    const files = getMigrationFiles();

    if (files.length === 0) {
      console.log("No hay archivos en supabase/migrations.");
      return;
    }

    let pending = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`· ${file} (ya aplicada)`);
        continue;
      }

      await applyMigration(client, file);
      pending++;
    }

    if (pending === 0) {
      console.log("Todas las migraciones están al día.");
    } else {
      console.log(`Listo. ${pending} migración(es) aplicada(s).`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(explainDbError(error));
  process.exit(1);
});
