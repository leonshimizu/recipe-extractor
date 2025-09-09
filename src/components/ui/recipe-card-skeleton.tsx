'use client';

import { Card } from '@/components/ui/card';

export function RecipeCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-card shadow-sm">
      <div className="aspect-video bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded w-12 animate-pulse" />
          <div className="h-5 bg-muted rounded w-16 animate-pulse" />
          <div className="h-5 bg-muted rounded w-14 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
