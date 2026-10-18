import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSkeletonCard() {
  return (
    <div className="size-full flex items-center justify-center align-middle place-content-center p-6 m-2 bg-night">
      <Card className="w-full bg-jungle max-w-xs">
        <CardHeader className="bg-jungle/90">
          <Skeleton className="h-4 w-2/3 bg-jungle/90" />
          <Skeleton className="h-4 w-1/2 bg-jungle/90" />
        </CardHeader>
        <CardContent className="bg-jungle">
          <Skeleton className="aspect-video w-full bg-jungle/90" />
        </CardContent>
      </Card>
    </div>
  );
}
