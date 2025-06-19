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

    // Extract all form data
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const coverUrl = formData.get('cover_url') as string
    const coverFile = formData.get('cover_file') as File | null

    // Validate basic project data
    const rawData: ProjectInput = {
      name,
      description,
      project_cover: coverUrl || '', // URL takes precedence
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

    // Create the project first (without cover for file uploads)
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        project_cover: coverUrl || null, // Only set URL covers initially
        creator_id: user.id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Project creation failed:', error.message)
      return {
        status: 'error',
        message: error.message,
      }
    }

    const project_id = data.id

    // Insert project member
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({ project_id, user_id: user.id, role: 'OWNER' })

    if (memberError) {
      // Rollback: delete the project if member creation fails
      await supabase.from('projects').delete().eq('id', project_id)
      console.error('Member creation failed:', memberError.message)
      return {
        status: 'error',
        message: memberError.message,
      }
    }

    // Handle file upload if a file was provided
    if (coverFile && coverFile.size > 0) {
      try {
        // Upload file to storage
        const fileExt = coverFile.name.split('.').pop()
        const filePath = `${project_id}/projectcover.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-covers')
          .upload(filePath, coverFile, {
            upsert: true,
            contentType: coverFile.type,
            cacheControl: 'no-cache',
          })

        if (uploadError) {
          console.error('File upload failed:', uploadError.message)
          console.warn('Project created but cover upload failed')
          throw `Project Cover update failed : ${uploadError.message}`
        } else {
          // Get public URL and update project
          const {
            data: { publicUrl },
          } = supabase.storage
            .from('project-covers')
            .getPublicUrl(uploadData.path)

          const { error: updateError } = await supabase
            .from('projects')
            .update({ project_cover: publicUrl })
            .eq('id', project_id)

          if (updateError) {
            console.error('Project cover update failed:', updateError.message)
            throw `Project Cover update failed : ${updateError.message}`
          }
        }
      } catch (fileError) {
        console.error('File processing error:', fileError)
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

export async function uploadProjectCover({
  file,
  project_id,
  url,
}: {
  file?: File
  url?: string
  project_id: string
}) {
  try {
    const supabase = await createSupabaseClient()

    if (url) {
      // Update the project with the new cover URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ project_cover: url })
        .eq('id', project_id)

      if (updateError) {
        console.error('Update failed:', updateError.message)
        return {
          status: 'error',
          message: updateError.message,
        }
      }

      revalidatePath(`/dashboard/overview`)
      return {
        status: 'success',
        message: 'Project cover updated successfully',
      }
    }

    if (!file) {
      return {
        status: 'error',
        message: 'No file provided',
      }
    }

    // Upload the file to Supabase storage
    const fileExt = file.name.split('.').pop()
    const filePath = `${project_id}/projectcover.${fileExt}`

    const { data, error: uploadError } = await supabase.storage
      .from('project-covers')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: 'no-cache',
      })

    console.log('Upload data:', data)
    console.log(uploadError)

    if (uploadError) {
      console.error('Upload failed:', uploadError.message)
      return {
        status: 'error',
        message: uploadError.message,
      }
    }

    // Get the public URL of the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from('project-covers').getPublicUrl(data.path)

    // Update the project with the new cover URL
    const { error: updateError } = await supabase
      .from('projects')
      .update({ project_cover: publicUrl })
      .eq('id', project_id)

    if (updateError) {
      console.error('Update failed:', updateError.message)
      return {
        status: 'error',
        message: updateError.message,
      }
    }

    revalidatePath(`/dashboard/overview`)

    return {
      status: 'success',
      message: 'Project cover uploaded successfully',
    }
  } catch (error) {
    console.error('Error uploading project cover:', error)
    return {
      status: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to upload project cover',
    }
  }
}
