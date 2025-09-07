import { db } from '@/db';
import { recipes } from '@/db/schema';
import { desc } from 'drizzle-orm';
import HistoryClient from '@/components/HistoryClient';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

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

        {/* Client-side search and filtering */}
        <HistoryClient allRecipes={allRecipes} />
      </div>
    </main>
  );
}
