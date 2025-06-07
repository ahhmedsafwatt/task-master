import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Enums, Tables } from '@/lib/types/database.types'
import { format } from 'date-fns'
import { Eye, Folder } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

const getStatusColor = (status: Enums<'task_status'>): string => {
  const statusColors = {
    IN_PROGRESS: 'bg-blue-100 text-blue-800 ',
    BACKLOG: 'bg-gray-100 text-gray-800 ',
    COMPLETED: 'bg-green-100 text-green-800 ',
  } as const

  return statusColors[status] || 'bg-gray-100 text-gray-800 '
}

const getPriorityColor = (priority: Enums<'task_priority'>): string => {
  const priorityColors = {
    URGENT: 'bg-red-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    LOW: 'bg-green-500 text-white',
  } as const

  return priorityColors[priority] || 'bg-gray-500 text-white'
}

export const TaskItem = ({ task }: { task: Tables<'tasks'> }) => {
  const statusColor = useMemo(
    () => getStatusColor(task.status as Enums<'task_status'>),
    [task.status],
  )

  const priorityColor = useMemo(
    () => getPriorityColor(task.priority as Enums<'task_priority'>),
    [task.priority],
  )

  return (
    <Link href={`/dashboard/my-tasks/${task.id}`} className="w-full">
      <Card
        className={`group h-full min-h-48 w-full min-w-72 gap-2 shadow-md transition-shadow duration-300 hover:shadow-lg`}
      >
        <CardHeader className="px-3">
          <CardTitle className="line-clamp-3 w-full text-ellipsis text-base group-hover:underline">
            {task.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-3">
          {task.project_name && (
            <div className="text-muted-foreground flex items-center">
              <Folder className="size-4" />
              <span className="ml-1.5 text-sm leading-none">
                {task.project_name || 'No project'}
              </span>
            </div>
          )}
          {task.is_private && (
            <div className="text-muted-foreground text-sm">
              <span>Private Task</span>
            </div>
          )}
          <div
            className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${statusColor}`}
          >
            {task.status}
          </div>
          <div
            className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${priorityColor}`}
          >
            {task.priority}
          </div>
          {task.due_date &&
            (!task.end_date ? (
              <div className="text-muted-foreground text-sm">
                <span>{format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                <span>{format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                <span>{` -> `}</span>
                <span>{format(new Date(task.end_date), 'MMM dd, yyyy')}</span>
              </div>
            ))}
        </CardContent>
      </Card>
    </Link>
  )
}
