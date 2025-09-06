import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

export const RecipeSchema = z.object({
  title: z.string(),
  sourceUrl: z.string().url(),
  servings: z.number().int().nullable(),
  times: z.object({ 
    prep: z.string().nullable(), 
    cook: z.string().nullable(), 
    total: z.string().nullable() 
  }),
  ingredients: z.array(z.object({
    quantity: z.string().nullable(),
    unit: z.string().nullable(),
    name: z.string(),
    notes: z.string().nullable().optional(),
    estimatedCost: z.number().nullable()
  })),
  steps: z.array(z.string()),
  equipment: z.array(z.string()),
  notes: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  totalEstimatedCost: z.number().nullable(),
  costLocation: z.string()
});

// Function to clean text and remove problematic Unicode characters
function sanitizeText(text: string): string {
  return text
    // Remove emojis and other high Unicode characters (including surrogate pairs)
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, ' ')
    // Replace smart quotes with regular quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Replace ellipsis with three dots
    .replace(/…/g, '...')
    // Replace em dash and en dash with regular dash
    .replace(/[—–]/g, '-')
    // Remove any remaining high Unicode characters
    .replace(/[\u0100-\uFFFF]/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export async function extractRecipe({ sourceUrl, raw, location = 'Guam' }: { sourceUrl: string; raw: string; location?: string }) {
  // Sanitize the input text to prevent Unicode issues
  const sanitizedRaw = sanitizeText(raw);
  
  // Additional safety check - convert to ASCII only
  const asciiOnlyRaw = sanitizedRaw.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
  
    const promptText = `You are a culinary extraction engine. From the raw text or caption below, extract a recipe.
Return ONLY the fields in the schema.
If info is missing, return null (not the string "null") or [] accordingly.

IMPORTANT: You MUST include ALL required fields in your response:
- sourceUrl: ${sourceUrl}

RAW:
${asciiOnlyRaw}

Rules:
- Set sourceUrl to exactly: ${sourceUrl}
- Ingredients should be concise, each item one line.
- Steps should be actionable and ordered.
- For times, extract ALL timing components:
  * prep: Time for mixing, chopping, blending ingredients (estimate if not explicit)
  * cook: Active cooking time (microwave, oven, stovetop, etc.)
  * total: Complete time including prep, cook, AND any chilling/resting/setting time
  * Look for: "microwave for X", "set in fridge for X", "chill for X", "rest for X"
  * Use null (not "null" string) only if truly no timing info exists
  * Format as "15 min", "1 hour", "2-3 hours"
- For ingredient costs (estimatedCost), provide realistic grocery store prices in USD for ${location}:
  * Base estimates on typical grocery store prices in ${location} for the specified quantities
  * Consider regional price differences: Guam/Hawaii tend to be 20-40% higher than mainland US
  * Japan: convert from yen (¥100-150 ≈ $1), UK: convert from pounds (£0.75 ≈ $1)
  * Round to nearest $0.25 (e.g., 0.50, 0.75, 1.00, 1.25)
  * Use null only if ingredient is unclear
- Calculate totalEstimatedCost as sum of all ingredient costs
- Set costLocation to exactly: ${location}
- If servings unknown, use null (not "null" string)
- Equipment only if mentioned explicitly.
- Tags should include cuisine type, dietary restrictions, cooking method if mentioned.
- If no clear recipe is found, create a basic structure with the available information.`;

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: RecipeSchema,
    prompt: promptText,
  });
  return object;
}