import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseUrl: {
      exists: !!process.env.DATABASE_URL,
      first60: process.env.DATABASE_URL?.substring(0, 60),
      last30: process.env.DATABASE_URL?.slice(-30)
    },
    allEnvVars: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      // Don't expose the full keys, just check if they exist
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasIG: !!process.env.IG_OEMBED_TOKEN
    }
  });
}
