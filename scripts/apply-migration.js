const https = require('https');
const fs = require('fs');
const path = require('path');

const PAT = 'sbp_5b64dd2f8a16668a52eee835fcda52a7c4c17613';
const PROJECT_REF = 'jxcfzepvfyrypcncsryi';
const SQL = fs.readFileSync(path.resolve('supabase/migrations/001_initial_schema.sql'), 'utf8');

function request(url, method, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('Applying migration using /execute endpoint...');
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/execute`;
  console.log(`POST ${url}`);
  const res = await request(url, 'POST', { query: SQL });
  if (res.status === 200) {
    console.log('Migration applied successfully');
  } else {
    console.error('Migration failed:', res.status, res.data);
    process.exit(1);
  }
}

main();
