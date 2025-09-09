#!/usr/bin/env node

/**
 * Simple Migration Script: Convert Legacy Recipes to Component Structure
 * 
 * This script uses the existing API endpoints to reprocess recipes,
 * avoiding TypeScript import issues.
 * 
 * Usage:
 *   node scripts/migrate-recipes-simple.js [options]
 * 
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --limit N    Only process N recipes (for testing)
 *   --force      Skip confirmation prompts
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const { eq, isNotNull } = require('drizzle-orm');
const postgres = require('postgres');
const { pgTable, uuid, text, timestamp, jsonb, varchar, boolean } = require('drizzle-orm/pg-core');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Define the recipes table schema directly
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
const isForce = args.includes('--force');
const limitIndex = args.findIndex(arg => arg === '--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;

console.log('🔄 Recipe Component Migration Script (Simple)');
console.log('=============================================');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made');
}

async function getRecipesToMigrate() {
  console.log('📊 Fetching recipes from database...');
  
  let query = db.select().from(recipes).where(isNotNull(recipes.rawText));
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const allRecipes = await query;
  
  // Filter recipes that don't have components yet
  const recipesToMigrate = allRecipes.filter(recipe => {
    const extracted = recipe.extracted;
    return !extracted.components || extracted.components.length === 0;
  });
  
  console.log(`📈 Found ${allRecipes.length} total recipes`);
  console.log(`🎯 ${recipesToMigrate.length} recipes need component migration`);
  
  return recipesToMigrate;
}

async function migrateRecipe(recipe) {
  console.log(`\n🔄 Processing: ${recipe.extracted.title}`);
  console.log(`📝 ID: ${recipe.id}`);
  console.log(`🌐 Source: ${recipe.sourceUrl}`);
  
  const location = recipe.extracted.costLocation || 'Guam';
  let tempDeletedRecipe = null;
  
  try {
    
    // Step 1: Temporarily delete the old recipe to avoid duplicate URL validation
    // (Even in dry run, we need to do this so the API doesn't return existing recipe)
    console.log('🗑️  Temporarily deleting old recipe to avoid duplicate validation...');
    await db.delete(recipes).where(eq(recipes.id, recipe.id));
    tempDeletedRecipe = recipe; // Store for potential restoration
    console.log('✅ Old recipe temporarily deleted');
    
    // Wait a moment to ensure deletion takes effect
    console.log('⏳ Waiting for deletion to take effect...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Use the dedicated migration API that bypasses existing recipe checks
    console.log(`🤖 Re-extracting with migration API (location: ${location})...`);
    
    const response = await fetch(`http://localhost:3000/api/migrate-recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipeId: tempDeletedRecipe.id,
        isDryRun: false, // We're doing the deletion ourselves
        recipeData: tempDeletedRecipe // Pass the recipe data since we deleted it
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Handle migration API response
    const result = await response.json();
    let newRecipeId = null;
    let componentsCount = 0;
    let componentNames = [];
    
    if (result.success) {
      if (result.skipped) {
        console.log('⏭️  Recipe already has components, skipped');
        newRecipeId = tempDeletedRecipe.id;
        componentsCount = 0; // Already had components
        componentNames = [];
      } else {
        console.log(`✅ Migration successful:`);
        console.log(`   - Components: ${result.componentsCount}`);
        console.log(`   - Component names: ${result.componentNames.join(', ')}`);
        console.log(`   - Ingredients: ${result.ingredientsCount}`);
        console.log(`   - Steps: ${result.stepsCount}`);
        
        newRecipeId = result.recipeId;
        componentsCount = result.componentsCount;
        componentNames = result.componentNames;
      }
    } else {
      throw new Error(result.error || 'Migration API failed');
    }
    
    if (newRecipeId) {
      console.log(`✅ New recipe created: ${newRecipeId}`);
      
      // Fetch the new recipe to get component info
      const [newRecipe] = await db.select().from(recipes).where(eq(recipes.id, newRecipeId));
      if (newRecipe && newRecipe.extracted.components) {
        componentsCount = newRecipe.extracted.components.length;
        componentNames = newRecipe.extracted.components.map(c => c.name);
        
        console.log(`🧩 Components created: ${componentsCount}`);
        console.log(`📋 Component names: ${componentNames.join(', ')}`);
      }
      
      // Handle dry run: restore old recipe and delete new one
      if (isDryRun && tempDeletedRecipe) {
        console.log('🔍 DRY RUN - Restoring old recipe and removing new one...');
        
        // Delete the newly created recipe
        await db.delete(recipes).where(eq(recipes.id, newRecipeId));
        
        // Restore the old recipe
        await db.insert(recipes).values({
          id: tempDeletedRecipe.id,
          sourceUrl: tempDeletedRecipe.sourceUrl,
          sourceType: tempDeletedRecipe.sourceType,
          rawText: tempDeletedRecipe.rawText,
          extracted: tempDeletedRecipe.extracted,
          thumbnailUrl: tempDeletedRecipe.thumbnailUrl,
          extractionMethod: tempDeletedRecipe.extractionMethod,
          extractionQuality: tempDeletedRecipe.extractionQuality,
          hasAudioTranscript: tempDeletedRecipe.hasAudioTranscript,
          createdAt: tempDeletedRecipe.createdAt
        });
        
        console.log('✅ Old recipe restored, new recipe removed (dry run)');
      }
      
      return { 
        success: true, 
        newRecipeId: isDryRun ? tempDeletedRecipe.id : newRecipeId,
        components: componentsCount,
        componentNames 
      };
    } else {
      throw new Error('No recipe ID returned from API');
    }
    
  } catch (error) {
    console.error(`❌ Error processing recipe: ${error.message}`);
    
    // Try to restore the old recipe if we have it and something went wrong
    if (tempDeletedRecipe) {
      try {
        console.log('🔄 Attempting to restore old recipe after error...');
        await db.insert(recipes).values({
          id: tempDeletedRecipe.id,
          sourceUrl: tempDeletedRecipe.sourceUrl,
          sourceType: tempDeletedRecipe.sourceType,
          rawText: tempDeletedRecipe.rawText,
          extracted: tempDeletedRecipe.extracted,
          thumbnailUrl: tempDeletedRecipe.thumbnailUrl,
          extractionMethod: tempDeletedRecipe.extractionMethod,
          extractionQuality: tempDeletedRecipe.extractionQuality,
          hasAudioTranscript: tempDeletedRecipe.hasAudioTranscript,
          createdAt: tempDeletedRecipe.createdAt
        });
        console.log('✅ Old recipe restored after error');
      } catch (restoreError) {
        console.error('💥 CRITICAL: Failed to restore old recipe after error!', restoreError.message);
      }
    }
    
    return { success: false, reason: 'processing_error', error: error.message };
  }
}

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    const recipesToMigrate = await getRecipesToMigrate();
    
    if (recipesToMigrate.length === 0) {
      console.log('🎉 All recipes already have component structure!');
      process.exit(0);
    }
    
    if (!isForce && !isDryRun) {
      console.log(`\n⚠️  This will reprocess ${recipesToMigrate.length} recipes using the API.`);
      console.log('💰 This may incur OpenAI API costs.');
      console.log('⏱️  Estimated time: ~30 seconds per recipe');
      console.log('🚨 Make sure your dev server is running on localhost:3000');
      
      const answer = await askQuestion('\nContinue? (y/N): ');
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Migration cancelled');
        process.exit(0);
      }
    }
    
    console.log('\n🚀 Starting migration...\n');
    
    const results = {
      total: recipesToMigrate.length,
      success: 0,
      failed: 0,
      skipped: 0,
      componentsAdded: 0
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
          results.componentsAdded += result.components || 0;
        }
      } else {
        results.failed++;
      }
      
      // Add a delay to avoid overwhelming the API
      if (i < recipesToMigrate.length - 1) {
        console.log('⏳ Waiting 3 seconds before next recipe...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n🎉 Migration Complete!');
    console.log('======================');
    console.log(`📊 Total recipes processed: ${results.total}`);
    console.log(`✅ Successfully migrated: ${results.success}`);
    console.log(`⏭️  Skipped (already have components): ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`🧩 Total components added: ${results.componentsAdded}`);
    
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

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Migration interrupted by user');
  await client.end();
  process.exit(0);
});

main().catch(console.error);
