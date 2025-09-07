import { NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Debug API - Starting database query...');
    console.log('🔍 Environment:', process.env.NODE_ENV || 'undefined');
    console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('🔍 DATABASE_URL first 60 chars:', process.env.DATABASE_URL?.substring(0, 60));
    console.log('🔍 DATABASE_URL last 30 chars:', process.env.DATABASE_URL?.slice(-30));
    
    // Test basic database connection
    await db.select().from(recipes).limit(1);
    console.log('✅ Basic connection test passed');
    
    // Get all recipes with detailed info
    const allRecipes = await db.select().from(recipes).orderBy(desc(recipes.createdAt));
    console.log(`📊 Found ${allRecipes.length} recipes in database`);
    
    const queryTime = Date.now() - startTime;
    
    // Detailed recipe info
    const recipeDetails = allRecipes.map((r, index) => {
      console.log(`${index + 1}. ${r.extracted.title} - ID: ${r.id} - Created: ${r.createdAt}`);
      return {
        index: index + 1,
        id: r.id,
        title: r.extracted.title,
        createdAt: r.createdAt,
        sourceType: r.sourceType,
        sourceUrl: r.sourceUrl,
        servings: r.extracted.servings,
        costLocation: r.extracted.costLocation,
        totalCost: r.extracted.totalEstimatedCost,
        hasNutrition: !!(r.extracted.nutrition?.perServing?.calories)
      };
    });
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'undefined',
      queryTimeMs: queryTime,
      database: {
        url: process.env.DATABASE_URL?.substring(0, 60) + '...',
        urlEnd: process.env.DATABASE_URL?.slice(-30),
        connected: true
      },
      recipes: {
        count: allRecipes.length,
        details: recipeDetails
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    console.log('✅ Debug API response prepared');
    return NextResponse.json(response);
    
  } catch (error) {
    const queryTime = Date.now() - startTime;
    console.error('❌ Debug API error:', error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'undefined',
      queryTimeMs: queryTime,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined
      },
      database: {
        url: process.env.DATABASE_URL?.substring(0, 60) + '...',
        urlEnd: process.env.DATABASE_URL?.slice(-30),
        connected: false
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }, { status: 500 });
  }
}
