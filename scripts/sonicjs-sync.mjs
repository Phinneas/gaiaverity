import fs from 'node:fs';
import { execSync } from 'node:child_process';

const GHOST_FILE = 'gaiaverity.ghost.2026-04-24-16-52-59.json';
const D1_NAME = 'sonicjs-db';

async function run() {
  console.log('🚀 Starting SonicJS Sync Discovery...');

  // 1. Check if we can talk to D1
  try {
    const tablesRaw = execSync(`npx wrangler d1 execute ${D1_NAME} --remote --command "SELECT name FROM sqlite_master WHERE type='table';"`, { encoding: 'utf-8' });
    console.log('\n📊 Database Tables Found:');
    console.log(tablesRaw);

    if (tablesRaw.includes('content')) {
      console.log('✅ Found "content" table. This is typical for SonicJS.');
      
      // Let's check the columns to see how sites are separated
      const columnsRaw = execSync(`npx wrangler d1 execute ${D1_NAME} --remote --command "PRAGMA table_info(content);"`, { encoding: 'utf-8' });
      console.log('\n📋 Table Structure (content):');
      console.log(columnsRaw);
    }
  } catch (err) {
    console.error('❌ Error connecting to D1. Make sure you are logged in to wrangler (npx wrangler login).');
    console.error(err.message);
    process.exit(1);
  }

  // 2. Prepare Ghost Data
  console.log(`\n📖 Reading Ghost export: ${GHOST_FILE}...`);
  const ghostData = JSON.parse(fs.readFileSync(GHOST_FILE, 'utf-8'));
  const posts = ghostData.db[0].data.posts.filter(p => p.type === 'post' && p.status === 'published');

  console.log(`✅ Found ${posts.length} published posts to migrate.`);

  console.log('\n⚠️  STOP: Please paste the output above so I can verify the column names and Site ID before we perform the actual import.');
}

run();
