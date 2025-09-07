import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { recipes } from './src/db/schema.ts';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    const allRecipes = await db.select().from(recipes);
    console.log(`\n📊 Found ${allRecipes.length} recipes in database:`);
    
    allRecipes.forEach((recipe, i) => {
      console.log(`${i + 1}. ${recipe.extracted.title} (${recipe.sourceType}) - ${recipe.createdAt}`);
      console.log(`   ID: ${recipe.id}`);
      console.log(`   Source: ${recipe.sourceUrl}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

checkDatabase();
