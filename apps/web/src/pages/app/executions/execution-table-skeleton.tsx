import { Skeleton } from '@/components/ui/primitives'

export function ExecutionTableSkeleton() {
  return (
    <div data-testid="execution-table-skeleton" className="flex flex-col gap-3 p-5">
      {Array.from({ length: 6 }, (_unused, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
