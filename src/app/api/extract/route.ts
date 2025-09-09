import { NextRequest } from 'next/server';
import { db } from '@/db';
import { recipes, type RecipeJSON } from '@/db/schema';
import { detectSource, fetchInstagramOEmbed, fetchTikTokOEmbed, fetchYouTubeOEmbed } from '@/lib/sources';
import { extractRecipe } from '@/lib/llm';
import { extractVideoContent } from '@/lib/video-extractor';
import { transcribeVideoWithWhisper, isWhisperAvailable } from '@/lib/whisper-transcription';
import { eq } from 'drizzle-orm';

// Ensure we use the .env.local file and override any system environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

export const runtime = 'nodejs'; // keep it simple for now

type Body = { url: string; notes?: string; location?: string; quickCheck?: boolean };

export async function POST(req: NextRequest) {
  try {
    const { url, notes = '', location = 'Guam', quickCheck = false } = (await req.json()) as Body;
    if (!url) return new Response('Missing url', { status: 400 });

    // Fast check for existing recipe (optimized query)
    const existingRecipe = await db
      .select({ id: recipes.id, extracted: recipes.extracted })
      .from(recipes)
      .where(eq(recipes.sourceUrl, url))
      .limit(1);
    
    if (existingRecipe.length > 0) {
      // Return existing recipe immediately
      return Response.json({ 
        id: existingRecipe[0].id, 
        recipe: existingRecipe[0].extracted,
        isExisting: true 
      });
    }

    // If this is just a quick check and no existing recipe found, return not existing
    if (quickCheck) {
      return Response.json({
        isExisting: false
      });
    }

    const source = detectSource(url);

    let title = '';
    let thumb: string | undefined;
    let enhancedContent = '';
    let extractionMethod = 'oembed';
    let extractionQuality = 'low';
    let hasAudioTranscript = false;

    try {
      // First, try enhanced video extraction for YouTube/TikTok
      if (source === 'youtube' || source === 'tiktok') {
        console.log(`🎥 Attempting enhanced extraction for ${source}:`, url);
        
        // Try Whisper transcription for better quality
        if (isWhisperAvailable()) {
          console.log('🎤 Whisper API available, attempting audio transcription...');
          
          const transcriptionResult = await transcribeVideoWithWhisper(url);
          
          if (transcriptionResult.success && transcriptionResult.text) {
            console.log(`✅ Whisper transcription successful - ${transcriptionResult.text.length} chars`);
            
            // Get basic video info
            const videoContent = await extractVideoContent(url);
            title = videoContent.title || title;
            thumb = videoContent.thumbnail || thumb;
            
            // If we don't have a thumbnail from basic extraction, try oEmbed
            if (!thumb) {
              console.log('🖼️ No thumbnail from basic extraction, trying oEmbed...');
              if (source === 'youtube') {
                const data = await fetchYouTubeOEmbed(url);
                thumb = data.thumbnail_url || thumb;
              } else if (source === 'tiktok') {
                const data = await fetchTikTokOEmbed(url);
                thumb = data.thumbnail_url || thumb;
              }
            }
            
            // Combine title, description, and Whisper transcript
            enhancedContent = [
              videoContent.title,
              videoContent.description,
              'SPOKEN CONTENT (from audio):',
              transcriptionResult.text
            ].filter(Boolean).join('\n\n');
            
            // Set extraction metadata
            extractionMethod = 'whisper';
            extractionQuality = 'high';
            hasAudioTranscript = true;
            
            console.log(`✅ Enhanced content with Whisper transcript - ${enhancedContent.length} chars total`);
          } else {
            console.log(`⚠️ Whisper transcription failed: ${transcriptionResult.error}`);
            console.log('Falling back to basic video extraction...');
            
            const videoContent = await extractVideoContent(url);
            
            if (videoContent.combinedText) {
              title = videoContent.title || title;
              thumb = videoContent.thumbnail || thumb;
              enhancedContent = videoContent.combinedText;
              
              // Set extraction metadata for basic extraction
              extractionMethod = 'basic';
              extractionQuality = videoContent.captions ? 'medium' : 'low';
              hasAudioTranscript = false;
              
              console.log(`✅ Basic extraction successful - ${enhancedContent.length} chars`);
            } else {
              console.log('⚠️ Basic extraction returned empty, falling back to oEmbed');
              
              // Fallback to oEmbed
              if (source === 'youtube') {
                const data = await fetchYouTubeOEmbed(url);
                title = data.title ?? title;
                thumb = data.thumbnail_url ?? thumb;
              } else if (source === 'tiktok') {
                const data = await fetchTikTokOEmbed(url);
                title = data.title ?? title;
                thumb = data.thumbnail_url ?? thumb;
              }
            }
          }
        } else {
          console.log('⚠️ Whisper API not available (missing OPENAI_API_KEY), using basic extraction');
          
          const videoContent = await extractVideoContent(url);
          
          if (videoContent.combinedText) {
            title = videoContent.title || title;
            thumb = videoContent.thumbnail || thumb;
            enhancedContent = videoContent.combinedText;
            
            // Set extraction metadata for basic extraction (no Whisper available)
            extractionMethod = 'basic';
            extractionQuality = videoContent.captions ? 'medium' : 'low';
            hasAudioTranscript = false;
            
            console.log(`✅ Basic extraction successful - ${enhancedContent.length} chars`);
          } else {
            console.log('⚠️ Basic extraction returned empty, falling back to oEmbed');
            
            // Fallback to oEmbed
            if (source === 'youtube') {
              const data = await fetchYouTubeOEmbed(url);
              title = data.title ?? title;
              thumb = data.thumbnail_url ?? thumb;
            } else if (source === 'tiktok') {
              const data = await fetchTikTokOEmbed(url);
              title = data.title ?? title;
              thumb = data.thumbnail_url ?? thumb;
            }
          }
        }
      } else if (source === 'instagram') {
        const data = await fetchInstagramOEmbed(url);
        title = data.title ?? title;
        thumb = data.thumbnail_url ?? thumb;
      } else {
        // regular web page (future: parse JSON-LD schema.org/Recipe if you add web scraping)
      }
    } catch (e) {
      // If extraction fails, continue with minimal data
      console.error('Video extraction failed, using basic data:', e);
    }

    // Build "raw" for the LLM (enhanced content + user notes, or fallback to title + notes)
    const raw = [enhancedContent || title, notes].filter(Boolean).join('\n\n');
    
    console.log(`📝 Final raw content length: ${raw.length} chars`);
    console.log(`📝 Enhanced content length: ${enhancedContent.length} chars`);
    console.log(`📝 Title: ${title}`);
    console.log(`📝 Raw content preview: ${raw.substring(0, 200)}...`);

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
      thumbnailUrl: record.media?.thumbnail ?? null,
      extractionMethod,
      extractionQuality,
      hasAudioTranscript,
    }).returning({ id: recipes.id });

    return Response.json({ id: inserted[0].id, recipe: record });
  } catch (error) {
    console.error('Extract API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
