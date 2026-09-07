import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Ensures the schema_migrations ledger table exists in the database.
 */
async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(128) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INT NOT NULL
    );
  `);
}

/**
 * Retrieves list of already-applied migration versions from the database.
 */
async function getAppliedMigrations(connection) {
  const [rows] = await connection.query('SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC');
  return rows;
}

/**
 * Executes all pending database migrations in chronological/version order.
 * @param {import('mysql2/promise').Pool | import('mysql2/promise').Connection} dbPool 
 */
export async function runMigrations(dbPool) {
  if (!dbPool) {
    throw new Error('Cannot run migrations: database pool is not available.');
  }

  const connection = await dbPool.getConnection();
  try {
    await ensureMigrationsTable(connection);

    // Read all migration files
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.warn(`[Migrator] Migrations directory '${MIGRATIONS_DIR}' not found.`);
      return { appliedCount: 0, totalCount: 0 };
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    const appliedRows = await getAppliedMigrations(connection);
    const appliedVersions = new Set(appliedRows.map(r => r.version));

    let newlyApplied = 0;

    for (const file of files) {
      const version = file.split('_')[0];
      const name = file.replace(/\.sql$/, '');

      if (appliedVersions.has(version)) {
        continue;
      }

      console.log(`[Migrator] 🚀 Applying migration ${file}...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      const startTime = Date.now();

      // Execute SQL migration statements
      // Split by semicolon and strip SQL line comments
      const rawStatements = sqlContent.split(';');

      for (const raw of rawStatements) {
        const statement = raw.replace(/--.*$/gm, '').trim();
        if (statement.length > 0) {
          try {
            await connection.query(statement);
          } catch (stmtErr) {
            // For ALTER TABLE ADD INDEX / COLUMN that might already exist in TiDB
            if (stmtErr.message.includes('Duplicate column name') || stmtErr.message.includes('Duplicate key name') || stmtErr.message.includes('already exists')) {
              console.warn(`[Migrator] Notice in ${file}: ${stmtErr.message}`);
            } else {
              throw stmtErr;
            }
          }
        }
      }

      const executionTimeMs = Date.now() - startTime;

      // Record migration
      await connection.query(
        'INSERT INTO schema_migrations (version, name, execution_time_ms) VALUES (?, ?, ?)',
        [version, name, executionTimeMs]
      );

      console.log(`[Migrator] ✅ Migration ${file} applied in ${executionTimeMs}ms`);
      newlyApplied++;
    }

    if (newlyApplied === 0) {
      console.log(`[Migrator] ⚡ Database schema is up to date (${appliedRows.length} migrations on record).`);
    } else {
      console.log(`[Migrator] 🎉 Successfully applied ${newlyApplied} new migration(s). Total: ${appliedRows.length + newlyApplied}`);
    }

    return {
      appliedCount: newlyApplied,
      totalCount: appliedRows.length + newlyApplied
    };
  } finally {
    connection.release();
  }
}
