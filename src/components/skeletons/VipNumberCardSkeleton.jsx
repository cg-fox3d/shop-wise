import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function VipNumberCardSkeleton() {
  return (
    <Card className="w-full max-w-xs flex-shrink-0 overflow-hidden rounded-lg shadow-lg bg-card">
      <CardHeader className="p-0">
        <div className="bg-primary/80 text-primary-foreground p-3 flex justify-between items-center">
          <Skeleton className="h-6 w-2/5 rounded" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
        <div className="p-3 relative">
          <Skeleton className="h-6 w-1/3 absolute -top-3 left-1/2 -translate-x-1/2 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-4 text-center space-y-3">
        <div className="flex justify-between items-center text-sm">
          <Skeleton className="h-4 w-2/5 rounded" />
          <div className="text-right">
            <Skeleton className="h-4 w-1/4 mb-1 rounded" />
            <Skeleton className="h-4 w-1/6 rounded" />
          </div>
        </div>
        
        <Skeleton className="h-10 w-full rounded" />

        <div className="flex justify-between items-end">
          <div>
            <Skeleton className="h-5 w-1/3 mb-1 rounded" />
            <Skeleton className="h-6 w-1/2 rounded" />
          </div>
          <Skeleton className="h-10 w-1/3 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
