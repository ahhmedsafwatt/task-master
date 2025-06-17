import { getTaskAssignees } from '@/lib/data/queries'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TaskItem } from './overview-task-item'

export const OverviewTasksBody = async () => {
  const { data: tasks, error } = await getTaskAssignees()

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Unable to load tasks at this time
        </p>
      </div>
    )
  }

  if (tasks?.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">No tasks found</p>
        <p className="text-muted-foreground text-xs">
          Create your first task to get started
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {tasks?.map((task) => <TaskItem key={task.id} task={task} />)}
      </div>
      <Button asChild variant="inverted" className="mt-5 w-full">
        <Link href="/dashboard/tasks">View all tasks ({tasks?.length})</Link>
      </Button>
    </>
  )
}
