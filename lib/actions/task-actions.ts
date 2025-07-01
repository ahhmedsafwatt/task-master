'use server'

import { createSupabaseClient } from '@/utils/supabase/server'
import { ActionResponse } from '../types/types'
import { TaskSchema } from '../types/zod'
import { revalidatePath } from 'next/cache'
import { ErrorHandler, validateAndSanitize } from '@/lib/utils/error-handler'

export async function createTask(
  prevStateOrParams: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createSupabaseClient()
  let userId: string | undefined

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      const appError = ErrorHandler.createError(
        'AUTH_ERROR',
        'User not authenticated',
        authError,
        'createTask'
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    userId = user.id

    // Parse and sanitize form data
    const rawData = {
      title: validateAndSanitize.taskTitle(formData.get('title') as string || ''),
      markdown_content: (formData.get('markdown_content') as string) || '',
      is_private: formData.get('is_private') === 'true',
      priority: (formData.get('priority') as string) || 'LOW',
      status: (formData.get('status') as string) || 'BACKLOG',
      project_id: (formData.get('project_id') as string) || null,
      project_name: validateAndSanitize.projectName(formData.get('project_name') as string || ''),
      assignee_ids: (() => {
        try {
          const ids = JSON.parse(formData.get('assignee_ids') as string || '[]')
          return Array.isArray(ids) ? ids.filter(id => validateAndSanitize.uuid(id)) : []
        } catch {
          return []
        }
      })(),
      due_date: (formData.get('due_date') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
    }

    // Validate input
    if (!rawData.title.trim()) {
      return {
        status: 'error',
        message: 'Task title is required',
      }
    }

    // Check project access if a project_id is provided
    if (rawData.project_id) {
      if (!validateAndSanitize.uuid(rawData.project_id)) {
        return {
          status: 'error',
          message: 'Invalid project ID format',
        }
      }

      const { data: projectAccess, error: accessError } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', rawData.project_id)
        .eq('user_id', user.id)
        .single()

      if (accessError || !projectAccess || projectAccess.role === 'VIEWER') {
        const appError = ErrorHandler.handleSupabaseError(
          accessError || { message: 'Insufficient permissions' },
          'createTask:checkProjectAccess',
          userId
        )
        return {
          status: 'error',
          message: 'You do not have permission to create tasks in this project',
        }
      }
    }

    // Validate with Zod
    const result = TaskSchema.safeParse(rawData)

    if (!result.success) {
      const appError = ErrorHandler.createError(
        'VALIDATION_ERROR',
        'Invalid input data',
        result.error.flatten().fieldErrors,
        'createTask:validation',
        userId
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: result.error.errors[0]?.message || 'Invalid input data',
        errors: result.error.flatten().fieldErrors,
      }
    }

    const validData = result.data

    // Begin transaction-like operation
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert([
        {
          creator_id: user.id,
          title: validData.title,
          is_private: validData.is_private,
          status: validData.status,
          priority: validData.priority,
          due_date: validData.due_date,
          end_date: validData.end_date,
          project_id: validData.project_id,
          markdown_content: validData.markdown_content,
          project_name: validData.project_name,
        },
      ])
      .select('id')
      .single()

    if (taskError) {
      const appError = ErrorHandler.handleSupabaseError(
        taskError,
        'createTask:insertTask',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    const taskId = taskData.id

    // Handle task assignments if provided
    if (validData.assignee_ids && validData.assignee_ids.length > 0) {
      // Verify all assignee IDs are valid users
      const { data: validUsers, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .in('id', validData.assignee_ids)

      if (userError) {
        const appError = ErrorHandler.handleSupabaseError(
          userError,
          'createTask:validateAssignees',
          userId
        )
        // Task was created, log the warning but don't fail
        ErrorHandler.logError(appError)
      } else {
                 const validUserIds = validUsers.map((u: any) => u.id)
                   const assignmentRecords = validUserIds.map((assigneeId: string) => ({
           task_id: taskId,
           user_id: assigneeId,
         }))

        const { error: assignError } = await supabase
          .from('task_assignees')
          .insert(assignmentRecords)

        if (assignError) {
          const appError = ErrorHandler.handleSupabaseError(
            assignError,
            'createTask:assignUsers',
            userId
          )
          ErrorHandler.logError(appError)
          return {
            status: 'created',
            message: 'Task created but some assignments failed',
            data: { taskId },
          }
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/overview')
    if (validData.project_id) {
      revalidatePath(`/dashboard/projects/${validData.project_id}`)
    }

    return {
      status: 'created',
      message: 'Task created successfully',
      data: { taskId },
    }
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'createTask', userId)
    return {
      status: 'error',
      message: ErrorHandler.createUserFriendlyMessage(appError),
    }
  }
}

export async function updateTask(
  taskId: string,
  prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createSupabaseClient()
  let userId: string | undefined

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      const appError = ErrorHandler.createError(
        'AUTH_ERROR',
        'User not authenticated',
        authError,
        'updateTask'
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    userId = user.id

    if (!validateAndSanitize.uuid(taskId)) {
      return {
        status: 'error',
        message: 'Invalid task ID format',
      }
    }

    // Check if user has permission to update this task
    const { data: taskAccess, error: accessError } = await supabase
      .from('tasks')
      .select('creator_id, project_id')
      .eq('id', taskId)
      .single()

    if (accessError || !taskAccess) {
      const appError = ErrorHandler.handleSupabaseError(
        accessError || { message: 'Task not found' },
        'updateTask:checkAccess',
        userId
      )
      return {
        status: 'error',
        message: 'Task not found or access denied',
      }
    }

    // Check permissions
    let hasPermission = taskAccess.creator_id === user.id

    if (!hasPermission && taskAccess.project_id) {
      const { data: projectMember } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', taskAccess.project_id)
        .eq('user_id', user.id)
        .single()

      hasPermission = projectMember?.role === 'ADMIN' || projectMember?.role === 'MEMBER'
    }

    if (!hasPermission) {
      return {
        status: 'error',
        message: 'You do not have permission to update this task',
      }
    }

    // Parse and sanitize form data
    const updateData: any = {}
    
    const title = formData.get('title') as string
    if (title !== null) {
      updateData.title = validateAndSanitize.taskTitle(title)
    }

    const markdown_content = formData.get('markdown_content') as string
    if (markdown_content !== null) {
      updateData.markdown_content = markdown_content
    }

    const status = formData.get('status') as string
    if (status) {
      updateData.status = status
    }

    const priority = formData.get('priority') as string
    if (priority) {
      updateData.priority = priority
    }

    const due_date = formData.get('due_date') as string
    if (due_date !== null) {
      updateData.due_date = due_date || null
    }

    // Update the task
    const { error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)

    if (updateError) {
      const appError = ErrorHandler.handleSupabaseError(
        updateError,
        'updateTask:updateTask',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/overview')
    if (taskAccess.project_id) {
      revalidatePath(`/dashboard/projects/${taskAccess.project_id}`)
    }

    return {
      status: 'updated',
      message: 'Task updated successfully',
      data: { taskId },
    }
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'updateTask', userId)
    return {
      status: 'error',
      message: ErrorHandler.createUserFriendlyMessage(appError),
    }
  }
}

export async function deleteTask(taskId: string): Promise<ActionResponse> {
  const supabase = await createSupabaseClient()
  let userId: string | undefined

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      const appError = ErrorHandler.createError(
        'AUTH_ERROR',
        'User not authenticated',
        authError,
        'deleteTask'
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    userId = user.id

    if (!validateAndSanitize.uuid(taskId)) {
      return {
        status: 'error',
        message: 'Invalid task ID format',
      }
    }

    // Check if user has permission to delete this task
    const { data: taskData, error: accessError } = await supabase
      .from('tasks')
      .select('creator_id, project_id')
      .eq('id', taskId)
      .single()

    if (accessError || !taskData) {
      const appError = ErrorHandler.handleSupabaseError(
        accessError || { message: 'Task not found' },
        'deleteTask:checkAccess',
        userId
      )
      return {
        status: 'error',
        message: 'Task not found or access denied',
      }
    }

    // Check permissions (only creator or project admin can delete)
    let hasPermission = taskData.creator_id === user.id

    if (!hasPermission && taskData.project_id) {
      const { data: projectMember } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', taskData.project_id)
        .eq('user_id', user.id)
        .single()

      hasPermission = projectMember?.role === 'ADMIN'
    }

    if (!hasPermission) {
      return {
        status: 'error',
        message: 'You do not have permission to delete this task',
      }
    }

    // Delete the task (cascading will handle task_assignees)
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (deleteError) {
      const appError = ErrorHandler.handleSupabaseError(
        deleteError,
        'deleteTask:deleteTask',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/overview')
    if (taskData.project_id) {
      revalidatePath(`/dashboard/projects/${taskData.project_id}`)
    }

    return {
      status: 'deleted',
      message: 'Task deleted successfully',
    }
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'deleteTask', userId)
    return {
      status: 'error',
      message: ErrorHandler.createUserFriendlyMessage(appError),
    }
  }
}

export async function assignTask(
  taskId: string,
  userIds: string[],
): Promise<ActionResponse> {
  const supabase = await createSupabaseClient()
  let userId: string | undefined

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      const appError = ErrorHandler.createError(
        'AUTH_ERROR',
        'User not authenticated',
        authError,
        'assignTask'
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    userId = user.id

    if (!validateAndSanitize.uuid(taskId)) {
      return {
        status: 'error',
        message: 'Invalid task ID format',
      }
    }

    // Validate all user IDs
    const validUserIds = userIds.filter(id => validateAndSanitize.uuid(id))
    if (validUserIds.length === 0) {
      return {
        status: 'error',
        message: 'No valid user IDs provided',
      }
    }

    // Check if user has permission to assign this task
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('creator_id, project_id')
      .eq('id', taskId)
      .single()

    if (taskError || !taskData) {
      const appError = ErrorHandler.handleSupabaseError(
        taskError || { message: 'Task not found' },
        'assignTask:checkTask',
        userId
      )
      return {
        status: 'error',
        message: 'Task not found',
      }
    }

    // Check permissions
    let hasPermission = taskData.creator_id === user.id

    if (!hasPermission && taskData.project_id) {
      const { data: projectMember } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', taskData.project_id)
        .eq('user_id', user.id)
        .single()

      hasPermission = projectMember?.role === 'ADMIN' || projectMember?.role === 'MEMBER'
    }

    if (!hasPermission) {
      return {
        status: 'error',
        message: 'You do not have permission to assign this task',
      }
    }

    // Create assignment records
    const assignmentRecords = validUserIds.map((assigneeId) => ({
      task_id: taskId,
      user_id: assigneeId,
    }))

    const { error: assignError } = await supabase
      .from('task_assignees')
      .upsert(assignmentRecords, { 
        onConflict: 'task_id,user_id',
        ignoreDuplicates: true 
      })

    if (assignError) {
      const appError = ErrorHandler.handleSupabaseError(
        assignError,
        'assignTask:createAssignments',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/overview')
    if (taskData.project_id) {
      revalidatePath(`/dashboard/projects/${taskData.project_id}`)
    }

    return {
      status: 'updated',
      message: 'Task assignments updated successfully',
    }
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'assignTask', userId)
    return {
      status: 'error',
      message: ErrorHandler.createUserFriendlyMessage(appError),
    }
  }
}
