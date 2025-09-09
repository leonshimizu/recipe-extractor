import { NextRequest } from 'next/server';
import { db } from '@/db';
import { recipes, extractionJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return new Response('Recipe ID is required', { status: 400 });
    }

    // First, delete any related extraction jobs
    console.log(`🗑️ Deleting extraction jobs for recipe: ${id}`);
    const deletedJobs = await db.delete(extractionJobs).where(eq(extractionJobs.recipeId, id)).returning({ id: extractionJobs.id });
    console.log(`🗑️ Deleted ${deletedJobs.length} extraction job(s)`);

    // Then delete the recipe
    console.log(`🗑️ Deleting recipe: ${id}`);
    const deleted = await db.delete(recipes).where(eq(recipes.id, id)).returning({ id: recipes.id });

    if (deleted.length === 0) {
      return new Response('Recipe not found', { status: 404 });
    }

    console.log(`✅ Successfully deleted recipe: ${id}`);

    return Response.json({ success: true, deletedId: deleted[0].id });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
