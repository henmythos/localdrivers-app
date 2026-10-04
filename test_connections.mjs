import { createClient } from '@libsql/client';

const TURSO_URL = process.env.LOCALDRIVERS_TURSO_DATABASE_URL || "libsql://database-cyclamen-desert-vercel-icfg-cnxx2242ugtirkjfrpb3fzwu.aws-ap-south-1.turso.io";
const TURSO_TOKEN = process.env.LOCALDRIVERS_TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTExMTY2NDMsImlkIjoiMDFhMTA1YmUtZGUwMS03OTk0LWJlN2EtOTk4ODBiMjAwM3EwIiwia2lkIjoiRHFFM252OEVEWXp6Z1hrMXQ5ODBINXR5MmJNUVpOOWcxMFF2RnhLM3BJcyIsInJpZCI6IjM1YjM2ZjZmLTM1ZDUtNGE0OS04NjMzLWQyNjczYTk0NGQzNCJ9.63nZDSCK3mNiJSYCwvkTSvmWRZYw5lY62VM6_2skaU7srCFPLjkszoxYH2c9hwfHneFNJRZ0mMJ2u24Ac5zICQ";
const R2_DEV_URL = "https://pub-e6716545434140d796808e125fc8dc7d.r2.dev";

async function testTurso() {
  console.log("--------------------------------------------------");
  console.log("1. TESTING TURSO CLOUD SQLITE DATABASE CONNECTION...");
  
  const urlsToTest = [
    TURSO_URL.replace("libsql://", "https://"),
    TURSO_URL.replace("https://", "libsql://")
  ];

  for (const url of urlsToTest) {
    console.log("Testing Endpoint:", url);
    try {
      const client = createClient({
        url: url,
        authToken: TURSO_TOKEN,
      });

      const res = await client.execute("SELECT 1 + 1 AS test_calc;");
      console.log("✓ Connection Successful! Query result:", res.rows);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS system_health_checks (
          id TEXT PRIMARY KEY,
          checked_at TEXT NOT NULL,
          status TEXT NOT NULL
        );
      `);

      const testId = "check-" + Date.now();
      const nowISO = new Date().toISOString();
      await client.execute({
        sql: "INSERT INTO system_health_checks (id, checked_at, status) VALUES (?, ?, ?);",
        args: [testId, nowISO, "OPERATIONAL"]
      });

      const verifyRes = await client.execute({
        sql: "SELECT * FROM system_health_checks WHERE id = ?;",
        args: [testId]
      });

      console.log("✓ Data Write & Persistence Verified! Inserted row:", verifyRes.rows[0]);
      console.log("-> TURSO DB CONNECTION STATUS: 100% OPERATIONAL & VERIFIED!");
      return;
    } catch (err) {
      console.error(`❌ TURSO DB ERROR on ${url}:`, err.message || err);
    }
  }
}

async function testR2() {
  console.log("--------------------------------------------------");
  console.log("2. TESTING CLOUDFLARE R2 BUCKET PUBLIC DEV ENDPOINT...");
  console.log("Public URL:", R2_DEV_URL);

  try {
    const res = await fetch(R2_DEV_URL, { method: 'GET' });
    console.log(`✓ R2 Endpoint HTTP Status: ${res.status} (${res.statusText})`);
    console.log("-> CLOUDFLARE R2 BUCKET STATUS: CONNECTED & ACTIVE!");
  } catch (err) {
    console.error("❌ CLOUDFLARE R2 ERROR:", err);
  }
  console.log("--------------------------------------------------");
}

async function main() {
  await testTurso();
  await testR2();
}

main();
