import { NextRequest } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema';
import { extractRecipe } from '@/lib/llm';
import { eq } from 'drizzle-orm';

type Body = { 
  recipeId?: string; 
  isDryRun?: boolean;
  recipeData?: any; // For when recipe is already deleted
};

export async function POST(req: NextRequest) {
  const { recipeId, isDryRun = false, recipeData } = (await req.json()) as Body;
  
  console.log('🔄 [MIGRATE-RECIPE] Starting migration for recipe:', recipeId);
  console.log('🔍 [MIGRATE-RECIPE] Dry run mode:', isDryRun);
  console.log('📦 [MIGRATE-RECIPE] Using provided recipe data:', !!recipeData);
  
  if (!recipeId && !recipeData) {
    return Response.json({ error: 'Missing recipeId or recipeData' }, { status: 400 });
  }

  try {
    let existingRecipe;
    
    if (recipeData) {
      // Use provided recipe data (for when recipe is already deleted)
      existingRecipe = recipeData;
      console.log('📄 [MIGRATE-RECIPE] Using provided recipe data:', existingRecipe.extracted.title);
    } else {
      // Fetch the existing recipe from database
      const [dbRecipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId));
      
      if (!dbRecipe) {
        return Response.json({ error: 'Recipe not found' }, { status: 404 });
      }
      
      existingRecipe = dbRecipe;
    }

    console.log('📄 [MIGRATE-RECIPE] Found recipe:', existingRecipe.extracted.title);

    // Check if recipe already has components
    if (existingRecipe.extracted.components && existingRecipe.extracted.components.length > 0) {
      console.log('✅ [MIGRATE-RECIPE] Recipe already has components, skipping');
      return Response.json({ 
        success: true, 
        skipped: true, 
        message: 'Recipe already has component structure' 
      });
    }

    // Prepare raw content for reprocessing
    let rawContent = '';
    
    // Add title (with sanitization)
    if (existingRecipe.extracted.title) {
      const sanitizedTitle = existingRecipe.extracted.title
        .replace(/…/g, '...')
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .replace(/[—–]/g, '-')
        .replace(/[^\x00-\x7F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      rawContent += `VIDEO TITLE: ${sanitizedTitle}\n\n`;
    }
    
    // Add existing raw text if available (with sanitization)
    if (existingRecipe.rawText) {
      const sanitizedRawText = existingRecipe.rawText
        .replace(/…/g, '...')
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .replace(/[—–]/g, '-')
        .replace(/[^\x00-\x7F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      rawContent += `CONTENT: ${sanitizedRawText}\n\n`;
    }
    
    // If no raw text, reconstruct from existing extracted data (with sanitization)
    if (!existingRecipe.rawText && existingRecipe.extracted) {
      rawContent += `INGREDIENTS:\n`;
      existingRecipe.extracted.ingredients?.forEach(ing => {
        const quantity = ing.quantity ? `${ing.quantity} ` : '';
        const unit = ing.unit ? `${ing.unit} ` : '';
        const sanitizedName = ing.name
          .replace(/…/g, '...')
          .replace(/[""]/g, '"')
          .replace(/['']/g, "'")
          .replace(/[—–]/g, '-')
          .replace(/[^\x00-\x7F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        rawContent += `- ${quantity}${unit}${sanitizedName}\n`;
      });
      
      rawContent += `\nSTEPS:\n`;
      existingRecipe.extracted.steps?.forEach((step, i) => {
        const sanitizedStep = step
          .replace(/…/g, '...')
          .replace(/[""]/g, '"')
          .replace(/['']/g, "'")
          .replace(/[—–]/g, '-')
          .replace(/[^\x00-\x7F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        rawContent += `${i + 1}. ${sanitizedStep}\n`;
      });
    }

    console.log('📝 [MIGRATE-RECIPE] Raw content length:', rawContent.length);

    if (rawContent.length < 50) {
      return Response.json({ 
        success: false, 
        error: 'Insufficient content for reprocessing' 
      });
    }

    // Reprocess with the new component-aware LLM (sanitization happens inside extractRecipe)
    const location = existingRecipe.extracted.costLocation || 'Guam';
    console.log('🤖 [MIGRATE-RECIPE] Reprocessing with LLM...');
    
    const newExtracted = await extractRecipe({
      sourceUrl: existingRecipe.sourceUrl,
      raw: rawContent,
      location: location
    });

    console.log('✅ [MIGRATE-RECIPE] LLM processing complete');
    console.log('🧩 [MIGRATE-RECIPE] Components found:', newExtracted.components?.length || 0);
    
    if (newExtracted.components && newExtracted.components.length > 0) {
      console.log('📋 [MIGRATE-RECIPE] Component names:', newExtracted.components.map(c => c.name).join(', '));
    }

    if (!isDryRun) {
      if (recipeData) {
        // Insert new recipe (old one was deleted)
        const newRecord = {
          id: existingRecipe.id,
          sourceUrl: existingRecipe.sourceUrl,
          sourceType: existingRecipe.sourceType,
          rawText: existingRecipe.rawText,
          extracted: {
            ...newExtracted,
            media: existingRecipe.extracted.media || { thumbnail: null }
          },
          thumbnailUrl: existingRecipe.thumbnailUrl,
          extractionMethod: existingRecipe.extractionMethod,
          extractionQuality: existingRecipe.extractionQuality,
          hasAudioTranscript: existingRecipe.hasAudioTranscript,
          createdAt: existingRecipe.createdAt ? new Date(existingRecipe.createdAt) : new Date()
        };
        
        await db.insert(recipes).values(newRecord);
        console.log('💾 [MIGRATE-RECIPE] New recipe inserted successfully');
      } else {
        // Update existing recipe
        await db.update(recipes)
          .set({
            extracted: {
              ...newExtracted,
              media: existingRecipe.extracted.media || { thumbnail: null }
            }
          })
          .where(eq(recipes.id, recipeId));
        
        console.log('💾 [MIGRATE-RECIPE] Database updated successfully');
      }
    } else {
      console.log('🔍 [MIGRATE-RECIPE] DRY RUN - Would update database');
    }

    return Response.json({
      success: true,
      recipeId: recipeId,
      title: newExtracted.title,
      componentsCount: newExtracted.components?.length || 0,
      componentNames: newExtracted.components?.map(c => c.name) || [],
      ingredientsCount: newExtracted.ingredients?.length || 0,
      stepsCount: newExtracted.steps?.length || 0,
      isDryRun
    });

  } catch (error) {
    console.error('❌ [MIGRATE-RECIPE] Error:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
