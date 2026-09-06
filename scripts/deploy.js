const { execSync } = require('child_process');

console.log('=== MPLADS AI Railway Deployment Initializer ===');
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('Port:', process.env.PORT || 5000);

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is missing in Railway Variables!');
  console.error('Please ensure DATABASE_URL=${{Postgres.DATABASE_URL}} is set in the web service variables.');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

function run(cmd) {
  console.log(`> Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

try {
  // Ensure schema provider matches DATABASE_URL
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    let schema = fs.readFileSync(schemaPath, 'utf8');
    if (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://')) {
      console.log('🔄 Configuring Prisma for PostgreSQL...');
      schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
      fs.writeFileSync(schemaPath, schema, 'utf8');
    }
  }

  console.log('1. Generating Prisma Client for PostgreSQL...');
  run('npx prisma generate');

  console.log('2. Pushing database schema to Railway PostgreSQL...');
  run('npx prisma db push --accept-data-loss');

  console.log('3. Seeding 1,000 realistic works & demo cases into PostgreSQL...');
  run('npx tsx prisma/seed.ts');

  console.log('4. Launching Backend API server on Railway...');
  run('node dist/index.js');
} catch (err) {
  console.error('❌ Deployment script error:', err.message);
  process.exit(1);
}
