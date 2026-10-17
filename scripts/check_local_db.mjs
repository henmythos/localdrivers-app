import { createClient } from '@libsql/client';

const client = createClient({ url: 'file:localdrivers.db' });

async function check() {
  try {
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('Tables in localdrivers.db:', tables.rows.map(r => r.name));
    for (const t of tables.rows) {
      const count = await client.execute(`SELECT COUNT(*) as c FROM "${t.name}"`);
      console.log(t.name, 'rows:', count.rows[0].c);
    }
  } catch(e) {
    console.error('Error reading localdrivers.db:', e);
  }
}

check();
