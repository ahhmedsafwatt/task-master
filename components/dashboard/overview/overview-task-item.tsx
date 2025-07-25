'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Enums } from '@/lib/types/database.types'
import { TasksWithAssigness } from '@/lib/types/types'
import { cn } from '@/lib/utils'
import { Box, Calendar, CalendarClock, Users } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { format, formatDistanceToNow, isPast } from 'date-fns'

const getStatusConfig = (status?: Enums<'task_status'> | null) => {
  if (!status) return null

  const statusConfig = {
    IN_PROGRESS: {
      label: 'In Progress',
      className: 'bg-blue-600/60',
    },
    BACKLOG: {
      label: 'Backlog',
      className: 'bg-gray-600/60',
    },
    DONE: {
      label: 'Done',
      className: 'bg-green-600/60',
    },
    TODO: {
      label: 'Todo',
      className: 'bg-purple-600/60',
    },
  } as const

  return (
    statusConfig[status] || {
      label: status,
      className: 'bg-gray-600/60',
    }
  )
}

const getPriorityConfig = (priority?: Enums<'task_priority'> | null) => {
  if (!priority) return null

  const priorityConfig = {
    URGENT: {
      label: 'Urgent',
      className: 'bg-red-600/60',
    },
    HIGH: {
      label: 'High',
      className: 'bg-orange-600/60',
    },
    MEDIUM: {
      label: 'Medium',
      className: 'bg-yellow-600/60',
    },
    LOW: {
      label: 'Low',
      className: 'bg-green-600/60',
    },
  } as const

  return (
    priorityConfig[priority] || {
      label: priority,
      className: 'bg-gray-600/60',
    }
  )
}

export const TaskItem = ({ task }: { task: TasksWithAssigness }) => {
  const statusConfig = useMemo(
    () => getStatusConfig(task?.status),
    [task?.status],
  )
  const priorityConfig = useMemo(
    () => getPriorityConfig(task?.priority),
    [task?.priority],
  )

  const displayedAssignees = useMemo(() => {
    return task.assignees?.slice(0, 4) || []
  }, [task.assignees])

  const remainingCount = useMemo(() => {
    return Math.max(0, (task.assignees?.length || 0) - 4)
  }, [task.assignees])

  const formattedDueDate = task.due_date
    ? formatDistanceToNow(new Date(task.due_date), { addSuffix: true })
    : null

  const formattedCreatedDate = task.created_at
    ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true })
    : null

  return (
    <Link
      href={`/dashboard/tasks/${task?.id}`}
      className="group block"
      aria-label={`View task: ${task?.title}`}
    >
      <div className="to-accent from-accent via-secondary rounded-xl border bg-gradient-to-r px-4 py-6 shadow-md">
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-start justify-between">
              <h3 className="text-foreground line-clamp-1 text-xl font-bold transition-all duration-300 group-hover:text-blue-400 group-hover:underline">
                {task?.title}
              </h3>
              <div className="ml-4 flex flex-shrink-0 items-center">
                {displayedAssignees.length > 0 ? (
                  <div className="flex items-center">
                    <div className="flex -space-x-3">
                      {displayedAssignees.map((assignee) => (
                        <TooltipProvider key={assignee.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Avatar className="border-background relative h-7 w-7 hover:z-50">
                                <AvatarImage
                                  src={assignee.avatar_url!}
                                  alt={assignee.username || 'User'}
                                />
                                <AvatarFallback className="text-xs">
                                  {assignee.username?.slice(0, 1)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>{assignee.username || assignee.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>

                    {remainingCount > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-muted border-background ml-1 flex h-7 w-7 items-center justify-center rounded-full">
                              <span className="text-muted-foreground text-xs font-medium">
                                +{remainingCount}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>
                              {remainingCount} more assignee
                              {remainingCount > 1 ? 's' : ''}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-muted/50 flex h-7 w-7 items-center justify-center rounded-full">
                          <Users size={14} className="text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>No assignees</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <Box className="h-4 w-4" />
              {task.is_private ? (
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
                  Personal task
                </span>
              ) : (
                task.project_name && (
                  <span className="bg-muted line-clamp-1 rounded-full px-2 py-0.5 text-xs">
                    {task.project_name}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center">
              {task.due_date &&
                (!task.end_date ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn('flex items-center gap-1', {
                            'text-destructive': isPast(new Date(task.due_date)),
                          })}
                        >
                          <Calendar size={12} />
                          <span>Due {formattedDueDate}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>
                          Due date:{' '}
                          {new Date(task.due_date!).toLocaleDateString()}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div
                    className={cn('flex items-center gap-1', {
                      'text-destructive': isPast(new Date(task.end_date)),
                    })}
                  >
                    <CalendarClock className="text-muted-foreground h-4 w-4" />
                    <span>
                      {format(new Date(task.due_date), 'MMM dd, yyyy')}
                    </span>
                    <span>{` -> `}</span>
                    <span>
                      {format(new Date(task.end_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                ))}

              {formattedCreatedDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <p className="text-muted-foreground text-xs">
                    Created {formattedCreatedDate}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statusConfig && (
                <Badge
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    statusConfig.className,
                  )}
                >
                  {statusConfig.label}
                </Badge>
              )}

              {priorityConfig && (
                <Badge
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    priorityConfig.className,
                  )}
                >
                  {priorityConfig.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
