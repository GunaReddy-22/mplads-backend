const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== MPLADS AI Railway Deployment Initializer ===');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  console.log('Detected PostgreSQL database connection. Updating Prisma provider to "postgresql"...');
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema);
} else if (!dbUrl) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set! Using local SQLite fallback database...');
  process.env.DATABASE_URL = 'file:./dev.db';
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schema);
} else {
  console.log('Using database URL from environment:', dbUrl.split('@')[0] + '...');
}

function run(cmd) {
  console.log(`> Executing: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

try {
  run('npx prisma generate');
  run('npx prisma db push --accept-data-loss');
  console.log('Seeding 1,000 realistic works & demo cases...');
  run('npx tsx prisma/seed.ts');
  console.log('Starting production server...');
  run('node dist/index.js');
} catch (err) {
  console.error('Deployment script encountered an error:', err.message);
  process.exit(1);
}
