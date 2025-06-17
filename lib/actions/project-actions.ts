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
      console.error('Validation failed:', error.message)
      return {
        status: 'error',
        message: error.message,
      }
    }
    const project_id = data?.[0]?.id

    // Insert project member
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({ project_id, user_id: user.id, role: 'OWNER' })

    if (memberError) {
      await supabase.from('projects').delete().eq('id', project_id)
      console.error('Validation failed:', memberError.message)
      return {
        status: 'error',
        message: memberError.message,
      }
    }

    revalidatePath('/dashboard/overview')

    return {
      status: 'created',
      message: 'Project created successfully',
      data: {
        projectId: project_id,
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
