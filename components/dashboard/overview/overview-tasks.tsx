import { OverViewCard } from './overview-card'
import { OverViewTasksBody } from './overview-task-body'
import { OverViewTasksDialog } from './overview-task-dialog'
import { Suspense } from 'react'
import { CardsSkeleton } from './overview-skeletons'

export async function OverViewTasks() {
  return (
    <OverViewCard
      title="Tasks"
      className="dark:bg-secondary bg-accent"
      bodyChildren={
        <Suspense fallback={<CardsSkeleton />}>
          <OverViewTasksBody />
        </Suspense>
      }
      headerChildren={<OverViewTasksDialog />}
    />
  )
}
