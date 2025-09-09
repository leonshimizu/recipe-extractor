import { NextRequest } from 'next/server';
import { db } from '@/db';
import { extractionJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ url: string }> }
) {
  try {
    const { url } = await params;
    const decodedUrl = decodeURIComponent(url);
    
    console.log('🔍 [JOB-STATUS] Checking status for URL:', decodedUrl);
    
    const job = await db
      .select()
      .from(extractionJobs)
      .where(eq(extractionJobs.url, decodedUrl))
      .limit(1);
    
    if (job.length === 0) {
      console.log('❌ [JOB-STATUS] No job found for URL:', decodedUrl);
      return Response.json({ 
        exists: false, 
        message: 'No extraction job found for this URL' 
      }, { status: 404 });
    }
    
    const jobData = job[0];
    console.log('✅ [JOB-STATUS] Job found:', {
      id: jobData.id,
      status: jobData.status,
      progress: jobData.progress,
      recipeId: jobData.recipeId
    });
    
    return Response.json({
      exists: true,
      id: jobData.id,
      status: jobData.status,
      progress: jobData.progress,
      currentStep: jobData.currentStep,
      message: jobData.message,
      estimatedDuration: jobData.estimatedDuration,
      recipeId: jobData.recipeId,
      errorMessage: jobData.errorMessage,
      createdAt: jobData.createdAt,
      updatedAt: jobData.updatedAt,
      completedAt: jobData.completedAt
    });
    
  } catch (error) {
    console.error('❌ [JOB-STATUS] Error checking job status:', error);
    return Response.json({ 
      error: 'Failed to check job status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
