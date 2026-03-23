const https = require('https');
const fs = require('fs');
const path = require('path');

// Use the provided PAT
const PAT = 'sbp_5b64dd2f8a16668a52eee835fcda52a7c4c17613';

function request(url, method = 'GET', body = null) {
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
  try {
    // Step 1: List projects
    console.log('Fetching Supabase projects...');
    const projectsRes = await request('https://api.supabase.com/v1/projects');
    if (projectsRes.status !== 200) {
      throw new Error(`Failed to list projects: ${projectsRes.status} ${JSON.stringify(projectsRes.data)}`);
    }
    const projects = projectsRes.data;
    if (!Array.isArray(projects) || projects.length === 0) {
      throw new Error('No projects found in your Supabase account.');
    }

    // Choose project: look for name containing 'skillproof' (case-insensitive)
    let project = projects.find(p => p.name && p.name.toLowerCase().includes('skillproof'));
    if (!project) {
      console.log('No project with "skillproof" in name found. Using the first project:', projects[0].name);
      project = projects[0];
    }
    const projectRef = project.ref;
    console.log(`Selected project: ${project.name} (ref: ${projectRef})`);

    // Step 2: Get full project details to fetch anon key
    console.log('Fetching project details...');
    const detailsRes = await request(`https://api.supabase.com/v1/projects/${projectRef}`);
    if (detailsRes.status !== 200) {
      throw new Error(`Failed to fetch project details: ${detailsRes.status} ${JSON.stringify(detailsRes.data)}`);
    }
    const projectData = detailsRes.data;
    console.log('Project details raw:', JSON.stringify(projectData, null, 2));

    // Try to find anon key in common locations
    let anonKey = projectData.anon_key
      || (projectData.api_keys && projectData.api_keys.anon)
      || (projectData.keys && projectData.keys.anon)
      || (projectData.config && projectData.config.anon_key)
      || projectData.public_api_key;

    if (!anonKey) {
      throw new Error('Anon key not found in project details response');
    }

    // Write .env.local
    const envPath = path.resolve('.env.local');
    const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://${projectRef}.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('.env.local created with project URL and anon key');

    // Step 3: Apply migration
    console.log('Reading migration file...');
    const sqlPath = path.resolve('supabase/migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying migration (this may take a moment)...');
    const executeRes = await request(`https://api.supabase.com/v1/projects/${projectRef}/database/execute`, 'POST', { query: sql });
    if (executeRes.status !== 200) {
      throw new Error(`Migration failed: ${executeRes.status} ${JSON.stringify(executeRes.data)}`);
    }
    console.log('Migration applied successfully');

    console.log('Setup complete! You can now run npm install and npm run dev.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
