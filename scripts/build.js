const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
if (fs.existsSync(schemaPath) && process.env.DATABASE_URL) {
  let schema = fs.readFileSync(schemaPath, 'utf8');
  if (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.log('🔄 Build: Configuring Prisma for PostgreSQL...');
    schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema, 'utf8');
  }
}

console.log('> Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('> Compiling TypeScript...');
execSync('npx tsc', { stdio: 'inherit' });
