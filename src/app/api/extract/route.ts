import { NextRequest } from 'next/server';
import { db } from '@/db';
import { recipes, type RecipeJSON } from '@/db/schema';
import { detectSource, fetchInstagramOEmbed, fetchTikTokOEmbed, fetchYouTubeOEmbed } from '@/lib/sources';
import { extractRecipe } from '@/lib/llm';
import { eq } from 'drizzle-orm';

// Ensure we use the .env.local file and override any system environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

export const runtime = 'nodejs'; // keep it simple for now

type Body = { url: string; notes?: string; location?: string };

export async function POST(req: NextRequest) {
  try {
    const { url, notes = '', location = 'Guam' } = (await req.json()) as Body;
    if (!url) return new Response('Missing url', { status: 400 });

    // Check if we already have this URL
    const existingRecipe = await db.select().from(recipes).where(eq(recipes.sourceUrl, url)).limit(1);
    
    if (existingRecipe.length > 0) {
      // Return existing recipe instead of creating a new one
      return Response.json({ 
        id: existingRecipe[0].id, 
        recipe: existingRecipe[0].extracted,
        isExisting: true 
      });
    }

    const source = detectSource(url);

    let title = '';
    let thumb: string | undefined;

    try {
      if (source === 'youtube') {
        const data = await fetchYouTubeOEmbed(url);
        title = data.title ?? title;
        thumb = data.thumbnail_url ?? thumb;
        // For v1 we don't attempt transcript; keep rawText as provided.
      } else if (source === 'tiktok') {
        const data = await fetchTikTokOEmbed(url);
        title = data.title ?? title;
        thumb = data.thumbnail_url ?? thumb;
        // captions are usually sparse; rely on notes
      } else if (source === 'instagram') {
        const data = await fetchInstagramOEmbed(url);
        title = data.title ?? title;
        thumb = data.thumbnail_url ?? thumb;
      } else {
        // regular web page (future: parse JSON-LD schema.org/Recipe if you add web scraping)
      }
    } catch (e) {
      // If oEmbed fails, continue with minimal data
      console.error('oEmbed failed', e);
    }

    // Build "raw" for the LLM (title + notes for MVP)
    const raw = [title, notes].filter(Boolean).join('\n\n');

    const extracted = await extractRecipe({
      sourceUrl: url,
      raw,
      location
    });

    // Ensure schema shape and inject thumbnail
    const record: RecipeJSON = {
      ...extracted,
      sourceUrl: url,
      media: { thumbnail: thumb ?? null },
      totalEstimatedCost: extracted.totalEstimatedCost ?? null
    };

    const inserted = await db.insert(recipes).values({
      sourceUrl: url,
      sourceType: source,
      rawText: raw,
      extracted: record,
      thumbnailUrl: record.media?.thumbnail ?? null
    }).returning({ id: recipes.id });

    return Response.json({ id: inserted[0].id, recipe: record });
  } catch (error) {
    console.error('Extract API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
