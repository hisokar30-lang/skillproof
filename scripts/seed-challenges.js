const https = require('https');

const PAT = 'sbp_5b64dd2f8a16668a52eee835fcda52a7c4c17613';
const PROJECT_REF = 'jxcfzepvfyrypcncsryi';

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
  console.log('Seeding challenges...');
  const fs = require('fs');
  const path = require('path');
  const sql = fs.readFileSync(path.join(__dirname, 'seed-challenges.sql'), 'utf8');

  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/execute`;
  const res = await request(url, 'POST', { query: sql });

  if (res.status === 200 || res.status === 202) {
    console.log('Challenges seeded successfully!');
  } else {
    console.error('Failed:', res.status, res.data);
    process.exit(1);
  }
}

main();
