import { db } from '@/db';
import { recipes } from '@/db/schema';
import { desc } from 'drizzle-orm';
import HomeClient from '@/components/HomeClient';

type Recipe = typeof recipes.$inferSelect;

export default async function HomePage() {
  // Fetch recent recipes directly on the server with error handling
  let recentRecipes: Recipe[] = [];
  
  try {
    recentRecipes = await db
      .select()
      .from(recipes)
      .orderBy(desc(recipes.createdAt))
      .limit(4);
  } catch (error) {
    console.error('Error fetching recent recipes:', error);
    recentRecipes = [];
  }

  return <HomeClient recentRecipes={recentRecipes} />;
}