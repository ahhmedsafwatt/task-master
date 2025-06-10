import { getTaskAssignees } from '@/lib/server/queries'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TaskItem } from './overview-task-item'

export const OverViewTasksBody = async () => {
  const tasksResponse = await getTaskAssignees()

  if (!tasksResponse?.data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Unable to load tasks at this time
        </p>
      </div>
    )
  }

  const tasks = tasksResponse.data
  const isEmpty = tasks.length === 0

  if (isEmpty) {
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
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
      <Button asChild variant="inverted" className="mt-5 w-full">
        <Link href="/dashboard/my-tasks">View all tasks ({tasks.length})</Link>
      </Button>
    </>
  )
}
