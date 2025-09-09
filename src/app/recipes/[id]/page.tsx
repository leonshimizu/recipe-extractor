import { db } from '@/db';
import { recipes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { cache } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Clock, Users, DollarSign, Info } from 'lucide-react';

// Cache the recipe fetch function
const getRecipe = cache(async (id: string) => {
  const [row] = await db.select().from(recipes).where(eq(recipes.id, id));
  return row;
});

// Enable static generation for recipe pages
export async function generateStaticParams() {
  // Generate static params for the most recent recipes
  const recentRecipes = await db
    .select({ id: recipes.id })
    .from(recipes)
    .limit(20); // Generate static pages for 20 most recent recipes
  
  return recentRecipes.map((recipe) => ({
    id: recipe.id,
  }));
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getRecipe(id);
  
  if (!row) {
    notFound();
  }
  
  const r = row.extracted;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Card */}
        <Card className="overflow-hidden">
          {row.thumbnailUrl && (
            <div className="relative h-40 sm:h-48 md:h-64 lg:h-80">
              <Image 
                src={row.thumbnailUrl} 
                alt={r.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                  {r.title}
                </h1>
              </div>
            </div>
          )}
          
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {!row.thumbnailUrl && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">{r.title}</h1>
            )}
            
            {/* Extraction Quality Info */}
            {row.extractionMethod && (
              <Alert className={`mb-6 ${
                row.extractionQuality === 'high' 
                  ? 'bg-green-50 border-green-200 text-green-900' 
                  : row.extractionQuality === 'medium'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-orange-50 border-orange-200 text-orange-900'
              }`}>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-1">
                        {row.hasAudioTranscript ? 'High Quality - Audio Transcribed' : 'Text-Based Extraction'}
                      </h3>
                      <p className="text-xs leading-relaxed">
                        {row.hasAudioTranscript ? (
                          'All spoken instructions captured using AI audio transcription for maximum accuracy.'
                        ) : row.extractionQuality === 'medium' ? (
                          'Extracted from video title, description, and captions. Some details may be inferred.'
                        ) : (
                          'Extracted from limited text. Some ingredients and steps may be inferred.'
                        )}
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={row.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Original Source
                </a>
              </Button>
              <Badge variant="secondary" className="capitalize">
                {row.sourceType}
              </Badge>
            </div>
            
            {/* Recipe Metrics */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
              {r.servings && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-xs text-primary font-medium uppercase tracking-wide">Servings</span>
                    </div>
                    <div className="text-lg font-bold mt-1">{r.servings}</div>
                  </CardContent>
                </Card>
              )}
              {r.times.prep && (
                <Card className="bg-muted/50">
                  <CardContent className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Prep</span>
                    </div>
                    <div className="text-sm font-semibold mt-1">{r.times.prep}</div>
                  </CardContent>
                </Card>
              )}
              {r.times.cook && (
                <Card className="bg-muted/50">
                  <CardContent className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Cook</span>
                    </div>
                    <div className="text-sm font-semibold mt-1">{r.times.cook}</div>
                  </CardContent>
                </Card>
              )}
              {r.times.total && (
                <Card className="bg-muted/50">
                  <CardContent className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total</span>
                    </div>
                    <div className="text-sm font-semibold mt-1">{r.times.total}</div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {r.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {r.tags.map((tag, i) => (
                  <Badge key={i} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Cards */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Ingredients Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                <span className="text-xl sm:text-2xl">🥄</span>
                Ingredients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 sm:space-y-4">
                {r.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 sm:mr-4 mt-2 sm:mt-3 flex-shrink-0"></div>
                    <div className="flex-1">
                      <span className="leading-relaxed">
                        {(() => {
                          // Clean up null/undefined values
                          const quantity = ing.quantity && ing.quantity !== 'null' ? ing.quantity : null;
                          const unit = ing.unit && ing.unit !== 'null' ? ing.unit : null;
                          
                          if (quantity && unit) {
                            return (
                              <>
                                <span className="font-semibold">
                                  {quantity} {unit}
                                </span>
                                <span> {ing.name}</span>
                              </>
                            );
                          } else if (quantity && !unit) {
                            return (
                              <>
                                <span className="font-semibold">{quantity}</span>
                                <span> {ing.name}</span>
                              </>
                            );
                          } else {
                            // No quantity or unit - just show the ingredient name
                            return <span className="font-semibold">{ing.name}</span>;
                          }
                        })()}
                        {ing.notes && ing.notes !== 'null' && <span className="text-muted-foreground italic"> ({ing.notes})</span>}
                      </span>
                      {ing.estimatedCost && (
                        <div className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {ing.estimatedCost.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                <span className="text-xl sm:text-2xl">📝</span>
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 sm:space-y-6">
                {r.steps.map((step, i) => (
                  <li key={i} className="flex items-start">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground text-xs sm:text-sm font-medium rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <span className="leading-relaxed text-sm sm:text-base">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Cost Summary */}
        {r.totalEstimatedCost && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                Cost Estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-xl p-4 sm:p-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm sm:text-base">Total Estimated Cost:</span>
                  <span className="text-xl sm:text-2xl font-semibold">
                    ${r.totalEstimatedCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">Based on {r.costLocation} prices</span>
                  <span className="text-xs text-muted-foreground">🌍</span>
                </div>
                {r.servings && (
                  <div className="flex justify-between items-center mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Cost per serving:</span>
                    <span className="text-base sm:text-lg font-semibold">
                      ${(r.totalEstimatedCost / r.servings).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nutrition Information */}
        {(r.nutrition?.perServing?.calories || r.nutrition?.total?.calories) && (
          <Card className="mt-6 sm:mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                  <span className="text-xl sm:text-2xl">📊</span>
                  Nutrition Facts
                </CardTitle>
                {r.servings && (
                  <Badge variant="secondary" className="text-xs">
                    Recipe makes {r.servings} servings
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Per Serving */}
                {r.nutrition.perServing && (r.nutrition.perServing.calories || r.nutrition.perServing.protein || r.nutrition.perServing.carbs) && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4 text-center flex items-center justify-center">
                      <span className="mr-2">🍽️</span>
                      Per Serving{r.servings ? ` (1 of ${r.servings})` : ''}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {r.nutrition.perServing.calories && (
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="font-medium text-foreground">Calories</span>
                          <span className="text-base sm:text-lg font-semibold text-foreground">{r.nutrition.perServing.calories}</span>
                        </div>
                      )}
                      {r.nutrition.perServing.protein && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Protein</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.perServing.protein}g</span>
                        </div>
                      )}
                      {r.nutrition.perServing.carbs && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Carbs</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.perServing.carbs}g</span>
                        </div>
                      )}
                      {r.nutrition.perServing.fat && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Fat</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.perServing.fat}g</span>
                        </div>
                      )}
                      {r.nutrition.perServing.fiber && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Fiber</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.perServing.fiber}g</span>
                        </div>
                      )}
                      {r.nutrition.perServing.sugar && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Sugar</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.perServing.sugar}g</span>
                        </div>
                      )}
                      {r.nutrition.perServing.sodium && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Sodium</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.perServing.sodium}mg</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total Recipe */}
                {r.nutrition.total && (
                  <div className="bg-secondary/50 border border-secondary rounded-xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 text-center flex items-center justify-center">
                      <span className="mr-2">🥘</span>
                      Total Recipe ({r.servings ? `${r.servings} servings` : 'Entire batch'})
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {r.nutrition.total.calories && (
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="font-medium text-foreground">Calories</span>
                          <span className="text-base sm:text-lg font-semibold text-foreground">{r.nutrition.total.calories}</span>
                        </div>
                      )}
                      {r.nutrition.total.protein && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Protein</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.total.protein}g</span>
                        </div>
                      )}
                      {r.nutrition.total.carbs && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Carbs</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.total.carbs}g</span>
                        </div>
                      )}
                      {r.nutrition.total.fat && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Fat</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.total.fat}g</span>
                        </div>
                      )}
                      {r.nutrition.total.fiber && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Fiber</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.total.fiber}g</span>
                        </div>
                      )}
                      {r.nutrition.total.sugar && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Sugar</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.total.sugar}g</span>
                        </div>
                      )}
                      {r.nutrition.total.sodium && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm sm:text-base">Sodium</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{r.nutrition.total.sodium}mg</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Serving Calculator */}
              {r.nutrition.perServing && r.nutrition.perServing.calories && r.nutrition.total && r.nutrition.total.calories && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground mb-3 sm:mb-4 text-center">Quick Reference</h4>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Per Serving</div>
                      <div className="text-base sm:text-lg font-bold text-primary">{r.nutrition.perServing.calories} cal</div>
                      <div className="text-xs text-muted-foreground">{r.servings ? `1 of ${r.servings} servings` : 'Single serving'}</div>
                    </div>
                    <div className="bg-secondary/50 border border-secondary rounded-lg p-3 sm:p-4 text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Recipe</div>
                      <div className="text-base sm:text-lg font-bold text-foreground">{r.nutrition.total.calories} cal</div>
                      <div className="text-xs text-muted-foreground">{r.servings ? `All ${r.servings} servings` : 'Entire batch'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Macro Breakdown Visual */}
              {r.nutrition.perServing && r.nutrition.perServing.protein && r.nutrition.perServing.carbs && r.nutrition.perServing.fat && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground mb-3 text-center">Macronutrient Breakdown (Per Serving)</h4>
                  <div className="flex justify-center space-x-4 sm:space-x-6 text-sm">
                    <div className="text-center">
                      <div className="w-3 h-3 bg-primary rounded-full mx-auto mb-1"></div>
                      <div className="font-medium text-foreground text-xs sm:text-sm">Protein</div>
                      <div className="text-muted-foreground text-xs">{Math.round((r.nutrition.perServing.protein * 4 / (r.nutrition.perServing.calories || 1)) * 100)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-secondary rounded-full mx-auto mb-1"></div>
                      <div className="font-medium text-foreground text-xs sm:text-sm">Carbs</div>
                      <div className="text-muted-foreground text-xs">{Math.round((r.nutrition.perServing.carbs * 4 / (r.nutrition.perServing.calories || 1)) * 100)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-accent rounded-full mx-auto mb-1"></div>
                      <div className="font-medium text-foreground text-xs sm:text-sm">Fat</div>
                      <div className="text-muted-foreground text-xs">{Math.round((r.nutrition.perServing.fat * 9 / (r.nutrition.perServing.calories || 1)) * 100)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Equipment & Notes */}
        <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
          {r.equipment && r.equipment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                  <span className="text-xl sm:text-2xl">🔧</span>
                  Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {r.equipment.map((item, i) => (
                    <div key={i} className="bg-muted/50 border border-border px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-center">
                      <span className="text-xs sm:text-sm font-medium text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {r.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                  <span className="text-xl sm:text-2xl">💡</span>
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 border border-border rounded-xl p-4 sm:p-6">
                  <p className="text-foreground leading-relaxed text-sm sm:text-base">{r.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
