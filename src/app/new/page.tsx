'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewRecipePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}