import fs from 'fs';
import { createClient } from '@libsql/client';

const envText = fs.readFileSync('.env', 'utf-8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
}

console.log('Testing Turso with .env credentials...');
console.log('URL:', env.LOCALDRIVERS_TURSO_DATABASE_URL);
const client = createClient({
  url: env.LOCALDRIVERS_TURSO_DATABASE_URL,
  authToken: env.LOCALDRIVERS_TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    const res = await client.execute('SELECT 1 + 1 AS test_calc;');
    console.log('SUCCESS! Query test_calc:', res.rows);
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('Tables in Turso DB:', tables.rows.map(r => r.name));
    
    // Check drivers count
    const drivers = await client.execute("SELECT COUNT(*) as count FROM drivers;");
    console.log('Driver count in Turso:', drivers.rows[0]);
  } catch(e) {
    console.error('FAILED:', e.message || e);
  }
}
run();
