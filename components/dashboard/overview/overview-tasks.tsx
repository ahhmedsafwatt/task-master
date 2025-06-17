import { OverViewCard } from './overview-card'
import { OverviewTasksBody } from './overview-task-body'
import { OverviewTasksDialog } from './overview-task-dialog'
import { Suspense } from 'react'
import { CardsSkeleton } from './overview-skeletons'

export async function OverViewTasks() {
  return (
    <OverViewCard
      title="Tasks"
      className="col-span-2"
      bodyChildren={
        <Suspense fallback={<CardsSkeleton />}>
          <OverviewTasksBody />
        </Suspense>
      }
      headerChildren={<OverviewTasksDialog />}
    />
  )
}
