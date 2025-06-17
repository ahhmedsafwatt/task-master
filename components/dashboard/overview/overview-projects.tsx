import { Suspense } from 'react'
import { OverViewCard } from './overview-card'
import { OverviewProjectsBody } from './overview-project-body'
import { OverviewProjectsDialog } from './overview-project-dialog'
import { RevenueChartSkeleton } from './overview-skeletons'

export const OverViewProjects = () => {
  return (
    <OverViewCard
      title="Projects"
      bodyChildren={
        <Suspense fallback={<RevenueChartSkeleton />}>
          <OverviewProjectsBody />
        </Suspense>
      }
      headerChildren={<OverviewProjectsDialog />}
    />
  )
}
