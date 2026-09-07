import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initTiDB() {
  console.log('⚡ Connecting to TiDB Cloud at', process.env.TIDB_HOST);

  const connection = await mysql.createConnection({
    host: process.env.TIDB_HOST,
    port: parseInt(process.env.TIDB_PORT || '4000', 10),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    },
    multipleStatements: true
  });

  console.log('✅ Connected to TiDB Cloud successfully!');

  // Read schema.sql
  const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('🔄 Executing schema migrations on TiDB Cloud...');
  await connection.query(sql);

  console.log('🚀 Checking created tables in `fitforge_db`...');
  await connection.query('USE fitforge_db');
  const [tables] = await connection.query('SHOW TABLES;');
  
  console.log('📊 Active TiDB Tables:');
  console.table(tables);

  await connection.end();
  console.log('🎉 TiDB Cloud Database is fully provisioned and ready for FitForge!');
}

initTiDB().catch((err) => {
  console.error('❌ Failed to initialize TiDB Cloud database:', err.message);
  process.exit(1);
});
