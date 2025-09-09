#!/usr/bin/env node

/**
 * Recipe Migration Template
 * 
 * Template for migrating existing recipes to new schema structures.
 * Copy this file and modify for specific migration needs.
 * 
 * IMPORTANT: Always run backup-database.js before using this script!
 * 
 * Usage:
 *   1. Copy this template: cp scripts/migration-templates/migrate-recipes-template.js scripts/migrate-recipes-YYYY-MM-DD.js
 *   2. Modify the migration logic in migrateRecipe() function
 *   3. Test with --dry-run --limit 1 first
 *   4. Run full migration: node scripts/migrate-recipes-YYYY-MM-DD.js
 * 
 * Options:
 *   --dry-run    : Test without making changes
 *   --limit N    : Only process N recipes
 *   --id ID      : Process specific recipe by ID
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const dotenv = require('dotenv');
const readline = require('readline');
const { pgTable, uuid, text, timestamp, jsonb, varchar, boolean } = require('drizzle-orm/pg-core');
const { eq, isNull, or } = require('drizzle-orm');

dotenv.config({ path: '.env.local' });

// Define the recipes table schema
const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceUrl: text('source_url').notNull(),
  sourceType: varchar('source_type', { length: 32 }).notNull(),
  rawText: text('raw_text'),
  extracted: jsonb('extracted').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  extractionMethod: varchar('extraction_method', { length: 32 }),
  extractionQuality: varchar('extraction_quality', { length: 16 }),
  hasAudioTranscript: boolean('has_audio_transcript').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;
const idIndex = args.indexOf('--id');
const specificId = idIndex !== -1 ? args[idIndex + 1] : null;

console.log('🔄 Recipe Migration Script (Template)');
console.log('=====================================');
if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made');
}

async function fetchRecipesToMigrate() {
  console.log('📊 Fetching recipes from database...');
  
  let query = db.select().from(recipes);
  
  // Add specific ID filter if provided
  if (specificId) {
    query = query.where(eq(recipes.id, specificId));
  } else {
    // Add your migration criteria here
    // Example: recipes without components field
    // query = query.where(isNull(recipes.extracted.components));
  }
  
  // Add limit if specified
  if (limit) {
    query = query.limit(limit);
  }
  
  const allRecipes = await query;
  console.log(`📈 Found ${allRecipes.length} total recipes`);
  
  // Filter recipes that need migration (customize this logic)
  const recipesToMigrate = allRecipes.filter(recipe => {
    // Example: Check if recipe needs migration
    // return !recipe.extracted.components || recipe.extracted.components.length === 0;
    return true; // Modify this condition
  });
  
  console.log(`🎯 ${recipesToMigrate.length} recipes need migration`);
  
  return recipesToMigrate;
}

async function migrateRecipe(recipe) {
  console.log(`\n🔄 Processing: ${recipe.extracted.title}`);
  console.log(`📝 ID: ${recipe.id}`);
  console.log(`🌐 Source: ${recipe.sourceUrl}`);
  
  try {
    // TODO: Implement your migration logic here
    
    // Example migration steps:
    // 1. Check if migration is needed
    // 2. Transform the data
    // 3. Update the database (if not dry run)
    
    console.log('✅ Migration successful (template - no actual changes made)');
    
    return { 
      success: true, 
      changes: 'describe what was changed'
    };
    
  } catch (error) {
    console.error(`❌ Error processing recipe: ${error.message}`);
    return { success: false, reason: 'processing_error', error: error.message };
  }
}

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    const recipesToMigrate = await fetchRecipesToMigrate();
    
    if (recipesToMigrate.length === 0) {
      console.log('✅ No recipes need migration!');
      process.exit(0);
    }

    if (!isDryRun) {
      console.log(`\n⚠️  This will migrate ${recipesToMigrate.length} recipes.`);
      console.log('💰 This may incur API costs if using external services.');
      console.log('⏱️  Estimated time: ~30 seconds per recipe');
      console.log('🚨 Make sure you have run backup-database.js first!');
      
      const answer = await askQuestion('\nContinue? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Migration cancelled.');
        process.exit(0);
      }
    }

    console.log('\n🚀 Starting migration...\n');

    const results = {
      total: recipesToMigrate.length,
      success: 0,
      failed: 0,
      skipped: 0
    };

    for (let i = 0; i < recipesToMigrate.length; i++) {
      const recipe = recipesToMigrate[i];
      
      console.log(`\n📊 Progress: ${i + 1}/${recipesToMigrate.length}`);
      
      const result = await migrateRecipe(recipe);
      
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.success++;
        }
      } else {
        results.failed++;
      }
      
      // Add delay between recipes to avoid overwhelming APIs
      if (i < recipesToMigrate.length - 1) {
        console.log('⏳ Waiting 3 seconds before next recipe...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('\n🎉 Migration Complete!');
    console.log('======================');
    console.log(`📊 Total recipes processed: ${results.total}`);
    console.log(`✅ Successfully migrated: ${results.success}`);
    console.log(`⏭️  Skipped (already migrated): ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (isDryRun) {
      console.log('\n🔍 This was a dry run - no changes were made to the database.');
      console.log('Run without --dry-run to apply changes.');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
