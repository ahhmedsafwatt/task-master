'use server'
import { createSupabaseClient } from '@/utils/supabase/server'
import { ActionResponse } from '../types/types'
import { ProjectInput, ProjectSchema } from '../types/zod'
import { revalidatePath } from 'next/cache'

export async function createProject(
  prevStateOrParams: ActionResponse,
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

    const rawData: ProjectInput = {
      name: formData.get('name') as string,
      project_cover: formData.get('project_cover') as string,
      description: formData.get('description') as string,
    }

    const result = ProjectSchema.safeParse(rawData)
    if (!result.success) {
      console.error('Validation failed:', result.error.format())
      return {
        status: 'error',
        message: result.error.errors[0]?.message || 'invalid input data',
        errors: result.error.flatten().fieldErrors,
      }
    }
    const projectData = result.data
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        project_cover: projectData.project_cover,
        description: projectData.description,
        creator_id: user.id,
      })
      .select('id')

    if (error) {
      console.error('Error inserting project:', error)
      return {
        status: 'error',
        message: error.message || 'Failed to create project',
      }
    }

    revalidatePath('/dashboard/overview')
    return {
      status: 'created',
      message: 'Project created successfully',
      data: {
        projectId: data[0].id,
      },
    }
  } catch (error) {
    console.error('Error creating project:', error)
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to create project',
    }
  }
}
