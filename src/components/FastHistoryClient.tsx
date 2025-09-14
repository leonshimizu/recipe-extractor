'use client';

import { useState, useMemo, useTransition, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DeleteRecipeButton from '@/components/DeleteRecipeButton';
import Pagination from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, X, ChevronDown, Search } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Recipe {
  id: string;
  sourceType: string;
  thumbnailUrl: string | null;
  createdAt: Date | null;
  extracted: {
    title: string;
    tags: string[];
    costLocation: string;
    totalEstimatedCost: number | null;
    // Enhanced search data
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
}

interface FastHistoryClientProps {
  allRecipes: Recipe[];
  availableTags: string[];
  availableSources: string[];
  currentPage: number;
  totalPages: number;
  totalRecipes: number;
  hasFilters: boolean;
}

const RECIPES_PER_PAGE = 12;

export default function FastHistoryClient({
  allRecipes,
  availableTags,
  availableSources,
  currentPage,
  totalPages,
  totalRecipes,
  hasFilters
}: FastHistoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Local state for instant UI updates
  const [localSearch, setLocalSearch] = useState<string>(
    searchParams.get('search') || ''
  );
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [localSelectedSources, setLocalSelectedSources] = useState<string[]>(
    searchParams.get('source')?.split(',').filter(Boolean) || []
  );
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isLocallyFiltering, setIsLocallyFiltering] = useState(false);

  // Fast client-side filtering for instant feedback
  const filteredRecipes = useMemo(() => {
    let filtered = allRecipes;

    // Enhanced search filter - searches across ALL recipe content
    if (localSearch.trim()) {
      const searchTerm = localSearch.toLowerCase().trim();
      filtered = filtered.filter(recipe => {
        // Basic fields
        const title = recipe.extracted.title?.toLowerCase() || '';
        const tags = recipe.extracted.tags?.join(' ').toLowerCase() || '';
        const notes = recipe.extracted.notes?.toLowerCase() || '';
        
        // Ingredients (including notes)
        const ingredients = recipe.extracted.ingredients?.map(ing => 
          `${ing.name} ${ing.notes || ''}`.toLowerCase()
        ).join(' ') || '';
        
        // Steps/Instructions
        const steps = recipe.extracted.steps?.join(' ').toLowerCase() || '';
        
        // Equipment
        const equipment = recipe.extracted.equipment?.join(' ').toLowerCase() || '';
        
        // Component-based content (for newer recipes)
        const componentContent = recipe.extracted.components?.map(comp => {
          const compName = comp.name.toLowerCase();
          const compIngredients = comp.ingredients.map(ing => 
            `${ing.name} ${ing.notes || ''}`.toLowerCase()
          ).join(' ');
          const compSteps = comp.steps.join(' ').toLowerCase();
          const compNotes = comp.notes?.toLowerCase() || '';
          
          return `${compName} ${compIngredients} ${compSteps} ${compNotes}`;
        }).join(' ') || '';
        
        // Search across all content
        return title.includes(searchTerm) || 
               tags.includes(searchTerm) || 
               ingredients.includes(searchTerm) ||
               steps.includes(searchTerm) ||
               equipment.includes(searchTerm) ||
               notes.includes(searchTerm) ||
               componentContent.includes(searchTerm);
      });
    }

    // Tag filters - OR logic (show recipes that have ANY of the selected tags)
    if (localSelectedTags.length > 0) {
      filtered = filtered.filter(recipe =>
        localSelectedTags.some(tag => recipe.extracted.tags.includes(tag))
      );
    }

    // Source filters - OR logic (show recipes from ANY of the selected sources)
    if (localSelectedSources.length > 0) {
      filtered = filtered.filter(recipe => 
        localSelectedSources.includes(recipe.sourceType)
      );
    }

    return filtered;
  }, [allRecipes, localSearch, localSelectedTags, localSelectedSources]);

  // Group tags by category for better UX
  const tagCategories = useMemo(() => ({
    'Main Ingredients': availableTags.filter(tag => 
      ['chicken', 'beef', 'pork', 'fish', 'pasta', 'rice', 'eggs', 'vegetables', 'cheese'].some(ing => 
        tag.toLowerCase().includes(ing)
      )
    ),
    'Cuisine': availableTags.filter(tag => 
      ['italian', 'mexican', 'asian', 'american', 'mediterranean', 'indian', 'french', 'chinese', 'japanese'].some(cuisine => 
        tag.toLowerCase().includes(cuisine)
      )
    ),
    'Meal Type': availableTags.filter(tag => 
      ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer'].some(meal => 
        tag.toLowerCase().includes(meal)
      )
    ),
    'Cooking Method': availableTags.filter(tag => 
      ['baked', 'fried', 'grilled', 'slow-cooked', 'no-cook', 'one-pot', 'roasted'].some(method => 
        tag.toLowerCase().includes(method)
      )
    ),
    'Dietary': availableTags.filter(tag => 
      ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'healthy'].some(diet => 
        tag.toLowerCase().includes(diet)
      )
    ),
    'Other': availableTags.filter(tag => {
      const lowerTag = tag.toLowerCase();
      return ![
        'chicken', 'beef', 'pork', 'fish', 'pasta', 'rice', 'eggs', 'vegetables', 'cheese',
        'italian', 'mexican', 'asian', 'american', 'mediterranean', 'indian', 'french', 'chinese', 'japanese',
        'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer',
        'baked', 'fried', 'grilled', 'slow-cooked', 'no-cook', 'one-pot', 'roasted',
        'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'healthy'
      ].some(keyword => lowerTag.includes(keyword));
    })
  }), [availableTags]);

  const filteredCategories = Object.entries(tagCategories).filter(([, tags]) => tags.length > 0);

  // Calculate most popular tags and sources for quick filters
  const tagFrequency = useMemo(() => {
    const frequency: { [key: string]: number } = {};
    allRecipes.forEach(recipe => {
      recipe.extracted.tags.forEach(tag => {
        frequency[tag] = (frequency[tag] || 0) + 1;
      });
    });
    return frequency;
  }, [allRecipes]);

  const sourceFrequency = useMemo(() => {
    const frequency: { [key: string]: number } = {};
    allRecipes.forEach(recipe => {
      frequency[recipe.sourceType] = (frequency[recipe.sourceType] || 0) + 1;
    });
    return frequency;
  }, [allRecipes]);

  // Get most popular tags (excluding very common ones that aren't useful)
  const popularTags = useMemo(() => {
    const excludeCommon = ['easy', 'quick', 'simple', 'delicious', 'tasty', 'yummy'];
    return availableTags
      .filter(tag => !excludeCommon.includes(tag.toLowerCase()))
      .sort((a, b) => (tagFrequency[b] || 0) - (tagFrequency[a] || 0))
      .slice(0, 4); // Show top 4 most popular
  }, [availableTags, tagFrequency]);

  // Get most popular sources
  const popularSources = useMemo(() => {
    return availableSources
      .sort((a, b) => (sourceFrequency[b] || 0) - (sourceFrequency[a] || 0))
      .slice(0, 3); // Show top 3 most popular sources
  }, [availableSources, sourceFrequency]);

  // Update URL with debounced server-side sync (for pagination/sharing)
  const syncFiltersToUrl = useCallback((search: string, tags: string[], sources: string[]) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      
      if (search.trim()) {
        params.set('search', search.trim());
      } else {
        params.delete('search');
      }
      
      if (tags.length > 0) {
        params.set('tags', tags.join(','));
      } else {
        params.delete('tags');
      }
      
      if (sources.length > 0) {
        params.set('source', sources.join(','));
      } else {
        params.delete('source');
      }
      
      params.delete('page');
      
      const queryString = params.toString();
      const newUrl = queryString ? `/history?${queryString}` : '/history';
      router.push(newUrl);
    });
  }, [searchParams, router, startTransition]);

  // Use refs to track the latest filter state for debouncing
  const latestFiltersRef = useRef({ search: localSearch, tags: localSelectedTags, sources: localSelectedSources });
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs whenever local state changes
  useEffect(() => {
    latestFiltersRef.current = { search: localSearch, tags: localSelectedTags, sources: localSelectedSources };
  }, [localSearch, localSelectedTags, localSelectedSources]);

  // Debounced sync function that uses the latest state
  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Show that we're about to sync
    setIsLocallyFiltering(true);
    
    syncTimeoutRef.current = setTimeout(() => {
      const { search, tags, sources } = latestFiltersRef.current;
      syncFiltersToUrl(search, tags, sources);
      // The loading state will be cleared when the component re-renders with new data
    }, 300);
  }, [syncFiltersToUrl]);

  const toggleTag = (tag: string) => {
    const newTags = localSelectedTags.includes(tag)
      ? localSelectedTags.filter(t => t !== tag)
      : [...localSelectedTags, tag];
    
    // Instant UI update
    setLocalSelectedTags(newTags);
    
    // Debounced server sync using latest state
    debouncedSync();
  };

  const toggleSource = (source: string) => {
    const newSources = localSelectedSources.includes(source)
      ? localSelectedSources.filter(s => s !== source)
      : [...localSelectedSources, source];
    
    // Instant UI update
    setLocalSelectedSources(newSources);
    
    // Debounced server sync using latest state
    debouncedSync();
  };

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    // Debounced server sync using latest state
    debouncedSync();
  };

  const clearAllFilters = () => {
    // Cancel any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    setLocalSearch('');
    setLocalSelectedTags([]);
    setLocalSelectedSources([]);
    syncFiltersToUrl('', [], []);
  };

  // Clear loading state when we receive new data from server
  useEffect(() => {
    setIsLocallyFiltering(false);
  }, [allRecipes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const hasActiveFilters = localSearch.trim() || localSelectedTags.length > 0 || localSelectedSources.length > 0;
  const activeFilterCount = (localSearch.trim() ? 1 : 0) + (localSelectedTags.length > 0 ? 1 : 0) + (localSelectedSources.length > 0 ? 1 : 0);

  // For display: if server already loaded filtered data, use it; otherwise use client filtering
  const displayedRecipes = useMemo(() => {
    if (hasFilters) {
      // Server loaded all recipes for filtering, apply client-side filters
      return filteredRecipes;
    } else {
      // Server sent paginated results, show them as-is
      return allRecipes;
    }
  }, [filteredRecipes, allRecipes, hasFilters]);

  if (allRecipes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🍳</span>
        </div>
        <h3 className="text-xl font-medium mb-2">No recipes yet</h3>
        <p className="text-muted-foreground mb-6">Start by extracting your first recipe from a video URL</p>
        <Button asChild>
          <Link href="/">
            Extract Recipe
            <span className="ml-2">→</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Recipe History</h1>
          <p className="text-muted-foreground mt-2">
            All your extracted recipes
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes, ingredients, instructions, equipment, or anything..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Filters show recipes that match <em>any</em> of your selections - click more to see more results!
          </p>
        )}
      </div>

      {/* Fast Filters */}
      <div className="space-y-4">
        {/* Filter Toggle Button */}
        <div className="flex items-center justify-between">
          <Button
            variant={showFilters || hasActiveFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4" />
            <span className="ml-2">Filters</span>
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Quick Filters - Sources and Popular Tags */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Source Filters */}
          {popularSources.map(source => (
            <Button
              key={source}
              variant={localSelectedSources.includes(source) ? "default" : "secondary"}
              size="sm"
              onClick={() => toggleSource(source)}
              className={cn(
                "flex-shrink-0 h-8 text-xs capitalize",
                isLocallyFiltering && "opacity-70"
              )}
            >
              {source}
              <span className="ml-1 text-xs opacity-70">({sourceFrequency[source] || 0})</span>
            </Button>
          ))}
          
          {/* Divider */}
          {popularSources.length > 0 && popularTags.length > 0 && (
            <div className="flex-shrink-0 w-px bg-border h-6 self-center mx-1" />
          )}
          
          {/* Most popular tags as quick filters */}
          {popularTags.map(tag => (
            <Badge
              key={tag}
              variant={localSelectedTags.includes(tag) ? "default" : "secondary"}
              className={cn(
                "flex-shrink-0 cursor-pointer h-8 px-3 text-xs hover:bg-accent transition-colors",
                localSelectedTags.includes(tag) && "bg-primary text-primary-foreground hover:bg-primary/90",
                isLocallyFiltering && "opacity-70"
              )}
              onClick={() => toggleTag(tag)}
            >
              {tag}
              <span className="ml-1 text-xs opacity-70">({tagFrequency[tag] || 0})</span>
            </Badge>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Advanced Filters</h3>
              </div>

              <div className="space-y-3">
                {filteredCategories.map(([category, tags]) => (
                  <Collapsible key={category}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center justify-between w-full text-left p-2 h-auto hover:bg-accent"
                        onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                      >
                        <span className="text-sm font-medium text-foreground">{category}</span>
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            expandedCategory === category && "rotate-180"
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2">
                      <div className="flex flex-wrap gap-2 mt-3 pl-2">
                        {tags.map(tag => (
                          <Badge
                            key={tag}
                            variant={localSelectedTags.includes(tag) ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer text-xs hover:bg-accent transition-colors",
                              localSelectedTags.includes(tag) && "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
            <span className="font-medium">
              Showing {displayedRecipes.length} of {totalRecipes} recipes
              {(isPending || isLocallyFiltering) && <span className="ml-2 text-xs">(updating...)</span>}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {localSelectedSources.slice(0, 2).map(source => (
                <Badge
                  key={source}
                  variant="secondary"
                  className="inline-flex items-center text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors capitalize"
                  onClick={() => toggleSource(source)}
                >
                  {source}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
              {localSelectedSources.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{localSelectedSources.length - 2} more sources
                </span>
              )}
              {localSelectedTags.slice(0, 3).map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="inline-flex items-center text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
              {localSelectedTags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{localSelectedTags.length - 3} more tags
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {displayedRecipes.map((recipe) => (
          <div key={recipe.id} className="relative group">
            <Link href={`/recipes/${recipe.id}`} className="block" prefetch={true}>
              <Card className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]">
                {recipe.thumbnailUrl && (
                  <div className="aspect-video relative overflow-hidden">
                    <Image
                      src={recipe.thumbnailUrl}
                      alt={recipe.extracted.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                )}
                
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-medium line-clamp-2 flex-1 pr-2">
                      {recipe.extracted.title}
                    </h3>
                  </div>
                  
                  {recipe.extracted.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {recipe.extracted.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {recipe.extracted.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{recipe.extracted.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-4">
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
                      View Recipe
                      <span className="ml-1">→</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <div className="absolute top-3 right-3 z-10">
              <DeleteRecipeButton recipeId={recipe.id} />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination - only show if not filtering (server-side pagination) */}
      {!hasFilters && !hasActiveFilters && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalRecipes}
          itemsPerPage={RECIPES_PER_PAGE}
        />
      )}
    </>
  );
}
