import postgres from 'postgres';
import { readFileSync } from 'fs';

// Parse .env.local manually
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^(\w+)="?([^"]*)"?$/);
  if (match) env[match[1]] = match[2];
});

const sql = postgres({
  host: env.DATABASE_HOST,
  port: parseInt(env.DATABASE_PORT) || 5432,
  database: env.DATABASE_DB,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  ssl: 'require',
  prepare: false,
});

const r = await sql`UPDATE estudio_reportes SET informe_html = NULL, r2_key_editado = NULL WHERE estudio_id = 'ce0d6d24-6ea8-43cf-96d3-0e195ef26a19'`;
console.log('Reset done:', r);
await sql.end();
