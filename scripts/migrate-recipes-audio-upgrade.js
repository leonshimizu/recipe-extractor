#!/usr/bin/env node

/**
 * Audio Upgrade Migration Script
 * 
 * Migrates existing recipes that were extracted without audio transcription
 * to use Whisper audio transcription for better quality.
 * 
 * Target criteria:
 * - hasAudioTranscript = false
 * - sourceType = 'youtube' or 'tiktok' (platforms that support audio)
 * - extractionMethod != 'whisper'
 * - createdAt before the audio fix date
 * 
 * IMPORTANT: Always run backup-database.js before using this script!
 * 
 * Usage:
 *   node scripts/migrate-recipes-audio-upgrade.js --dry-run --limit 5
 *   node scripts/migrate-recipes-audio-upgrade.js
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
const { eq, and, inArray, lt, not } = require('drizzle-orm');

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

// Define extraction jobs table for foreign key cleanup
const extractionJobs = pgTable('extraction_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipeId: uuid('recipe_id').references(() => recipes.id),
  // ... other fields not needed for deletion
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

// Date before which recipes should be considered for upgrade
const AUDIO_FIX_DATE = new Date('2025-09-10T02:00:00Z');

console.log('🔄 Audio Upgrade Migration Script');
console.log('==================================');
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
    // Filter recipes that need audio upgrade
    query = query.where(
      and(
        // Must not already have audio transcript
        eq(recipes.hasAudioTranscript, false),
        
        // Must be from platforms that support audio transcription
        inArray(recipes.sourceType, ['youtube', 'tiktok']),
        
        // Must not already be using Whisper (we want to upgrade TO Whisper)
        not(eq(recipes.extractionMethod, 'whisper')),
        
        // Must be created before the audio fix
        lt(recipes.createdAt, AUDIO_FIX_DATE)
      )
    );
  }
  
  // Add limit if specified
  if (limit) {
    query = query.limit(limit);
  }
  
  const allRecipes = await query;
  console.log(`📈 Found ${allRecipes.length} recipes that need audio upgrade`);
  
  // Show breakdown by source type
  const breakdown = allRecipes.reduce((acc, recipe) => {
    acc[recipe.sourceType] = (acc[recipe.sourceType] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📊 Breakdown by source:');
  Object.entries(breakdown).forEach(([source, count]) => {
    console.log(`   - ${source}: ${count} recipes`);
  });
  
  return allRecipes;
}

async function migrateRecipe(recipe) {
  console.log(`\n🔄 Processing: ${recipe.extracted.title}`);
  console.log(`📝 ID: ${recipe.id}`);
  console.log(`🌐 Source: ${recipe.sourceUrl}`);
  console.log(`📱 Type: ${recipe.sourceType}`);
  console.log(`🎯 Current method: ${recipe.extractionMethod || 'basic'}`);
  console.log(`🎤 Has audio: ${recipe.hasAudioTranscript}`);
  
  if (isDryRun) {
    console.log('🔍 DRY RUN: Would upgrade this recipe with audio transcription');
    return { 
      success: true, 
      changes: 'Would re-extract with Whisper audio transcription',
      dryRun: true
    };
  }
  
  let tempDeletedRecipe = null;
  
  try {
    // Step 1: Temporarily delete the old recipe to avoid duplicate URL validation
    console.log('🗑️  Temporarily deleting old recipe to avoid duplicate validation...');
    
    // First, delete any related extraction jobs to satisfy foreign key constraints
    const deletedJobs = await db.delete(extractionJobs).where(eq(extractionJobs.recipeId, recipe.id)).returning({ id: extractionJobs.id });
    if (deletedJobs.length > 0) {
      console.log(`🗑️  Deleted ${deletedJobs.length} related extraction job(s)`);
    }
    
    // Then delete the recipe
    await db.delete(recipes).where(eq(recipes.id, recipe.id));
    tempDeletedRecipe = recipe; // Store for potential restoration
    console.log('✅ Old recipe temporarily deleted');
    
    // Wait a moment to ensure deletion takes effect
    console.log('⏳ Waiting for deletion to take effect...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Use the regular extract API to re-process with audio
    console.log(`🤖 Re-extracting with audio transcription...`);
    
    const response = await fetch(`http://localhost:3000/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: recipe.sourceUrl,
        location: 'Guam', // Default location
        notes: `[AUDIO UPGRADE] Re-processed for audio transcription on ${new Date().toISOString()}`
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Handle extraction API response
    const result = await response.json();
    
    if (result.recipe) {
      const newRecipe = result.recipe;
      const hasAudio = newRecipe.hasAudioTranscript || false;
      const newMethod = newRecipe.extractionMethod || 'basic';
      const newQuality = newRecipe.extractionQuality || 'low';
      
      console.log(`✅ Migration successful:`);
      console.log(`   - New method: ${newMethod}`);
      console.log(`   - New quality: ${newQuality}`);
      console.log(`   - Has audio: ${hasAudio}`);
      console.log(`   - Recipe ID: ${result.id}`);
      
      tempDeletedRecipe = null; // Clear since we succeeded
      
      return { 
        success: true, 
        changes: `Upgraded from ${recipe.extractionMethod || 'basic'} to ${newMethod}, audio: ${hasAudio}`,
        newId: result.id,
        hasAudio,
        newMethod,
        newQuality
      };
    } else {
      throw new Error('No recipe returned from API');
    }
    
  } catch (error) {
    console.error(`❌ Error processing recipe: ${error.message}`);
    
    // Restore the original recipe if we deleted it
    if (tempDeletedRecipe) {
      console.log('🔄 Restoring original recipe...');
      try {
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
          createdAt: tempDeletedRecipe.createdAt,
        });
        console.log('✅ Original recipe restored');
      } catch (restoreError) {
        console.error('💥 CRITICAL: Failed to restore original recipe!', restoreError.message);
        console.error('💾 Original recipe data:', JSON.stringify(tempDeletedRecipe, null, 2));
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
      console.log('✅ No recipes need audio upgrade!');
      process.exit(0);
    }

    if (!isDryRun) {
      console.log(`\n⚠️  This will upgrade ${recipesToMigrate.length} recipes with audio transcription.`);
      console.log('💰 This may incur OpenAI API costs for Whisper transcription.');
      console.log('⏱️  Estimated time: ~30-60 seconds per recipe');
      console.log('🚨 Make sure you have run backup-database.js first!');
      
      const answer = await askQuestion('\nContinue? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Migration cancelled.');
        process.exit(0);
      }
    }

    console.log('\n🚀 Starting audio upgrade migration...\n');

    const results = {
      total: recipesToMigrate.length,
      success: 0,
      failed: 0,
      withAudio: 0,
      withoutAudio: 0
    };

    for (let i = 0; i < recipesToMigrate.length; i++) {
      const recipe = recipesToMigrate[i];
      
      console.log(`\n📊 Progress: ${i + 1}/${recipesToMigrate.length}`);
      
      const result = await migrateRecipe(recipe);
      
      if (result.success) {
        results.success++;
        if (result.hasAudio) {
          results.withAudio++;
        } else {
          results.withoutAudio++;
        }
      } else {
        results.failed++;
      }
      
      // Add delay between recipes to avoid overwhelming APIs
      if (i < recipesToMigrate.length - 1) {
        console.log('⏳ Waiting 5 seconds before next recipe...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('\n🎉 Audio Upgrade Migration Complete!');
    console.log('====================================');
    console.log(`📊 Total recipes processed: ${results.total}`);
    console.log(`✅ Successfully upgraded: ${results.success}`);
    console.log(`🎤 Now with audio transcription: ${results.withAudio}`);
    console.log(`📝 Still text-only (but improved): ${results.withoutAudio}`);
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
