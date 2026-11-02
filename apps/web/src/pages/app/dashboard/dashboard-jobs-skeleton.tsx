import { Skeleton } from '@/components/ui/primitives'

export function DashboardJobsSkeleton() {
  return (
    <div data-testid="dashboard-jobs-skeleton" className="flex flex-col gap-3 p-5">
      {Array.from({ length: 5 }, (_unused, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}
