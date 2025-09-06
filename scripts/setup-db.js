#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Recipe Extractor database...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('📝 Please copy env-template.txt to .env.local and fill in your values:');
  console.log('   - DATABASE_URL (from Neon)');
  console.log('   - OPENAI_API_KEY');
  console.log('   - IG_OEMBED_TOKEN (optional)\n');
  process.exit(1);
}

try {
  // Push schema to database
  console.log('📊 Pushing database schema...');
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  
  console.log('\n✅ Database setup complete!');
  console.log('🎉 You can now run: npm run dev');
  
} catch (error) {
  console.log('\n❌ Database setup failed!');
  console.log('🔍 Please check your DATABASE_URL in .env.local');
  console.log('💡 Make sure your Neon database is accessible\n');
  process.exit(1);
}
