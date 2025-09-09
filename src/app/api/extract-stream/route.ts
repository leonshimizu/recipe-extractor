import { NextRequest } from 'next/server';
import { db } from '@/db';
import { recipes, type RecipeJSON } from '@/db/schema';
import { detectSource, fetchInstagramOEmbed, fetchTikTokOEmbed, fetchYouTubeOEmbed } from '@/lib/sources';
import { extractRecipe } from '@/lib/llm';
import { extractVideoContent } from '@/lib/video-extractor';
import { transcribeVideoWithWhisper, isWhisperAvailable } from '@/lib/whisper-transcription';
import { eq } from 'drizzle-orm';

type Body = { url: string; notes?: string; location?: string };

// Simple in-memory cache to prevent duplicate processing
const processingUrls = new Set<string>();

// Simple, realistic extraction time estimate
// Based on actual performance data: most extractions complete in 45-75 seconds
function estimateExtractionTime(
  videoDuration: number, // in seconds
  contentLength: number, // text length
  hasWhisper: boolean,
  source: string
): number {
  // Simple base estimate: most extractions take 60-90 seconds regardless of complexity
  // This is much more accurate than trying to calculate based on all factors
  
  if (hasWhisper) {
    return 75; // With audio transcription: ~75 seconds
  } else {
    return 60; // Without audio: ~60 seconds
  }
}

// Server-Sent Events for real-time progress updates
export async function POST(req: NextRequest) {
  const { url, notes = '', location = 'Guam' } = (await req.json()) as Body;
  
  console.log('🚀 [EXTRACT-STREAM] Starting extraction for:', url);
  console.log('📍 [EXTRACT-STREAM] Location:', location);
  console.log('📝 [EXTRACT-STREAM] Notes:', notes || '(none)');
  
  if (!url) {
    console.error('❌ [EXTRACT-STREAM] Missing URL');
    return new Response('Missing url', { status: 400 });
  }

  // Prevent duplicate processing with atomic check-and-set
  if (processingUrls.has(url)) {
    console.warn('⚠️ [EXTRACT-STREAM] Duplicate processing attempt for:', url);
    console.log('🔄 [EXTRACT-STREAM] Currently processing URLs:', Array.from(processingUrls));
    return new Response(
      `data: ${JSON.stringify({ error: 'Recipe already being processed', message: 'This URL is currently being processed. Please wait.' })}\n\n`,
      {
        status: 409,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
  
  // Immediately add to processing set to prevent race conditions
  processingUrls.add(url);
  console.log('🔒 [EXTRACT-STREAM] URL marked as processing:', url);

  // Check for existing recipe first
  console.log('🔍 [EXTRACT-STREAM] Checking for existing recipe...');
  const existingRecipe = await db.select().from(recipes).where(eq(recipes.sourceUrl, url)).limit(1);
  
  if (existingRecipe.length > 0) {
    console.log('✅ [EXTRACT-STREAM] Found existing recipe:', existingRecipe[0].id);
    // Remove from processing set since we're not actually processing
    processingUrls.delete(url);
    return Response.json({ 
      id: existingRecipe[0].id, 
      recipe: existingRecipe[0].extracted,
      isExisting: true 
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now();
      let estimatedDuration = 30; // Default estimate in seconds
      
      const sendUpdate = (step: string, progress: number, message: string, estimatedTime?: number) => {
        try {
          const elapsedTime = Math.round((Date.now() - startTime) / 1000);
          const data = JSON.stringify({ 
            step, 
            progress, 
            message,
            elapsedTime,
            estimatedDuration: estimatedTime || estimatedDuration
          });
          console.log(`📡 [EXTRACT-STREAM] Sending update: ${step} (${progress}%) - ${message} [${elapsedTime}s elapsed, ~${estimatedTime || estimatedDuration}s total]`);
          
          // Check if controller is still open before enqueueing
          if (controller.desiredSize !== null) {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } else {
            console.warn('⚠️ [EXTRACT-STREAM] Controller already closed, skipping update');
          }
        } catch (error) {
          console.error('❌ [EXTRACT-STREAM] Error sending update:', error);
        }
      };

      try {
        console.log('🎬 [EXTRACT-STREAM] Starting extraction process...');
        sendUpdate('start', 0, 'Starting extraction...');
        
        const source = detectSource(url);
        console.log('🔍 [EXTRACT-STREAM] Detected source:', source);
        let title = '';
        let thumb: string | undefined;
        let enhancedContent = '';
        let extractionMethod = 'oembed';
        let extractionQuality = 'low';
        let hasAudioTranscript = false;
        let videoDuration = 0; // in seconds
        let contentLength = 0;
        
        // Send initial estimate based on source
        const initialEstimate = estimateExtractionTime(0, 0, isWhisperAvailable(), source);
        estimatedDuration = initialEstimate;
        console.log('⏰ [EXTRACT-STREAM] Initial time estimate:', initialEstimate, 'seconds for', source);
        sendUpdate('start', 5, 'Initializing extraction...', initialEstimate);

        // Step 1: Get basic metadata (fast)
        console.log('📋 [EXTRACT-STREAM] Fetching metadata for source:', source);
        sendUpdate('metadata', 10, 'Fetching video metadata...');
        
        try {
          if (source === 'youtube') {
            console.log('📺 [EXTRACT-STREAM] Fetching YouTube oEmbed...');
            const oembed = await fetchYouTubeOEmbed(url);
            title = oembed.title || '';
            thumb = oembed.thumbnail_url;
            console.log('📺 [EXTRACT-STREAM] YouTube title:', title);
          } else if (source === 'tiktok') {
            console.log('🎵 [EXTRACT-STREAM] Fetching TikTok oEmbed...');
            const oembed = await fetchTikTokOEmbed(url);
            title = oembed.title || '';
            thumb = oembed.thumbnail_url;
            console.log('🎵 [EXTRACT-STREAM] TikTok title:', title);
          } else if (source === 'instagram') {
            console.log('📸 [EXTRACT-STREAM] Fetching Instagram oEmbed...');
            const oembed = await fetchInstagramOEmbed(url);
            title = oembed.title || '';
            thumb = oembed.thumbnail_url;
            console.log('📸 [EXTRACT-STREAM] Instagram title:', title);
          }
        } catch (error) {
          console.warn('⚠️ [EXTRACT-STREAM] OEmbed failed, continuing...', error);
        }

        console.log('📋 [EXTRACT-STREAM] Final metadata - Title:', title, 'Thumb:', thumb ? 'Yes' : 'No');
        sendUpdate('metadata', 20, 'Metadata retrieved');

        // Step 2: Start parallel processing
        console.log('⚡ [EXTRACT-STREAM] Starting parallel processing...');
        sendUpdate('processing', 30, 'Analyzing video content...');
        
        const promises: Promise<unknown>[] = [];
        
        // Parallel: Enhanced content extraction
        console.log('📄 [EXTRACT-STREAM] Starting enhanced content extraction...');
        promises.push(
          extractVideoContent(url).then(content => {
            console.log('📄 [EXTRACT-STREAM] Enhanced content extracted:', {
              hasContent: !!content.combinedText,
              contentLength: content.combinedText?.length || 0,
              hasCaptions: !!content.captions
            });
            enhancedContent = content.combinedText;
            contentLength = content.combinedText?.length || 0;
            videoDuration = content.duration || 0;
            extractionMethod = 'basic';
            extractionQuality = content.captions ? 'medium' : 'low';
            
            // Update estimation with content length and video duration
            const newEstimate = estimateExtractionTime(videoDuration, contentLength, isWhisperAvailable(), source);
            estimatedDuration = newEstimate;
            
            sendUpdate('content', 50, 'Video content extracted', newEstimate);
            return content;
          }).catch(error => {
            console.warn('⚠️ [EXTRACT-STREAM] Enhanced extraction failed:', error);
            return null;
          })
        );

        // Parallel: Whisper transcription (if available)
        if (isWhisperAvailable()) {
          console.log('🎤 [EXTRACT-STREAM] Starting Whisper transcription...');
          promises.push(
            transcribeVideoWithWhisper(url).then(result => {
              if (result.success && result.text) {
                console.log('🎤 [EXTRACT-STREAM] Whisper transcription successful:', {
                  transcriptLength: result.text.length,
                  hasTranscript: !!result.text,
                  duration: result.duration
                });
                enhancedContent = enhancedContent ? 
                  `${enhancedContent}\n\nTRANSCRIPT:\n${result.text}` : 
                  result.text;
                hasAudioTranscript = true;
                extractionQuality = 'high';
                
                // Use the real video duration from Whisper if we didn't get it before
                if (result.duration && videoDuration === 0) {
                  videoDuration = result.duration;
                  console.log('📏 [EXTRACT-STREAM] Updated video duration from Whisper:', videoDuration, 'seconds');
                }
                
                // Update estimation with Whisper transcription and real duration
                const newEstimate = estimateExtractionTime(videoDuration, contentLength, true, source);
                estimatedDuration = newEstimate;
                
                sendUpdate('transcription', 70, 'Audio transcription completed', newEstimate);
              } else {
                console.log('🎤 [EXTRACT-STREAM] Whisper transcription returned no result');
              }
              return result;
            }).catch(error => {
              console.warn('⚠️ [EXTRACT-STREAM] Whisper transcription failed:', error);
              return null;
            })
          );
        } else {
          console.log('🎤 [EXTRACT-STREAM] Whisper not available, skipping transcription');
        }

        // Wait for all parallel operations
        console.log('⏳ [EXTRACT-STREAM] Waiting for parallel operations to complete...');
        await Promise.allSettled(promises);
        
        console.log('🤖 [EXTRACT-STREAM] Starting AI processing...');
        sendUpdate('ai', 80, 'Processing with AI...');

        // Step 3: LLM extraction
        // Always include title prominently, plus any enhanced content
        console.log('📝 [EXTRACT-STREAM] Preparing content for LLM...');
        const contentParts = [];
        if (title) {
          contentParts.push(`VIDEO TITLE: ${title}`);
          console.log('📝 [EXTRACT-STREAM] Added title to content');
        }
        if (enhancedContent) {
          contentParts.push(`VIDEO CONTENT: ${enhancedContent}`);
          console.log('📝 [EXTRACT-STREAM] Added enhanced content to content (length:', enhancedContent.length, ')');
        }
        if (notes) {
          contentParts.push(`ADDITIONAL NOTES: ${notes}`);
          console.log('📝 [EXTRACT-STREAM] Added notes to content');
        }
        
        const raw = contentParts.join('\n\n');
        console.log('📝 [EXTRACT-STREAM] Final content for LLM:', {
          totalLength: raw.length,
          hasTitle: !!title,
          hasEnhancedContent: !!enhancedContent,
          hasNotes: !!notes,
          extractionMethod,
          extractionQuality,
          hasAudioTranscript
        });
        
        console.log('🤖 [EXTRACT-STREAM] Calling LLM with location:', location);
        const extracted = await extractRecipe({
          sourceUrl: url,
          raw,
          location
        });
        
        console.log('🤖 [EXTRACT-STREAM] LLM extraction completed:', {
          title: extracted.title,
          ingredientsCount: extracted.ingredients?.length || 0,
          stepsCount: extracted.steps?.length || 0,
          hasServings: !!extracted.servings,
          hasTimes: !!extracted.times
        });

        console.log('💾 [EXTRACT-STREAM] Saving recipe to database...');
        sendUpdate('saving', 90, 'Saving recipe...');

        // Step 4: Save to database
        const record: RecipeJSON = {
          ...extracted,
          sourceUrl: url,
          media: { thumbnail: thumb ?? null },
          totalEstimatedCost: extracted.totalEstimatedCost ?? null,
          equipment: extracted.equipment ?? []
        };

        console.log('💾 [EXTRACT-STREAM] Database record prepared:', {
          title: record.title,
          sourceUrl: record.sourceUrl,
          hasMedia: !!record.media?.thumbnail,
          totalCost: record.totalEstimatedCost,
          equipmentCount: record.equipment?.length || 0
        });

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

        const recipeId = inserted[0].id;
        console.log('✅ [EXTRACT-STREAM] Recipe saved successfully with ID:', recipeId);

        sendUpdate('complete', 100, 'Recipe extracted successfully!');
        
        // Send final result
        console.log('📤 [EXTRACT-STREAM] Sending final success response...');
        const finalData = JSON.stringify({ 
          id: recipeId, 
          recipe: record,
          complete: true 
        });
        controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
        
      } catch (error) {
        console.error('❌ [EXTRACT-STREAM] Extraction failed:', error);
        console.error('❌ [EXTRACT-STREAM] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          url,
          location
        });
        const errorData = JSON.stringify({ 
          error: 'Extraction failed', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        // Remove URL from processing set
        console.log('🧹 [EXTRACT-STREAM] Cleaning up - removing URL from processing set:', url);
        processingUrls.delete(url);
        console.log('🧹 [EXTRACT-STREAM] Processing URLs after cleanup:', Array.from(processingUrls));
        console.log('🔚 [EXTRACT-STREAM] Closing stream for:', url);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
