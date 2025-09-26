import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const ActivitiesPageSkeleton = () => (
  <div className="container mx-auto py-6 px-4 md:px-6 space-y-8">
    <div className="text-center">
      <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
      <Skeleton className="h-6 w-3/4 mx-auto" />
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>

    <Skeleton className="h-[280px] rounded-2xl" />

    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-10 w-full" />
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ActivitiesPageSkeleton;