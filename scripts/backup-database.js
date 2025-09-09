#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Creates a JSON backup of all recipes before running migrations.
 * 
 * Usage:
 *   node scripts/backup-database.js
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { writeFileSync } = require('fs');
const dotenv = require('dotenv');
const { pgTable, uuid, text, timestamp, jsonb, varchar, boolean } = require('drizzle-orm/pg-core');

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

async function createBackup() {
  try {
    console.log('📦 Creating database backup...');
    
    const allRecipes = await db.select().from(recipes);
    
    const backup = {
      timestamp: new Date().toISOString(),
      totalRecipes: allRecipes.length,
      recipes: allRecipes
    };
    
    const filename = `backup-recipes-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    const filepath = `./scripts/${filename}`;
    
    writeFileSync(filepath, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup created successfully!`);
    console.log(`📁 File: ${filepath}`);
    console.log(`📊 Recipes backed up: ${allRecipes.length}`);
    console.log(`💾 File size: ${(Buffer.byteLength(JSON.stringify(backup)) / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createBackup();
