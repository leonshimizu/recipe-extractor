// Test script to check local database connection
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { recipes } from './src/db/schema.ts';
import { desc } from 'drizzle-orm';

console.log('🔍 Testing local database connection...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL (first 50 chars):', process.env.DATABASE_URL?.substring(0, 50) + '...');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function testLocalConnection() {
  try {
    console.log('\n📊 Querying recipes (same as history page)...');
    const allRecipes = await db.select().from(recipes).orderBy(desc(recipes.createdAt));
    
    console.log(`\n✅ Found ${allRecipes.length} recipes in LOCAL database:`);
    
    if (allRecipes.length === 0) {
      console.log('❌ No recipes found - this explains why local history is empty!');
    } else {
      allRecipes.forEach((recipe, i) => {
        console.log(`${i + 1}. ${recipe.extracted.title} (${recipe.sourceType})`);
        console.log(`   Created: ${recipe.createdAt}`);
        console.log(`   ID: ${recipe.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Full error:', error);
  }
}

testLocalConnection();
