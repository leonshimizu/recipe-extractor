'use client';

import { useState } from 'react';
import { URLInput } from '@/components/ui/url-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import LocationSelect from '@/components/ui/location-select';
import EnhancedExtraction from '@/components/EnhancedExtraction';
import { useBackgroundJobs } from '@/hooks/useBackgroundJobs';
import { Settings, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

type ExtractState = 'idle' | 'loading' | 'success' | 'error' | 'duplicate';

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

interface HomeClientProps {
  recentRecipes: Recipe[];
}

export default function HomeClient({ recentRecipes }: HomeClientProps) {
  const [extractState, setExtractState] = useState<ExtractState>('idle');
  const [currentUrl, setCurrentUrl] = useState<string>(''); // Track the current URL being processed
  const [location, setLocation] = useState<string>('Guam'); // Default to Guam as shown in screenshots
  const router = useRouter();
  const { addRecentUrl, activeJobs } = useBackgroundJobs();


  const handleExtract = async (url: string) => {
    
    // Prevent multiple simultaneous extractions
    if (extractState === 'loading') {
      console.log('⚠️ [HOME-CLIENT] Already extracting, ignoring click');
      return;
    }
    
    // Immediately set to loading to prevent double-clicks
    setExtractState('loading');

    // First check if recipe already exists (fast check only)
    console.log('🔍 [HOME-CLIENT] Starting quick duplicate check...');
    try {
      const checkRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, notes: '', location, quickCheck: true })
      });
      
      console.log('🔍 [HOME-CLIENT] Quick check response status:', checkRes.status);
      
      if (checkRes.ok) {
        const data = await checkRes.json();
        console.log('🔍 [HOME-CLIENT] Quick check result:', data);
        
        if (data.isExisting) {
          console.log('✅ [HOME-CLIENT] Recipe exists, redirecting to:', data.id);
          toast.success('Recipe already exists! Opening existing recipe...');
          router.push(`/recipes/${data.id}`);
          return;
        }
      }
    } catch (error) {
      console.log('⚠️ [HOME-CLIENT] Quick check failed:', error);
      console.log('🔄 [HOME-CLIENT] Proceeding with full extraction');
    }

    // Add URL to recent extractions for background tracking
    addRecentUrl(url);
    
    // Start enhanced extraction with streaming
    setCurrentUrl(url); // Set the current URL immediately
  };

  const handleOpenInHistory = () => {
    toast.success('Opening in history...');
    router.push('/history');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-lg sm:text-xl">🍳</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Recipe Extractor</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="w-8 h-8 sm:w-9 sm:h-9 p-0" onClick={() => router.push('/settings')}>
            <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </header>

      {/* Extract Form */}
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <div className="space-y-2">
          <URLInput
            onExtract={handleExtract}
            isLoading={extractState === 'loading'}
          />
          
          {/* Compact Location Selection */}
          <div className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/20 border border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>📍</span>
              <span className="hidden sm:inline">Cost estimates for</span>
              <span className="sm:hidden">Costs for</span>
            </div>
            <LocationSelect
              value={location}
              onValueChange={setLocation}
              compact={true}
            />
          </div>
          
          {/* Platform Quality Notice */}
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="space-y-1">
                <div className="font-medium text-sm">Extraction Quality:</div>
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span><strong>TikTok & YouTube:</strong> High quality - full audio transcription available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span><strong>Instagram:</strong> Good quality - uses video descriptions and captions</span>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Background Jobs Indicator */}
        {activeJobs.length > 0 && extractState === 'idle' && (
          <div className="mb-4">
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                {activeJobs.filter(job => job.status.status === 'processing').length > 0 ? (
                  <>
                    🔄 {activeJobs.filter(job => job.status.status === 'processing').length} recipe(s) extracting in background...
                    <br />
                    <span className="text-sm opacity-75">You can navigate away - we&apos;ll notify you when ready!</span>
                  </>
                ) : (
                  <>
                    ✅ Background extractions completed! Check your notifications.
                  </>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* States */}
        <div className="mt-6">
          {extractState === 'idle' && (
            <div className="text-center py-4 sm:py-8 md:py-12">
              <div className="hidden sm:flex w-32 h-32 mx-auto mb-6 bg-muted rounded-2xl items-center justify-center">
                <span className="text-4xl">🎬</span>
              </div>
              <p className="hidden sm:block text-muted-foreground text-sm sm:text-base">
                Ready to extract your first recipe!
              </p>
            </div>
          )}

          {extractState === 'loading' && currentUrl && (
            <EnhancedExtraction 
              url={currentUrl}
              location={location}
              onComplete={(recipeId) => {
                setExtractState('success');
                setCurrentUrl(''); // Clear the URL
                router.push(`/recipes/${recipeId}`);
              }}
              onError={() => {
                setExtractState('error');
                setCurrentUrl(''); // Clear the URL
              }}
            />
          )}

          {extractState === 'error' && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to extract recipe from this video. Please check the URL and try again.
              </AlertDescription>
            </Alert>
          )}

          {extractState === 'duplicate' && (
            <Alert className="rounded-2xl bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Looks like you&apos;ve extracted this before</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-700 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-800/20"
                  onClick={handleOpenInHistory}
                >
                  Open in History
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Recent Recipes */}
      {extractState === 'idle' && (
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold">Recent Recipes</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/history')}
              className="text-xs sm:text-sm"
            >
              View All
            </Button>
          </div>
          
          {recentRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recentRecipes.map((recipe) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="block" prefetch={true}>
                  <Card className="overflow-hidden hover:shadow-md transition-all duration-200 group cursor-pointer hover:scale-[1.02]">
                    {/* Recipe Image */}
                    {recipe.thumbnailUrl && (
                      <div className="relative h-40 sm:h-48 overflow-hidden">
                        <Image
                          src={recipe.thumbnailUrl}
                          alt={recipe.extracted.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          priority={false}
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                          <Badge variant="secondary" className="bg-black/70 text-white border-0 text-xs">
                            {recipe.sourceType}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {/* Recipe Content */}
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <h3 className="text-base sm:text-lg font-medium line-clamp-2 flex-1">
                          {recipe.extracted.title}
                        </h3>
                      </div>
                      
                      {/* Tags */}
                      {recipe.extracted.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                          {recipe.extracted.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {recipe.extracted.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{recipe.extracted.tags.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                        <span className="capitalize">{recipe.sourceType}</span>
                        <span>•</span>
                        <span className="truncate">{recipe.extracted.costLocation}</span>
                        {recipe.extracted.totalEstimatedCost && (
                          <>
                            <span>•</span>
                            <span>${recipe.extracted.totalEstimatedCost.toFixed(2)}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Unknown date'}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground group-hover:text-primary transition-colors">
                          <span className="hidden sm:inline">View Recipe</span>
                          <span className="sm:hidden">View</span>
                          <span className="ml-1">→</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🍳</span>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base px-4">No recipes yet. Extract your first recipe to get started!</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
