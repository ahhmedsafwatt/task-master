import { getTasks } from '@/lib/server/queries'
import { TaskItem } from './overview-task-item'
import HorizontalSlider from '@/components/ui/horizontal-slider'

export const OverViewTasksBody = async () => {
  const tasksResponse = await getTasks()

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

  return (
    <HorizontalSlider className="px-4">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </HorizontalSlider>
  )
}
