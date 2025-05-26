import { Button } from '@/components/ui/button'
import { Enums, Tables } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'
import { Duration, format, intervalToDuration, isAfter } from 'date-fns'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

const getRemainingTime = (targetDate: Date): Duration | null => {
  const now = new Date()

  if (isAfter(now, targetDate)) {
    return null
  }

  return intervalToDuration({
    start: now,
    end: targetDate,
  })
}

const formatDuration = (duration: Duration | null): string => {
  if (!duration) return 'overdue'

  const { months = 0, days = 0, hours = 0, minutes = 0 } = duration

  if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`
  }

  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`
  }

  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }

  if (minutes > 0) {
    return `${minutes || 0} ${minutes === 1 ? 'minute' : 'minutes'}`
  }

  return 'Less than a minute'
}

const getStatusColor = (status: Enums<'task_status'>): string => {
  const statusColors = {
    IN_PROGRESS: 'bg-in-progress',
    BACKLOG: 'bg-zinc-500',
    COMPLETED: 'bg-success',
  } as const

  return statusColors[status] || 'bg-gray-500'
}

export const TaskItem = ({ task }: { task: Tables<'tasks'> }) => {
  const remaining = useMemo(() => {
    if (!task.due_date) return null
    return formatDuration(getRemainingTime(new Date(task.due_date)))
  }, [task.due_date])

  const statusColor = useMemo(
    () => getStatusColor(task.status as Enums<'task_status'>),
    [task.status]
  )

  return (
    <div className="dark:bg-primary bg-secondary dark:hover:bg-accent/50 hover:bg-muted relative flex cursor-pointer items-center justify-between rounded-lg border border-dashed p-3 shadow-md transition-colors">
      <Link
        href={`/dashboard/my-tasks/${task.id}`}
        className="flex-1"
        aria-label={`View task: ${task.title}`}
      >
        <div>
          <h3 className="line-clamp-2 font-medium">{task.title}</h3>
          <p className="text-muted-foreground truncate text-sm">
            Project: {task.project_id}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {task.status && (
              <div
                className={cn('h-2 w-2 rounded-full', statusColor)}
                aria-label={`Status: ${task.status.replace('_', ' ').toLowerCase()}`}
              />
            )}
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              {task.start_date && (
                <span>
                  Starts {format(new Date(task.start_date), 'dd MMM')}
                </span>
              )}
              {task.due_date && task.start_date && <span>•</span>}
              {task.due_date && (
                <span
                  className={cn(
                    remaining === 'overdue' && 'text-destructive font-medium'
                  )}
                >
                  Due {remaining}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <Button
        aria-label={`View details for ${task.title}`}
        variant="secondary"
        size="smIcon"
        className="hover:text-foreground ml-2 flex-shrink-0"
      >
        <Eye size={18} />
      </Button>
    </div>
  )
}
