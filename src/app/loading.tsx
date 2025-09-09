import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-md" />
          <Skeleton className="w-9 h-9 rounded-md" />
        </div>
      </header>

      {/* URL Input Skeleton */}
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      {/* Recent Recipes Skeleton */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-6">
                <Skeleton className="h-6 w-full mb-3" />
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
