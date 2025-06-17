'use server'

import { createSupabaseClient } from '@/utils/supabase/server'
import { ActionResponse } from '../types/types'
import { TaskSchema } from '../types/zod'
import { revalidatePath } from 'next/cache'

export async function createTask(
  prevStateOrParams: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const supabase = await createSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        status: 'error',
        message: 'User not authenticated',
      }
    }

    // Parse and validate form data with Zod
    const rawData = {
      title: formData.get('title') as string,
      markdown_content: formData.get('markdown_content') as string,
      is_private: formData.get('is_private') === 'true',
      priority: (formData.get('priority') as string) || 'LOW',
      status: (formData.get('status') as string) || 'BACKLOG',
      project_id: (formData.get('project_id') as string) || null,
      project_name: (formData.get('project_name') as string) || null,
      assignee_ids: JSON.parse(formData.get('assignee_ids') as string),
      due_date: (formData.get('due_date') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
    }

    // Check project access if a project_id is provided and user is not a member of the project
    if (rawData.project_id) {
      try {
        const { data: projectAccess } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', rawData.project_id)
          .eq('user_id', user.id)
          .single()

        if (!projectAccess || projectAccess.role === 'VIEWER') {
          return {
            status: 'error',
            message: 'You do not have access to create tasks in this project',
          }
        }
      } catch (error) {
        console.error('Error checking project access:', error)
        return {
          status: 'error',
          message: 'Failed to check project access',
        }
      }
    }

    // Validate with Zod
    const result = TaskSchema.safeParse(rawData)

    // If validation fails, return errors
    if (!result.success) {
      console.error('Validation failed:', result.error.format())
      return {
        status: 'error',
        message: result.error.errors[0]?.message || 'Invalid input data',
        errors: result.error.flatten().fieldErrors,
      }
    }

    // Validation passed, use the parsed data (automatically converts to proper types)
    const validData = result.data

    // Insert task
    const { data, error } = await supabase
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

    if (error) {
      console.error('Error creating task:', error)
      return {
        status: 'error',
        message: error.message,
      }
    }

    const taskId = data?.[0]?.id
    // If we have an assignee and a task was created successfully, assign the user to the task
    if (
      validData.assignee_ids &&
      validData.assignee_ids.length !== 0 &&
      taskId
    ) {
      try {
        const assignmentRecords = validData.assignee_ids.map((userId) => ({
          task_id: taskId,
          user_id: userId,
        }))

        const { error: assignError } = await supabase
          .from('task_assignees')
          .insert(assignmentRecords)
          .select()

        if (assignError) {
          console.error('Error assigning user to task:', assignError)
          return {
            status: 'created',
            message: 'Task created but failed to assign user',
            data: { taskId },
          }
        }
      } catch (error) {
        console.error('Error assigning user to task:', error)
        return {
          status: 'error',
          message: 'Failed to assign user to task',
        }
      }
    }

    revalidatePath('/dashboard/overview')
    return {
      status: 'created',
      message: 'Task created successfully',
      data: { taskId },
    }
  } catch (error) {
    console.error('Error creating task:', error)
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function assigneTask() {
  const supabase = await createSupabaseClient()

  const { data, error: assignError } = await supabase
    .from('task_assignees')
    .insert([
      {
        task_id: 'c7bf6731-54a9-4837-a95b-58b836e130f5',
        user_id: 'ab3584c3-12d9-4c7d-8d74-87ca803f0921',
      },
    ])
    .select()

  console.log(assignError)
  console.log(data)
}
