import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/primitives'

export function DashboardKpiSkeleton() {
  return (
    <div
      data-testid="dashboard-kpi-skeleton"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_unused, cardIndex) => (
        <Card key={cardIndex} className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center gap-3.5">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
          <Skeleton className="h-7 w-18" />
        </Card>
      ))}
    </div>
  )
}
