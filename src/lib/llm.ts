import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

// Component schema for individual recipe parts (e.g., meatloaf, glaze, sauce)
const RecipeComponentSchema = z.object({
  name: z.string().min(1), // e.g., "Meatloaf", "Glaze", "Sauce"
  ingredients: z.array(z.object({
    quantity: z.coerce.string().nullable().default(null),
    unit: z.string().nullable().default(null),
    name: z.string(),
    notes: z.string().nullable().optional().default(null),
    estimatedCost: z.number().nullable().optional().default(null)
  })).min(1),
  steps: z.array(z.string()).min(1),
  notes: z.string().nullable().optional().default(null)
});

export const RecipeSchema = z.object({
  title: z.string().min(1),
  sourceUrl: z.string().url(),
  servings: z.number().int().nullable().default(null),
  times: z.object({ 
    prep: z.string().nullable().default(null), 
    cook: z.string().nullable().default(null), 
    total: z.string().nullable().default(null)
  }).default({ prep: null, cook: null, total: null }),
  // New component-based structure
  components: z.array(RecipeComponentSchema).min(1),
  // Legacy fields for backward compatibility (will be auto-populated from components)
  ingredients: z.array(z.object({
    quantity: z.coerce.string().nullable(),
    unit: z.string().nullable(),
    name: z.string(),
    notes: z.string().nullable().optional(),
    estimatedCost: z.number().nullable().optional()
  })).optional().default([]),
  steps: z.array(z.string()).optional().default([]),
  equipment: z.array(z.string()).nullable().default([]),
  notes: z.string().nullable().optional().default(null), // Made optional
  tags: z.array(z.string()).default([]),
  totalEstimatedCost: z.number().nullable().default(null),
  costLocation: z.string().default('Guam'),
  nutrition: z.object({
    perServing: z.object({
      calories: z.number().nullable().default(null),
      protein: z.number().nullable().default(null), // grams
      carbs: z.number().nullable().default(null), // grams
      fat: z.number().nullable().default(null), // grams
      fiber: z.number().nullable().default(null), // grams
      sugar: z.number().nullable().default(null), // grams
      sodium: z.number().nullable().default(null) // milligrams
    }).default({
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
      sugar: null,
      sodium: null
    }),
    total: z.object({
      calories: z.number().nullable().default(null),
      protein: z.number().nullable().default(null),
      carbs: z.number().nullable().default(null),
      fat: z.number().nullable().default(null),
      fiber: z.number().nullable().default(null),
      sugar: z.number().nullable().default(null),
      sodium: z.number().nullable().default(null)
    }).default({
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
      sugar: null,
      sodium: null
    })
  }).default({
    perServing: {
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
      sugar: null,
      sodium: null
    },
    total: {
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
      sugar: null,
      sodium: null
    }
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
    // Replace all ellipsis variants with three dots (including Unicode 8230)
    .replace(/…|\u2026|\.\.\./g, '...')
    // Replace em dash and en dash with regular dash
    .replace(/[—–]/g, '-')
    // Replace other problematic Unicode characters
    .replace(/[\u2013-\u2026]/g, '-') // En dash, em dash, ellipsis range
    .replace(/[\u00A0]/g, ' ') // Non-breaking space
    // Remove any remaining high Unicode characters that could cause ByteString issues
    .replace(/[\u0080-\uFFFF]/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export async function extractRecipe({ sourceUrl, raw, location = 'Guam' }: { sourceUrl: string; raw: string; location?: string }) {
  console.log('🤖 [LLM] Starting recipe extraction...');
  console.log('🤖 [LLM] Source URL:', sourceUrl);
  console.log('🤖 [LLM] Location:', location);
  console.log('🤖 [LLM] Raw content length:', raw.length);
  console.log('🤖 [LLM] Raw content preview:', raw.substring(0, 500) + (raw.length > 500 ? '...' : ''));
  
  // Sanitize the input text to prevent Unicode issues
  const sanitizedRaw = sanitizeText(raw);
  console.log('🤖 [LLM] Sanitized content length:', sanitizedRaw.length);
  
  // Additional safety check - convert to ASCII only
  const asciiOnlyRaw = sanitizedRaw.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('🤖 [LLM] ASCII-only content length:', asciiOnlyRaw.length);
  
    const promptText = `You are a culinary extraction engine. From the video content below, extract ONE COMPLETE RECIPE with properly organized components.

CRITICAL COMPONENT STRUCTURE: If the recipe involves multiple distinct food items (like meatloaf + glaze, pasta + sauce, chicken + marinade), organize them as separate components within ONE recipe. Each component should have its own ingredients and steps.

The content below includes the video title and any available transcript/description:

${asciiOnlyRaw}

EXTRACTION RULES:
- Set sourceUrl to exactly: ${sourceUrl}
- CAREFULLY read through ALL the content (title, description, transcript) to find recipe details
- COMPONENT ORGANIZATION:
  * If recipe has multiple distinct parts (e.g., "meatloaf and glaze"), create separate components
  * Component names should be clear: "Meatloaf", "Glaze", "Sauce", "Marinade", etc.
  * Each component gets its own ingredients list and steps
  * If it's a simple single-dish recipe, create one component with the dish name
  * Examples:
    - Meatloaf with glaze → Components: [{"name": "Meatloaf", ...}, {"name": "Glaze", ...}]
    - Simple pasta → Components: [{"name": "Pasta Dish", ...}]
    - Chicken with marinade → Components: [{"name": "Marinade", ...}, {"name": "Chicken", ...}]
- For ingredients in each component, format properly:
  * quantity: Use null (not "null" string) if no quantity specified
  * unit: Use null (not "null" string) if no unit specified  
  * For items without quantities (like "salt to taste"), set quantity and unit to null
  * Examples: {"quantity": "2", "unit": "cups", "name": "flour"} or {"quantity": null, "unit": null, "name": "salt"}
- Steps for each component should be actionable and ordered
- Legacy fields (ingredients, steps) will be auto-populated - focus on the components array
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
  * Regional pricing guidelines (adjust for custom locations based on economic factors):
    - US/Canada: Standard baseline pricing
    - Guam: 25-40% higher than mainland US (remote location, import costs)
    - Hawaii: 20-30% higher than mainland US (island location, shipping costs)
    - UK: Convert from pounds (£1 ≈ $1.25), generally 15-25% higher
    - Australia: Convert from AUD (A$1 ≈ $0.65), similar to US prices
    - Japan: Convert from yen (¥150 ≈ $1), consider local market prices
    - EU: Convert from euros (€1 ≈ $1.10), varies by country
    - Custom locations: Research typical cost of living and adjust accordingly
  * Examples for ${location}:
    - 1 lb ground beef: ${location === 'Guam' ? '$6-8' : location === 'Hawaii' ? '$5-7' : location === 'UK' ? '$4-6' : location === 'Japan' ? '$5-7' : location === 'Australia' ? '$3-5' : location === 'EU' ? '$4-6' : '$3-5 (adjust for local cost of living)'}
    - 1 dozen eggs: ${location === 'Guam' ? '$4-5' : location === 'Hawaii' ? '$3-4' : location === 'UK' ? '$2-3' : location === 'Japan' ? '$2-3' : location === 'Australia' ? '$2-3' : location === 'EU' ? '$2-3' : '$2-3 (adjust for local cost of living)'}
    - 1 lb pasta: ${location === 'Guam' ? '$2-3' : location === 'Hawaii' ? '$1.50-2.50' : location === 'UK' ? '$1-2' : location === 'Japan' ? '$1.50-2.50' : location === 'Australia' ? '$1-2' : location === 'EU' ? '$1-2' : '$1-2 (adjust for local cost of living)'}
  * For custom locations not in the predefined list, research and apply appropriate regional multipliers
  * Round to nearest $0.25 (e.g., 0.50, 0.75, 1.00, 1.25)
  * Use null only if ingredient is completely unclear, but estimate when possible
- Calculate totalEstimatedCost as sum of all ingredient costs
- REQUIRED: Set costLocation to exactly: "${location}"
- REQUIRED: equipment must be an array of strings (e.g., ["air fryer", "mixing bowl"]), NOT objects
- REQUIRED: quantity must be a string (e.g., "2", "1/2", "1.5"), NOT a number
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
- TITLE: Use the VIDEO TITLE if provided, or create a descriptive title based on the main dish being made. Never use generic titles like "Recipe from TikTok" - always be specific about what food is being prepared.
- IMPORTANT: If ingredients or steps are unclear, make reasonable assumptions based on context rather than leaving arrays empty.`;

  console.log('🤖 [LLM] Calling OpenAI with gpt-4o-mini...');
  console.log('🤖 [LLM] Prompt length:', promptText.length);
  
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: RecipeSchema,
      prompt: promptText,
    });
    
    console.log('🤖 [LLM] Raw object received from OpenAI:', JSON.stringify(object, null, 2));
    
    // Validate the object manually to provide better error messages
    const validationResult = RecipeSchema.safeParse(object);
    if (!validationResult.success) {
      console.error('❌ [LLM] Schema validation failed:', validationResult.error);
      console.error('❌ [LLM] Failed object:', JSON.stringify(object, null, 2));
      throw new Error(`Schema validation failed: ${validationResult.error.message}`);
    }
    
    const validatedObject = validationResult.data;
  
    // Auto-populate legacy fields from components for backward compatibility
    const allIngredients = validatedObject.components.flatMap(component => component.ingredients);
    const allSteps = validatedObject.components.flatMap((component) => {
      const componentSteps = component.steps.map(step => 
        validatedObject.components.length > 1 ? `${component.name}: ${step}` : step
      );
      return componentSteps;
    });
    
    const finalObject = {
      ...validatedObject,
      ingredients: allIngredients,
      steps: allSteps
    };
    
    console.log('🤖 [LLM] OpenAI response received:', {
      title: finalObject.title,
      componentsCount: finalObject.components?.length || 0,
      ingredientsCount: finalObject.ingredients?.length || 0,
      stepsCount: finalObject.steps?.length || 0,
      servings: finalObject.servings,
      hasTimes: !!(finalObject.times?.prep || finalObject.times?.cook || finalObject.times?.total),
      totalCost: finalObject.totalEstimatedCost
    });
    
    return finalObject;
    
  } catch (error) {
    console.error('❌ [LLM] Error during recipe extraction:', error);
    console.error('❌ [LLM] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      sourceUrl,
      location,
      rawContentLength: raw.length
    });
    
    // Re-throw the error to be handled by the calling function
    throw error;
  }
}