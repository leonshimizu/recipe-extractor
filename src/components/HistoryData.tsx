import { db } from '@/db';
import { recipes } from '@/db/schema';
import { desc, count } from 'drizzle-orm';
import FastHistoryClient from '@/components/FastHistoryClient';

interface HistoryDataProps {
  searchParams: {
    page?: string;
    search?: string;
    tags?: string;
    source?: string;
  };
}

const RECIPES_PER_PAGE = 12;

export default async function HistoryData({ searchParams }: HistoryDataProps) {
  const page = parseInt(searchParams.page || '1');
  const offset = (page - 1) * RECIPES_PER_PAGE;

  // Get total count for pagination
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(recipes);
  
  const totalRecipes = totalCountResult.count;
  const totalPages = Math.ceil(totalRecipes / RECIPES_PER_PAGE);

  // Load more recipes for client-side filtering (2 pages worth for better UX)
  const recipesToLoad = Math.min(RECIPES_PER_PAGE * 2, 50); // Cap at 50 for performance
  
  const allRecipesForPage = await db
    .select({
      id: recipes.id,
      sourceType: recipes.sourceType,
      thumbnailUrl: recipes.thumbnailUrl,
      createdAt: recipes.createdAt,
      extracted: recipes.extracted,
    })
    .from(recipes)
    .orderBy(desc(recipes.createdAt))
    .limit(recipesToLoad)
    .offset(Math.max(0, offset - RECIPES_PER_PAGE)); // Load previous page too for context

  // Get available tags and sources for filters (from all recipes, not just current page)
  const allRecipesForFilters = await db
    .select({
      sourceType: recipes.sourceType,
      extracted: recipes.extracted,
    })
    .from(recipes);

  const availableSources = [...new Set(allRecipesForFilters.map(r => r.sourceType))].sort();
  const availableTags = [...new Set(
    allRecipesForFilters.flatMap(r => {
      const extracted = r.extracted as { tags?: string[] };
      return extracted?.tags || [];
    })
  )].sort();

  // Transform the data to extract nested fields for comprehensive search
  const transformedRecipes = allRecipesForPage.map(recipe => {
    const extracted = recipe.extracted as {
      title?: string;
      tags?: string[];
      costLocation?: string;
      totalEstimatedCost?: number | null;
      ingredients?: Array<{
        name: string;
        quantity: string | null;
        unit: string | null;
        notes?: string | null;
      }>;
      steps?: string[];
      equipment?: string[];
      notes?: string;
      components?: Array<{
        name: string;
        ingredients: Array<{
          name: string;
          quantity: string | null;
          unit: string | null;
          notes?: string | null;
        }>;
        steps: string[];
        notes?: string | null;
      }>;
    };
    
    return {
      id: recipe.id,
      sourceType: recipe.sourceType,
      thumbnailUrl: recipe.thumbnailUrl,
      createdAt: recipe.createdAt,
      extracted: {
        title: extracted?.title || 'Untitled Recipe',
        tags: extracted?.tags || [],
        costLocation: extracted?.costLocation || 'Unknown',
        totalEstimatedCost: extracted?.totalEstimatedCost || null,
        // Enhanced search data
        ingredients: extracted?.ingredients || [],
        steps: extracted?.steps || [],
        equipment: extracted?.equipment || [],
        notes: extracted?.notes || '',
        components: extracted?.components || [],
      }
    };
  });

  return (
    <FastHistoryClient 
      allRecipes={transformedRecipes}
      availableTags={availableTags}
      availableSources={availableSources}
      currentPage={page}
      totalPages={totalPages}
      totalRecipes={totalRecipes}
    />
  );
}
