import { NextRequest } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema';
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

    // Delete the recipe
    const deleted = await db.delete(recipes).where(eq(recipes.id, id)).returning({ id: recipes.id });

    if (deleted.length === 0) {
      return new Response('Recipe not found', { status: 404 });
    }

    return Response.json({ success: true, deletedId: deleted[0].id });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
