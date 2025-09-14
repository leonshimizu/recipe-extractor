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
  const search = searchParams.search?.trim();
  const tags = searchParams.tags?.split(',').filter(Boolean) || [];
  const sources = searchParams.source?.split(',').filter(Boolean) || [];
  
  // Check if we have active filters
  const hasFilters = Boolean(search) || tags.length > 0 || sources.length > 0;

  // Get total count for pagination (always needed)
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(recipes);
  
  const totalRecipes = totalCountResult.count;
  const totalPages = Math.ceil(totalRecipes / RECIPES_PER_PAGE);

  let allRecipesForPage;
  
  if (hasFilters) {
    // When filtering, load ALL recipes (no pagination) so client can filter properly
    allRecipesForPage = await db
      .select({
        id: recipes.id,
        sourceType: recipes.sourceType,
        thumbnailUrl: recipes.thumbnailUrl,
        createdAt: recipes.createdAt,
        extracted: recipes.extracted,
      })
      .from(recipes)
      .orderBy(desc(recipes.createdAt));
  } else {
    // When no filters, use pagination as normal
    allRecipesForPage = await db
      .select({
        id: recipes.id,
        sourceType: recipes.sourceType,
        thumbnailUrl: recipes.thumbnailUrl,
        createdAt: recipes.createdAt,
        extracted: recipes.extracted,
      })
      .from(recipes)
      .orderBy(desc(recipes.createdAt))
      .limit(RECIPES_PER_PAGE)
      .offset(offset);
  }

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
      hasFilters={hasFilters}
    />
  );
}
