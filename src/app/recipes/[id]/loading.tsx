import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecipeLoading() {
  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Card Skeleton */}
        <Card className="overflow-hidden">
          <Skeleton className="h-64 w-full" />
          <CardContent className="p-8">
            <div className="flex flex-wrap gap-4 mb-6">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            
            {/* Recipe Metrics Skeleton */}
            <div className="flex flex-wrap gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-muted/50">
                  <CardContent className="px-4 py-3">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-5 w-12" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Tags Skeleton */}
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Cards Skeleton */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Ingredients Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-start">
                    <Skeleton className="w-2 h-2 rounded-full mr-4 mt-3 flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-full mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructions Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start">
                    <Skeleton className="w-8 h-8 rounded-full mr-4 flex-shrink-0" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Cards Skeleton */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
