import { createClient } from '@libsql/client';
import fs from 'fs';

const envContent = fs.readFileSync('./.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const tokens = [
  { name: '.env LOCALDRIVERS_TURSO_AUTH_TOKEN', token: env.LOCALDRIVERS_TURSO_AUTH_TOKEN },
  { name: '.env TURSO_AUTH_TOKEN', token: env.TURSO_AUTH_TOKEN },
  { name: 'test_connections token', token: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTExMTY2NDMsImlkIjoiMDFhMTA1YmUtZGUwMS03OTk0LWJlN2EtOTk4ODBiMjAwM3EwIiwia2lkIjoiRHFFM252OEVEWXp6Z1hrMXQ5ODBINXR5MmJNUVpOOWcxMFF2RnhLM3BJcyIsInJpZCI6IjM1YjM2ZjZmLTM1ZDUtNGE0OS04NjMzLWQyNjczYTk0NGQzNCJ9.63nZDSCK3mNiJSYCwvkTSvmWRZYw5lY62VM6_2skaU7srCFPLjkszoxYH2c9hwfHneFNJRZ0mMJ2u24Ac5zICQ" }
];

const url = env.LOCALDRIVERS_TURSO_DATABASE_URL || "libsql://database-cyclamen-desert-vercel-icfg-cnxx2242ugtirkjfrpb3fzwu.aws-ap-south-1.turso.io";

async function main() {
  console.log("Testing with URL:", url);
  for (const t of tokens) {
    console.log(`\nTesting ${t.name}:`);
    try {
      const client = createClient({
        url: url.replace('libsql://', 'https://'),
        authToken: t.token
      });
      const res = await client.execute("SELECT 1 + 1 as val;");
      console.log(`SUCCESS with ${t.name}! Result:`, res.rows);
      
      const tables = await client.execute("SELECT name, sql FROM sqlite_master WHERE type='table';");
      console.log("Tables in database:", tables.rows.map(r => r.name));
      for (const table of tables.rows) {
        console.log(`Table ${table.name} SQL:`, table.sql);
      }
      return;
    } catch (e) {
      console.error(`FAILED with ${t.name}:`, e.message);
    }
  }
}

main().catch(console.error);
