import { Skeleton } from '@/components/ui/primitives'

export function RecentActivitySkeleton() {
  return (
    <div data-testid="recent-activity-skeleton" className="flex flex-col gap-3.5">
      {Array.from({ length: 5 }, (_unused, itemIndex) => (
        <div key={itemIndex} className="flex items-start gap-3 p-1.5">
          <Skeleton className="mt-0.5 size-4 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
