import 'server-only'
import { createSupabaseClient } from '@/utils/supabase/server'
import { cache } from 'react'
import { ErrorHandler, type AppError } from '@/lib/utils/error-handler'
import type { Tables } from '@/lib/types/database.types'

// Consistent response type for all queries
export type QueryResponse<T> = {
  data: T | null
  error: AppError | null
  count?: number
}

/**
 * Get Profile data
 * fetches the user profile data from the database
 */
export const getProfile = cache(async (): Promise<QueryResponse<any>> => {
  try {
    const supabase = await createSupabaseClient()
    const { data: userData, error: userError } =
      await supabase.auth.getSession()

    if (userError || !userData.session) {
      const appError = ErrorHandler.createError(
        'AUTH_ERROR',
        'User not authenticated',
        userError,
        'getProfile'
      )
      ErrorHandler.logError(appError)
      return { data: null, error: appError }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.session.user.id)
      .single()

    if (error) {
      const appError = ErrorHandler.handleSupabaseError(
        error,
        'getProfile',
        userData.session.user.id
      )
      return { data: null, error: appError }
    }

    return { data, error: null }
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'getProfile')
    return { data: null, error: appError }
  }
})

/**
 * main get user function
 * used to get every thing about the user
 */
export const getUser = cache(async () => {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      return null
    }

    return data.user
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'getUser')
    ErrorHandler.logError(appError)
    return null
  }
})

/**
 * Get all related Projects with improved error handling and pagination
 */
export const getProjects = cache(
  async (limit = 4, offset = 0): Promise<QueryResponse<any[]>> => {
    try {
      const supabase = await createSupabaseClient()
      const user = await getUser()
      
      if (!user) {
        const appError = ErrorHandler.createError(
          'AUTH_ERROR',
          'User not authenticated',
          null,
          'getProjects'
        )
        return { data: null, error: appError }
      }

      const query = supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        const appError = ErrorHandler.handleSupabaseError(
          error,
          'getProjects',
          user.id
        )
        return { data: null, error: appError }
      }

      return { data: data || [], error: null, count: count || 0 }
    } catch (error) {
      const appError = ErrorHandler.handleUnknownError(error, 'getProjects')
      return { data: null, error: appError }
    }
  }
)

/**
 * Get projects with members using optimized query with proper joins
 */
export const getProjectsWithMembers = cache(
  async (limit = 4, offset = 0): Promise<QueryResponse<any[]>> => {
    try {
      const supabase = await createSupabaseClient()
      const user = await getUser()
      
      if (!user) {
        const appError = ErrorHandler.createError(
          'AUTH_ERROR',
          'User not authenticated',
          null,
          'getProjectsWithMembers'
        )
        return { data: null, error: appError }
      }

      const { data, error, count } = await supabase
        .from('projects')
        .select(`
          *,
          project_members!inner(
            user_id,
            role,
            joined_at,
            profiles!inner(
              id,
              username,
              avatar_url,
              email
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        const appError = ErrorHandler.handleSupabaseError(
          error,
          'getProjectsWithMembers',
          user.id
        )
        return { data: null, error: appError }
      }

             // Transform the data to flatten the nested structure
       const transformedData = data?.map((project: any) => ({
        ...project,
        project_members: project.project_members?.map((member: any) => ({
          id: member.profiles?.id,
          username: member.profiles?.username,
          avatar_url: member.profiles?.avatar_url,
          email: member.profiles?.email,
          role: member.role,
          joined_at: member.joined_at,
        })) ?? [],
      })) || []

      return { data: transformedData, error: null, count: count || 0 }
    } catch (error) {
      const appError = ErrorHandler.handleUnknownError(error, 'getProjectsWithMembers')
      return { data: null, error: appError }
    }
  }
)

/**
 * Get tasks with improved filtering and pagination
 */
export const getTasks = cache(
  async (
    limit = 4, 
    offset = 0, 
    filters?: {
      status?: string
      priority?: string
      project_id?: string
      is_private?: boolean
    }
  ): Promise<QueryResponse<any[]>> => {
    try {
      const supabase = await createSupabaseClient()
      const user = await getUser()
      
      if (!user) {
        const appError = ErrorHandler.createError(
          'AUTH_ERROR',
          'User not authenticated',
          null,
          'getTasks'
        )
        return { data: null, error: appError }
      }

      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters?.is_private !== undefined) {
        query = query.eq('is_private', filters.is_private)
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1)

      if (error) {
        const appError = ErrorHandler.handleSupabaseError(
          error,
          'getTasks',
          user.id
        )
        return { data: null, error: appError }
      }

      return { data: data || [], error: null, count: count || 0 }
    } catch (error) {
      const appError = ErrorHandler.handleUnknownError(error, 'getTasks')
      return { data: null, error: appError }
    }
  }
)

/**
 * Get tasks with assignees using optimized query
 */
export const getTasksWithAssignees = cache(
  async (limit = 4, offset = 0): Promise<QueryResponse<any[]>> => {
    try {
      const supabase = await createSupabaseClient()
      const user = await getUser()
      
      if (!user) {
        const appError = ErrorHandler.createError(
          'AUTH_ERROR',
          'User not authenticated',
          null,
          'getTasksWithAssignees'
        )
        return { data: null, error: appError }
      }

      const { data, error, count } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignees!left(
            user_id,
            assigned_at,
            profiles!inner(
              id,
              username,
              avatar_url,
              email
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        const appError = ErrorHandler.handleSupabaseError(
          error,
          'getTasksWithAssignees',
          user.id
        )
        return { data: null, error: appError }
      }

             // Transform the data to flatten assignees
       const transformedData = data?.map((task: any) => ({
        ...task,
        assignees: task.task_assignees?.map((assignee: any) => assignee.profiles) || [],
      })) || []

      return { data: transformedData, error: null, count: count || 0 }
    } catch (error) {
      const appError = ErrorHandler.handleUnknownError(error, 'getTasksWithAssignees')
      return { data: null, error: appError }
    }
  }
)

/**
 * Get single project with full details
 */
export const getProjectById = cache(
  async (projectId: string): Promise<QueryResponse<any>> => {
    try {
      const supabase = await createSupabaseClient()
      const user = await getUser()
      
      if (!user) {
        const appError = ErrorHandler.createError(
          'AUTH_ERROR',
          'User not authenticated',
          null,
          'getProjectById'
        )
        return { data: null, error: appError }
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members(
            user_id,
            role,
            joined_at,
            profiles(
              id,
              username,
              avatar_url,
              email
            )
          ),
          tasks(
            id,
            title,
            status,
            priority,
            created_at,
            due_date
          )
        `)
        .eq('id', projectId)
        .single()

      if (error) {
        const appError = ErrorHandler.handleSupabaseError(
          error,
          'getProjectById',
          user.id
        )
        return { data: null, error: appError }
      }

      return { data, error: null }
    } catch (error) {
      const appError = ErrorHandler.handleUnknownError(error, 'getProjectById')
      return { data: null, error: appError }
    }
  }
)

/**
 * Get notifications for current user
 */
export const getNotifications = cache(
  async (limit = 10, offset = 0): Promise<QueryResponse<any[]>> => {
    try {
      const supabase = await createSupabaseClient()
      const user = await getUser()
      
      if (!user) {
        const appError = ErrorHandler.createError(
          'AUTH_ERROR',
          'User not authenticated',
          null,
          'getNotifications'
        )
        return { data: null, error: appError }
      }

      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        const appError = ErrorHandler.handleSupabaseError(
          error,
          'getNotifications',
          user.id
        )
        return { data: null, error: appError }
      }

      return { data: data || [], error: null, count: count || 0 }
    } catch (error) {
      const appError = ErrorHandler.handleUnknownError(error, 'getNotifications')
      return { data: null, error: appError }
    }
  }
)
