import { OverViewTasksBody } from './overview-task-body'
import { OverViewTasksDialog } from './overview-task-dialog'
import { Suspense } from 'react'
import { CardsSkeleton } from './overview-skeletons'

export async function OverViewTasks() {
  return (
    <>
      <Suspense fallback={<CardsSkeleton />}>
        <OverViewTasksBody />
      </Suspense>
      <OverViewTasksDialog />
    </>
  )
}
