import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { runMigrations } from './src/db/migrator.js';

dotenv.config();

async function main() {
  console.log('⚡ Connecting to TiDB Cloud pool to run migrations...');

  const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: parseInt(process.env.TIDB_PORT || '4000', 10),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    const result = await runMigrations(pool);
    console.log(`✨ Migration runner complete: ${result.appliedCount} applied, ${result.totalCount} total.`);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
