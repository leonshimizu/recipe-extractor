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
              {r.servings && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="font-medium">Serves: {r.servings}</span>
                </>
              )}
            </div>
            
            {(r.times.prep || r.times.cook || r.times.total) && (
              <div className="flex flex-wrap gap-6 mb-6">
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
            )}
            
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
