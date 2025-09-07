'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DeleteRecipeButton from '@/components/DeleteRecipeButton';
import RecipeSearch from '@/components/RecipeSearch';

interface Recipe {
  id: string;
  sourceType: string;
  sourceUrl: string;
  rawText: string | null;
  extracted: {
    title: string;
    ingredients: Array<{
      name: string;
      quantity: string | null;
      unit: string | null;
    }>;
    tags: string[];
    costLocation: string;
    totalEstimatedCost: number | null;
  };
  thumbnailUrl: string | null;
  createdAt: Date | null;
}

interface HistoryClientProps {
  allRecipes: Recipe[];
}

export default function HistoryClient({ allRecipes }: HistoryClientProps) {
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(allRecipes);

  if (allRecipes.length === 0) {
    return (
      /* Empty State */
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🍳</span>
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No recipes yet</h3>
        <p className="text-gray-600 mb-6">Start by extracting your first recipe from a video URL</p>
        <Link
          href="/new"
          className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors duration-200"
        >
          Extract Recipe
          <span className="ml-2">→</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <RecipeSearch 
        recipes={allRecipes} 
        onFilteredRecipes={setFilteredRecipes}
      />

      {/* Recipe Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors duration-200 group">
            {/* Recipe Image */}
            {recipe.thumbnailUrl && (
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src={recipe.thumbnailUrl}
                  alt={recipe.extracted.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
            
            {/* Recipe Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900 line-clamp-2 flex-1">
                  {recipe.extracted.title}
                </h3>
                <DeleteRecipeButton recipeId={recipe.id} />
              </div>
              
              {/* Tags */}
              {recipe.extracted.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {recipe.extracted.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                  {recipe.extracted.tags.length > 3 && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                      +{recipe.extracted.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span className="capitalize">{recipe.sourceType}</span>
                <span>•</span>
                <span>{recipe.extracted.costLocation}</span>
                {recipe.extracted.totalEstimatedCost && (
                  <>
                    <span>•</span>
                    <span>${recipe.extracted.totalEstimatedCost.toFixed(2)}</span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : 'Unknown date'}
                </div>
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="inline-flex items-center text-gray-900 hover:text-gray-700 font-medium text-sm transition-colors duration-200"
                >
                  View Recipe
                  <span className="ml-1">→</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results State */}
      {filteredRecipes.length === 0 && allRecipes.length > 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No recipes found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
        </div>
      )}
    </>
  );
}
