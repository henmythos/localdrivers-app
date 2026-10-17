import fs from 'fs';

const envContent = fs.readFileSync('./.env', 'utf-8');
const lines = envContent.split('\n');
let token = '';
for (const line of lines) {
  if (line.startsWith('TURSO_AUTH_TOKEN=')) {
    token = line.split('=')[1].trim().replace(/^"/, '').replace(/"$/, '');
  }
}

async function test() {
  const url = 'https://database-cyclamen-desert-vercel-icfg-cnxx2242ugtirkjfrpb3fzwu.aws-ap-south-1.turso.io/v2/pipeline';
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql: 'SELECT 1;' } }
      ]
    })
  });
  console.log('Status:', r.status);
  console.log('Body:', await r.text());
}

test().catch(console.error);
