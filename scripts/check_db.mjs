import { createClient } from '@libsql/client/web';
import fs from 'fs';

// Read from .env
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => {
  const m = env.match(new RegExp(`${k}="?([^"\\r\\n]+)"?`));
  return m ? m[1] : '';
};

const url = getEnv('TURSO_DATABASE_URL') || getEnv('LOCALDRIVERS_TURSO_DATABASE_URL');
const authToken = getEnv('TURSO_AUTH_TOKEN') || getEnv('LOCALDRIVERS_TURSO_AUTH_TOKEN');

console.log('Connecting to:', url);
const client = createClient({ url, authToken });

async function check() {
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
  console.log('Tables in DB:', tables.rows.map(r => r.name));
  for (const t of tables.rows) {
    const info = await client.execute(`PRAGMA table_info(${t.name});`);
    console.log(`Table ${t.name}:`, info.rows.map(c => `${c.name} (${c.type})`).join(', '));
  }
}

check().catch(console.error);
