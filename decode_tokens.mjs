import fs from 'fs';

const envContent = fs.readFileSync('./.env', 'utf-8');
const lines = envContent.split('\n');
for (const line of lines) {
  if (line.includes('TOKEN')) {
    const parts = line.split('=');
    const val = parts[1]?.trim().replace(/^"/, '').replace(/"$/, '');
    if (val && val.includes('.')) {
      const payload = JSON.parse(Buffer.from(val.split('.')[1], 'base64').toString());
      console.log(parts[0], payload);
    }
  }
}
