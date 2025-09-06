import { db } from '@/db';
import { recipes } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import DeleteRecipeButton from '@/components/DeleteRecipeButton';

export default async function HistoryPage() {
  const allRecipes = await db.select().from(recipes).orderBy(desc(recipes.createdAt));

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">Recipe History</h1>
          <p className="text-gray-600 mt-2">
            {allRecipes.length} recipe{allRecipes.length !== 1 ? 's' : ''} extracted
          </p>
        </div>

        {allRecipes.length === 0 ? (
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
        ) : (
          /* Recipe Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors duration-200 group">
                {/* Recipe Image */}
                {recipe.thumbnailUrl && (
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={recipe.thumbnailUrl}
                      alt={recipe.extracted.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
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
                      {new Date(recipe.createdAt!).toLocaleDateString()}
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
        )}

      </div>
    </main>
  );
}
