import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

export const RecipeSchema = z.object({
  title: z.string().min(1),
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
    estimatedCost: z.number().nullable().optional()
  })),
  steps: z.array(z.string()),
  equipment: z.array(z.string()),
  notes: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  totalEstimatedCost: z.number().nullable(),
  costLocation: z.string(),
  nutrition: z.object({
    perServing: z.object({
      calories: z.number().nullable(),
      protein: z.number().nullable(), // grams
      carbs: z.number().nullable(), // grams
      fat: z.number().nullable(), // grams
      fiber: z.number().nullable(), // grams
      sugar: z.number().nullable(), // grams
      sodium: z.number().nullable() // milligrams
    }),
    total: z.object({
      calories: z.number().nullable(),
      protein: z.number().nullable(),
      carbs: z.number().nullable(),
      fat: z.number().nullable(),
      fiber: z.number().nullable(),
      sugar: z.number().nullable(),
      sodium: z.number().nullable()
    })
  })
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
  
    const promptText = `You are a culinary extraction engine. From the video content below, extract a complete recipe.
The content may include video title, description, and/or transcript/captions.
Return ONLY the fields in the schema.
If info is missing, return null (not the string "null") or [] accordingly.

IMPORTANT: You MUST include ALL required fields in your response:
- sourceUrl: ${sourceUrl}

VIDEO CONTENT:
${asciiOnlyRaw}

EXTRACTION RULES:
- Set sourceUrl to exactly: ${sourceUrl}
- CAREFULLY read through ALL the content (title, description, transcript) to find recipe details
- Look for ingredients mentioned anywhere in the content, including spoken instructions
- Extract ALL cooking steps, including details like "toast the tomato paste" or "add heavy cream"
- Pay attention to cooking techniques mentioned in video transcripts (sautéing, browning, etc.)
- For ingredients, format properly:
  * quantity: Use null (not "null" string) if no quantity specified
  * unit: Use null (not "null" string) if no unit specified  
  * For items without quantities (like "salt to taste"), set quantity and unit to null
  * Examples: {"quantity": "2", "unit": "cups", "name": "flour"} or {"quantity": null, "unit": null, "name": "salt"}
- Ingredients should be concise, each item one line.
- Steps should be actionable and ordered, including ALL mentioned techniques.
- For times, extract ALL timing components:
  * prep: Time for mixing, chopping, blending ingredients (estimate if not explicit)
  * cook: Active cooking time (microwave, oven, stovetop, etc.)
  * total: Complete time including prep, cook, AND any chilling/resting/setting time
  * Look for: "microwave for X", "set in fridge for X", "chill for X", "rest for X"
  * Use null (not "null" string) only if truly no timing info exists
  * Format as "15 min", "1 hour", "2-3 hours"
- For ingredient costs (estimatedCost), ALWAYS provide realistic grocery store prices in USD for ${location}:
  * REQUIRED: Every ingredient must have an estimatedCost field
  * Base estimates on typical grocery store prices in ${location} for the specified quantities
  * Consider regional price differences: Guam/Hawaii tend to be 20-40% higher than mainland US
  * Japan: convert from yen (¥100-150 ≈ $1), UK: convert from pounds (£0.75 ≈ $1)
  * Round to nearest $0.25 (e.g., 0.50, 0.75, 1.00, 1.25)
  * Use null only if ingredient is completely unclear, but estimate when possible
- Calculate totalEstimatedCost as sum of all ingredient costs
- Set costLocation to exactly: ${location}
- For servings, ALWAYS try to estimate a reasonable number based on ingredient quantities:
  * Look at total amounts (1 lb pasta typically serves 4-6 people)
  * Consider portion sizes for the type of dish (appetizer vs main course)
  * If truly impossible to estimate, use null, but this should be rare
- For nutrition, calculate realistic nutritional values based on ingredients and quantities:
  * Analyze each ingredient for calories, protein, carbs, fat, fiber, sugar, sodium
  * Use standard USDA nutritional data as reference
  * ALWAYS calculate BOTH perServing and total nutrition values
  * If servings is known: perServing = total nutrition ÷ servings
  * If servings is unknown: estimate reasonable per-serving portions anyway
  * Round calories to nearest 5, macros to nearest 0.5g, sodium to nearest 10mg
  * Common examples: 1 cup flour ≈ 455 cal, 1 tbsp oil ≈ 120 cal, 1 egg ≈ 70 cal
  * NEVER leave both perServing and total nutrition empty - always provide both
- Equipment only if mentioned explicitly.
- For tags, provide comprehensive categorization (5-10 tags total):
  * Main ingredient(s): "chicken", "beef", "pasta", "rice", "eggs", "vegetables"
  * Cuisine type: "italian", "mexican", "asian", "american", "mediterranean"
  * Meal type: "breakfast", "lunch", "dinner", "snack", "dessert", "appetizer"
  * Cooking method: "baked", "fried", "grilled", "slow-cooked", "no-cook", "one-pot"
  * Difficulty: "easy", "intermediate", "advanced"
  * Dietary: "vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "low-carb"
  * Occasion: "weeknight", "weekend", "holiday", "party", "comfort-food", "healthy"
  * Time: "quick" (under 30 min), "medium" (30-60 min), "long" (over 1 hour)
  * Use lowercase, hyphenated format for consistency
- If no clear recipe is found, create a basic structure with the available information.
- IMPORTANT: Always provide a meaningful title (never null or empty). If unclear, use the source content or create a descriptive title like "Recipe from [source]".
- IMPORTANT: If ingredients or steps are unclear, make reasonable assumptions based on context rather than leaving arrays empty.`;

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: RecipeSchema,
    prompt: promptText,
  });
  return object;
}