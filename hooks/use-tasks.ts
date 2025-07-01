import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, getTasksWithAssignees } from '@/lib/data/queries'
import { createTask, updateTask, deleteTask, assignTask } from '@/lib/actions/task-actions'
import { ActionResponse } from '@/lib/types/types'
import { toast } from 'sonner'

// Query Keys for consistent cache management
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  withAssignees: () => [...taskKeys.all, 'assignees'] as const,
}

// Hook to fetch tasks with optional filters
export function useTasks(
  limit = 10,
  offset = 0,
  filters?: {
    status?: string
    priority?: string
    project_id?: string
    is_private?: boolean
  }
) {
  return useQuery({
    queryKey: taskKeys.list({ limit, offset, ...filters }),
    queryFn: () => getTasks(limit, offset, filters),
    select: (data: any) => {
      if (data.error) {
        throw new Error(data.error.message)
      }
      return {
        tasks: data.data || [],
        count: data.count || 0,
      }
    },
    // Enable background refetch for real-time updates
    refetchInterval: 30000, // 30 seconds
  })
}

// Hook to fetch tasks with assignees
export function useTasksWithAssignees(limit = 10, offset = 0) {
  return useQuery({
    queryKey: [...taskKeys.withAssignees(), limit, offset],
    queryFn: () => getTasksWithAssignees(limit, offset),
    select: (data: any) => {
      if (data.error) {
        throw new Error(data.error.message)
      }
      return {
        tasks: data.data || [],
        count: data.count || 0,
      }
    },
    // Enable background refetch
    refetchInterval: 30000,
  })
}

// Hook to create a new task
export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (formData: FormData): Promise<ActionResponse> => {
      return createTask(null, formData)
    },
    onSuccess: (data: any) => {
      if (data.status === 'created') {
        // Invalidate and refetch tasks
        queryClient.invalidateQueries({ queryKey: taskKeys.all })
        
        // Show success toast
        toast.success(data.message)
      } else if (data.status === 'error') {
        toast.error(data.message)
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create task: ${error.message}`)
    },
  })
}

// Hook to update a task
export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      formData 
    }: { 
      taskId: string
      formData: FormData 
    }): Promise<ActionResponse> => {
      return updateTask(taskId, null, formData)
    },
    onSuccess: (data, variables) => {
      if (data.status === 'updated') {
        // Invalidate specific task and related queries
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) })
        queryClient.invalidateQueries({ queryKey: taskKeys.all })
        
        toast.success(data.message)
      } else if (data.status === 'error') {
        toast.error(data.message)
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`)
    },
  })
}

// Hook to delete a task
export function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (taskId: string): Promise<ActionResponse> => {
      return deleteTask(taskId)
    },
    onSuccess: (data, taskId) => {
      if (data.status === 'deleted') {
        // Remove from cache and invalidate lists
        queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) })
        queryClient.invalidateQueries({ queryKey: taskKeys.all })
        
        toast.success(data.message)
      } else if (data.status === 'error') {
        toast.error(data.message)
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete task: ${error.message}`)
    },
  })
}

// Hook to assign users to a task
export function useAssignTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      userIds 
    }: { 
      taskId: string
      userIds: string[] 
    }): Promise<ActionResponse> => {
      return assignTask(taskId, userIds)
    },
    onSuccess: (data, variables) => {
      if (data.status === 'updated') {
        // Invalidate task details and assignee queries
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) })
        queryClient.invalidateQueries({ queryKey: taskKeys.withAssignees() })
        
        toast.success(data.message)
      } else if (data.status === 'error') {
        toast.error(data.message)
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign task: ${error.message}`)
    },
  })
}

// Hook to get task statistics (can be used for dashboards)
export function useTaskStats(filters?: { project_id?: string }) {
  return useQuery({
    queryKey: ['task-stats', filters],
    queryFn: async () => {
      const { data, error } = await getTasks(1000, 0, filters) // Get all tasks for stats
      
      if (error) {
        throw new Error(error.message)
      }
      
      const tasks = data || []
      
      return {
        total: tasks.length,
        completed: tasks.filter((t: any) => t.status === 'COMPLETED').length,
        inProgress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        backlog: tasks.filter((t: any) => t.status === 'BACKLOG').length,
        overdue: tasks.filter((t: any) => 
          t.due_date && 
          new Date(t.due_date) < new Date() && 
          t.status !== 'COMPLETED'
        ).length,
        highPriority: tasks.filter((t: any) => 
          t.priority === 'HIGH' || t.priority === 'URGENT'
        ).length,
      }
    },
    // Stats don't need frequent updates
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Hook for optimistic updates when changing task status
export function useOptimisticTaskUpdate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      updates 
    }: { 
      taskId: string
      updates: Partial<{ status: string; priority: string }> 
    }) => {
      const formData = new FormData()
      Object.entries(updates).forEach(([key, value]) => {
        formData.append(key, value)
      })
      
      return updateTask(taskId, null, formData)
    },
    // Optimistic update
    onMutate: async ({ taskId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all })
      
      // Snapshot previous values
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.all })
      
      // Optimistically update
      queryClient.setQueriesData({ queryKey: taskKeys.all }, (old: any) => {
        if (!old?.data) return old
        
        return {
          ...old,
          data: old.data.map((task: any) => 
            task.id === taskId ? { ...task, ...updates } : task
          )
        }
      })
      
      return { previousTasks }
    },
    // Revert on error
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error('Failed to update task')
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}