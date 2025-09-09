import { pgTable, uuid, text, timestamp, jsonb, varchar, boolean, integer } from 'drizzle-orm/pg-core';

export type RecipeComponent = {
  name: string;
  ingredients: { quantity: string | null; unit: string | null; name: string; notes?: string | null; estimatedCost?: number | null }[];
  steps: string[];
  notes?: string | null;
};

export type RecipeJSON = {
  title: string;
  sourceUrl: string;
  servings: number | null;
  times: { prep: string | null; cook: string | null; total: string | null };
  // New component-based structure
  components: RecipeComponent[];
  // Legacy fields for backward compatibility
  ingredients: { quantity: string | null; unit: string | null; name: string; notes?: string | null; estimatedCost?: number | null }[];
  steps: string[];
  equipment: string[] | null;
  notes?: string | null; // Made optional
  tags: string[];
  media: { thumbnail: string | null };
  totalEstimatedCost: number | null;
  costLocation: string;
  nutrition: {
    perServing: {
      calories: number | null;
      protein: number | null; // grams
      carbs: number | null; // grams
      fat: number | null; // grams
      fiber: number | null; // grams
      sugar: number | null; // grams
      sodium: number | null; // milligrams
    };
    total: {
      calories: number | null;
      protein: number | null;
      carbs: number | null;
      fat: number | null;
      fiber: number | null;
      sugar: number | null;
      sodium: number | null;
    };
  };
};

export const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceUrl: text('source_url').notNull(),
  sourceType: varchar('source_type', { length: 32 }).notNull(), // youtube|tiktok|instagram|web|manual
  rawText: text('raw_text'),
  extracted: jsonb('extracted').$type<RecipeJSON>().notNull(),
  thumbnailUrl: text('thumbnail_url'),
  extractionMethod: varchar('extraction_method', { length: 32 }), // whisper|basic|oembed|manual
  extractionQuality: varchar('extraction_quality', { length: 16 }), // high|medium|low
  hasAudioTranscript: boolean('has_audio_transcript').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const extractionJobs = pgTable('extraction_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: text('url').notNull().unique(),
  location: text('location').notNull().default('Guam'),
  notes: text('notes').notNull().default(''),
  status: varchar('status', { length: 16 }).notNull().default('processing'), // processing|completed|failed
  progress: integer('progress').notNull().default(0), // 0-100
  currentStep: varchar('current_step', { length: 32 }).notNull().default('initializing'),
  message: text('message').notNull().default('Starting extraction...'),
  estimatedDuration: integer('estimated_duration').notNull().default(60), // seconds
  recipeId: uuid('recipe_id').references(() => recipes.id),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});