import { db } from '@/db';
import { recipes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(recipes).where(eq(recipes.id, id));
  
  if (!row) {
    notFound();
  }
  
  const r = row.extracted;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-8 sm:px-6 lg:px-8">
        {/* Header Card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8">
          {row.thumbnailUrl && (
            <div className="relative h-48 sm:h-64 lg:h-80">
              <img 
                src={row.thumbnailUrl} 
                alt={r.title}
                className="w-full h-full object-cover"
              />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-2 drop-shadow-lg tracking-tight">
                {r.title}
              </h1>
            </div>
            </div>
          )}
          
          <div className="p-8">
            {!row.thumbnailUrl && (
              <h1 className="text-4xl sm:text-5xl font-light text-gray-900 mb-6 tracking-tight">{r.title}</h1>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <a
                href={row.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 hover:text-gray-700 font-medium underline underline-offset-2"
              >
                View Original Source
              </a>
              <span className="text-gray-300">•</span>
              <span className="capitalize font-medium">Source: {row.sourceType}</span>
            </div>
            
            {/* Recipe Metrics */}
            <div className="flex flex-wrap gap-4 mb-6">
              {r.servings && (
                <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-200">
                  <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Servings</span>
                  <div className="text-lg font-bold text-blue-900 mt-1">{r.servings}</div>
                </div>
              )}
              {r.times.prep && (
                <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Prep</span>
                  <div className="text-sm font-semibold text-gray-900 mt-1">{r.times.prep}</div>
                </div>
              )}
              {r.times.cook && (
                <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Cook</span>
                  <div className="text-sm font-semibold text-gray-900 mt-1">{r.times.cook}</div>
                </div>
              )}
              {r.times.total && (
                <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total</span>
                  <div className="text-sm font-semibold text-gray-900 mt-1">{r.times.total}</div>
                </div>
              )}
            </div>
            
            {r.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {r.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 text-gray-700 text-xs px-3 py-2 rounded-full font-medium border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Cards */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Ingredients Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-gray-700 text-lg">🥄</span>
              </div>
              <h2 className="text-xl font-medium text-gray-900">Ingredients</h2>
            </div>
            <ul className="space-y-4">
              {r.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-4 mt-3 flex-shrink-0"></div>
                  <div className="flex-1">
                    <span className="text-gray-700 leading-relaxed">
                      {ing.quantity && ing.unit ? (
                        <>
                          <span className="font-semibold text-gray-900">
                            {ing.quantity} {ing.unit}
                          </span>
                          <span> {ing.name}</span>
                        </>
                      ) : ing.quantity && !ing.unit ? (
                        <>
                          <span className="font-semibold text-gray-900">{ing.quantity}</span>
                          <span> {ing.name}</span>
                        </>
                      ) : (
                        <span>{ing.name}</span>
                      )}
                      {ing.notes && <span className="text-gray-500 italic"> ({ing.notes})</span>}
                    </span>
                    {ing.estimatedCost && (
                      <div className="text-sm text-gray-600 font-medium mt-1">
                        ${ing.estimatedCost.toFixed(2)}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-gray-700 text-lg">📝</span>
              </div>
              <h2 className="text-xl font-medium text-gray-900">Instructions</h2>
            </div>
            <ol className="space-y-6">
              {r.steps.map((step, i) => (
                <li key={i} className="flex items-start">
                  <div className="w-8 h-8 bg-gray-900 text-white text-sm font-medium rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-gray-700 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Cost Summary */}
        {r.totalEstimatedCost && (
          <div className="mt-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-gray-700 text-lg">💰</span>
                </div>
                <h2 className="text-xl font-medium text-gray-900">Cost Estimate</h2>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total Estimated Cost:</span>
                  <span className="text-2xl font-semibold text-gray-900">
                    ${r.totalEstimatedCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">Based on {r.costLocation} prices</span>
                  <span className="text-xs text-gray-500">🌍</span>
                </div>
                {r.servings && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Cost per serving:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${(r.totalEstimatedCost / r.servings).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nutrition Information */}
        {(r.nutrition?.perServing?.calories || r.nutrition?.total?.calories) && (
          <div className="mt-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-gray-700 text-lg">📊</span>
                  </div>
                  <h2 className="text-xl font-medium text-gray-900">Nutrition Facts</h2>
                </div>
                {r.servings && (
                  <div className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    <span className="text-xs text-blue-600 font-medium">Recipe makes {r.servings} servings</span>
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Per Serving */}
                {r.nutrition.perServing && r.servings && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 text-center flex items-center justify-center">
                      <span className="mr-2">🍽️</span>
                      Per Serving (1 of {r.servings})
                    </h3>
                    <div className="space-y-3">
                      {r.nutrition.perServing.calories && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-medium text-gray-700">Calories</span>
                          <span className="text-lg font-semibold text-gray-900">{r.nutrition.perServing.calories}</span>
                        </div>
                      )}
                      {r.nutrition.perServing.protein && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Protein</span>
                          <span className="font-medium text-gray-900">{r.nutrition.perServing.protein}g</span>
                        </div>
                      )}
                      {r.nutrition.perServing.carbs && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Carbs</span>
                          <span className="font-medium text-gray-900">{r.nutrition.perServing.carbs}g</span>
                        </div>
                      )}
                      {r.nutrition.perServing.fat && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Fat</span>
                          <span className="font-medium text-gray-900">{r.nutrition.perServing.fat}g</span>
                        </div>
                      )}
                      {r.nutrition.perServing.fiber && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Fiber</span>
                          <span className="font-medium text-gray-900">{r.nutrition.perServing.fiber}g</span>
                        </div>
                      )}
                      {r.nutrition.perServing.sugar && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Sugar</span>
                          <span className="font-medium text-gray-900">{r.nutrition.perServing.sugar}g</span>
                        </div>
                      )}
                      {r.nutrition.perServing.sodium && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Sodium</span>
                          <span className="font-medium text-gray-900">{r.nutrition.perServing.sodium}mg</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total Recipe */}
                {r.nutrition.total && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 text-center flex items-center justify-center">
                      <span className="mr-2">🥘</span>
                      Total Recipe ({r.servings ? `${r.servings} servings` : 'Entire batch'})
                    </h3>
                    <div className="space-y-3">
                      {r.nutrition.total.calories && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-medium text-gray-700">Calories</span>
                          <span className="text-lg font-semibold text-gray-900">{r.nutrition.total.calories}</span>
                        </div>
                      )}
                      {r.nutrition.total.protein && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Protein</span>
                          <span className="font-medium text-gray-900">{r.nutrition.total.protein}g</span>
                        </div>
                      )}
                      {r.nutrition.total.carbs && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Carbs</span>
                          <span className="font-medium text-gray-900">{r.nutrition.total.carbs}g</span>
                        </div>
                      )}
                      {r.nutrition.total.fat && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Fat</span>
                          <span className="font-medium text-gray-900">{r.nutrition.total.fat}g</span>
                        </div>
                      )}
                      {r.nutrition.total.fiber && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Fiber</span>
                          <span className="font-medium text-gray-900">{r.nutrition.total.fiber}g</span>
                        </div>
                      )}
                      {r.nutrition.total.sugar && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Sugar</span>
                          <span className="font-medium text-gray-900">{r.nutrition.total.sugar}g</span>
                        </div>
                      )}
                      {r.nutrition.total.sodium && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Sodium</span>
                          <span className="font-medium text-gray-900">{r.nutrition.total.sodium}mg</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Serving Calculator */}
              {r.servings && r.nutrition.perServing && r.nutrition.perServing.calories && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-4 text-center">Quick Reference</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Per Serving</div>
                      <div className="text-lg font-bold text-blue-600">{r.nutrition.perServing.calories} cal</div>
                      <div className="text-xs text-gray-600">1 of {r.servings} servings</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Recipe</div>
                      <div className="text-lg font-bold text-green-600">{r.nutrition.total?.calories || (r.nutrition.perServing.calories * r.servings)} cal</div>
                      <div className="text-xs text-gray-600">All {r.servings} servings</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Macro Breakdown Visual */}
              {r.nutrition.perServing && r.nutrition.perServing.protein && r.nutrition.perServing.carbs && r.nutrition.perServing.fat && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Macronutrient Breakdown (Per Serving)</h4>
                  <div className="flex justify-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1"></div>
                      <div className="font-medium text-gray-900">Protein</div>
                      <div className="text-gray-600">{Math.round((r.nutrition.perServing.protein * 4 / (r.nutrition.perServing.calories || 1)) * 100)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                      <div className="font-medium text-gray-900">Carbs</div>
                      <div className="text-gray-600">{Math.round((r.nutrition.perServing.carbs * 4 / (r.nutrition.perServing.calories || 1)) * 100)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                      <div className="font-medium text-gray-900">Fat</div>
                      <div className="text-gray-600">{Math.round((r.nutrition.perServing.fat * 9 / (r.nutrition.perServing.calories || 1)) * 100)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Equipment & Notes */}
        <div className="mt-8 space-y-8">
          {r.equipment.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-gray-700 text-lg">🔧</span>
                </div>
                <h2 className="text-xl font-medium text-gray-900">Equipment</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {r.equipment.map((item, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-center">
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {r.notes && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-gray-700 text-lg">💡</span>
                </div>
                <h2 className="text-xl font-medium text-gray-900">Notes</h2>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <p className="text-gray-700 leading-relaxed">{r.notes}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <div className="mt-12 text-center">
          <Link
            href="/new"
            className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors duration-200"
          >
            Extract Another Recipe
            <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
