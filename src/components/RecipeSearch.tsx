'use client';
import { useState, useMemo, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

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

interface RecipeSearchProps {
  recipes: Recipe[];
  onFilteredRecipes: (filtered: Recipe[]) => void;
}

export default function RecipeSearch({ recipes, onFilteredRecipes }: RecipeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Extract all unique tags from recipes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach(recipe => {
      recipe.extracted.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [recipes]);

  // Group tags by category for better UX
  const tagCategories = useMemo(() => {
    const categories: Record<string, string[]> = {
      'Main Ingredients': [],
      'Cuisine': [],
      'Meal Type': [],
      'Cooking Method': [],
      'Dietary': [],
      'Other': []
    };

    const mainIngredients = ['chicken', 'beef', 'pork', 'fish', 'pasta', 'rice', 'eggs', 'vegetables', 'cheese'];
    const cuisines = ['italian', 'mexican', 'asian', 'american', 'mediterranean', 'indian', 'french', 'chinese'];
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer'];
    const cookingMethods = ['baked', 'fried', 'grilled', 'slow-cooked', 'no-cook', 'one-pot', 'roasted'];
    const dietary = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'healthy'];

    allTags.forEach(tag => {
      const lowerTag = tag.toLowerCase();
      if (mainIngredients.some(ing => lowerTag.includes(ing))) {
        categories['Main Ingredients'].push(tag);
      } else if (cuisines.some(cuisine => lowerTag.includes(cuisine))) {
        categories['Cuisine'].push(tag);
      } else if (mealTypes.some(meal => lowerTag.includes(meal))) {
        categories['Meal Type'].push(tag);
      } else if (cookingMethods.some(method => lowerTag.includes(method))) {
        categories['Cooking Method'].push(tag);
      } else if (dietary.some(diet => lowerTag.includes(diet))) {
        categories['Dietary'].push(tag);
      } else {
        categories['Other'].push(tag);
      }
    });

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  }, [allTags]);

  // Get unique source types
  const sourceTypes = useMemo(() => {
    const sources = new Set(recipes.map(r => r.sourceType));
    return Array.from(sources).sort();
  }, [recipes]);

  // Filter recipes based on search and filters
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Text search (title, ingredients)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(recipe => {
        const titleMatch = recipe.extracted.title.toLowerCase().includes(query);
        const ingredientMatch = recipe.extracted.ingredients.some(ing => 
          ing.name.toLowerCase().includes(query)
        );
        const tagMatch = recipe.extracted.tags.some(tag => 
          tag.toLowerCase().includes(query)
        );
        return titleMatch || ingredientMatch || tagMatch;
      });
    }

    // Tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(recipe => 
        selectedTags.every(tag => recipe.extracted.tags.includes(tag))
      );
    }

    // Source filter
    if (selectedSource) {
      filtered = filtered.filter(recipe => recipe.sourceType === selectedSource);
    }

    return filtered;
  }, [recipes, searchQuery, selectedTags, selectedSource]);

  // Update parent component when filters change
  useEffect(() => {
    onFilteredRecipes(filteredRecipes);
  }, [filteredRecipes, onFilteredRecipes]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedSource('');
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const hasActiveFilters = searchQuery.trim() || selectedTags.length > 0 || selectedSource;
  const activeFilterCount = (selectedTags.length > 0 ? 1 : 0) + (selectedSource ? 1 : 0);

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar with Filter Toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search recipes, ingredients, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FunnelIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-white text-gray-900 text-xs px-1.5 py-0.5 rounded-full font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick Filter Pills (Always Visible) */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedSource('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !selectedSource 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Sources
        </button>
        {sourceTypes.map(source => (
          <button
            key={source}
            onClick={() => setSelectedSource(source === selectedSource ? '' : source)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              selectedSource === source 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {source}
          </button>
        ))}
        {/* Show popular tags as quick filters */}
        {allTags.slice(0, 4).map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Expandable Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Advanced Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Collapsible Tag Categories */}
          {Object.entries(tagCategories).map(([category, tags]) => (
            <div key={category} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center justify-between w-full text-left py-2 hover:text-gray-900"
              >
                <span className="text-sm font-medium text-gray-700">{category}</span>
                <ChevronDownIcon 
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    expandedCategory === category ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {expandedCategory === category && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredRecipes.length} of {recipes.length} recipes
          </span>
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedTags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {selectedTags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{selectedTags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
