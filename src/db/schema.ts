import { pgTable, uuid, text, timestamp, jsonb, varchar } from 'drizzle-orm/pg-core';

export type RecipeJSON = {
  title: string;
  sourceUrl: string;
  servings: number | null;
  times: { prep: string | null; cook: string | null; total: string | null };
  ingredients: { quantity: string | null; unit: string | null; name: string; notes?: string | null; estimatedCost: number | null }[];
  steps: string[];
  equipment: string[];
  notes: string | null;
  tags: string[];
  media: { thumbnail: string | null };
  totalEstimatedCost: number | null;
  costLocation: string;
};

export const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceUrl: text('source_url').notNull(),
  sourceType: varchar('source_type', { length: 32 }).notNull(), // youtube|tiktok|instagram|web|manual
  rawText: text('raw_text'),
  extracted: jsonb('extracted').$type<RecipeJSON>().notNull(),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});