'use server'
import { createSupabaseClient } from '@/utils/supabase/server'
import { ActionResponse } from '../types/types'
import { ProjectInput, ProjectSchema } from '../types/zod'
import { revalidatePath } from 'next/cache'
import { ErrorHandler, validateAndSanitize } from '@/lib/utils/error-handler'

export async function createProject(
  prevStateOrParams: ActionResponse,
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
        'createProject'
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    userId = user.id

    // Extract and sanitize form data
    const name = validateAndSanitize.projectName(formData.get('name') as string || '')
    const description = (formData.get('description') as string || '').trim().substring(0, 500)
    const coverUrl = (formData.get('cover_url') as string || '').trim()
    const coverFile = formData.get('cover_file') as File | null

    // Validate basic project data
    const rawData: ProjectInput = {
      name,
      description: description || null,
      project_cover: coverUrl || null,
    }

    const result = ProjectSchema.safeParse(rawData)
    if (!result.success) {
      const appError = ErrorHandler.createError(
        'VALIDATION_ERROR',
        'Invalid input data',
        result.error.flatten().fieldErrors,
        'createProject:validation',
        userId
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: result.error.errors[0]?.message || 'Invalid input data',
        errors: result.error.flatten().fieldErrors,
      }
    }

    const projectData = result.data

    // Validate file if provided
    if (coverFile && coverFile.size > 0) {
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      
      if (coverFile.size > maxSize) {
        return {
          status: 'error',
          message: 'Cover image must be smaller than 10MB',
        }
      }
      
      if (!allowedTypes.includes(coverFile.type)) {
        return {
          status: 'error',
          message: 'Cover image must be JPEG, PNG, or WebP format',
        }
      }
    }

    // Create the project (transaction-like operation)
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        project_cover: coverUrl || null,
        creator_id: user.id,
      })
      .select('id')
      .single()

    if (projectError) {
      const appError = ErrorHandler.handleSupabaseError(
        projectError,
        'createProject:insertProject',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    const project_id = newProject.id

    // Insert project member with ADMIN role (creator should be admin, not owner as per SQL schema)
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({ 
        project_id, 
        user_id: user.id, 
        role: 'ADMIN' // Use ADMIN instead of OWNER as per enum definition
      })

    if (memberError) {
      // Rollback: delete the project if member creation fails
      await supabase.from('projects').delete().eq('id', project_id)
      const appError = ErrorHandler.handleSupabaseError(
        memberError,
        'createProject:insertMember',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
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
          const appError = ErrorHandler.handleSupabaseError(
            uploadError,
            'createProject:uploadCover',
            userId
          )
          ErrorHandler.logError(appError)
          // Don't fail the project creation, just log the error
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
            const appError = ErrorHandler.handleSupabaseError(
              updateError,
              'createProject:updateCover',
              userId
            )
            ErrorHandler.logError(appError)
            // Don't fail the project creation
          }
        }
      } catch (fileError) {
        const appError = ErrorHandler.handleUnknownError(
          fileError, 
          'createProject:fileProcessing', 
          userId
        )
        ErrorHandler.logError(appError)
        // Don't fail the project creation
      }
    }

    revalidatePath('/dashboard/overview')
    revalidatePath('/dashboard/projects')

    return {
      status: 'created',
      message: 'Project created successfully',
      data: {
        projectId: project_id,
      },
    }
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'createProject', userId)
    return {
      status: 'error',
      message: ErrorHandler.createUserFriendlyMessage(appError),
    }
  }
}

export async function updateProject(
  projectId: string,
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
        'updateProject'
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    userId = user.id

    if (!validateAndSanitize.uuid(projectId)) {
      return {
        status: 'error',
        message: 'Invalid project ID format',
      }
    }

    // Check if user has permission to update this project
    const { data: projectAccess, error: accessError } = await supabase
      .from('project_members')
      .select('role, project_id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (accessError || !projectAccess || projectAccess.role === 'VIEWER') {
      const appError = ErrorHandler.handleSupabaseError(
        accessError || { message: 'Insufficient permissions' },
        'updateProject:checkAccess',
        userId
      )
      return {
        status: 'error',
        message: 'You do not have permission to update this project',
      }
    }

    // Extract and sanitize form data
    const updateData: any = {}
    
    const name = formData.get('name') as string
    if (name !== null && name.trim()) {
      updateData.name = validateAndSanitize.projectName(name)
    }

    const description = formData.get('description') as string
    if (description !== null) {
      updateData.description = description.trim().substring(0, 500) || null
    }

    // Update the project
    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)

    if (updateError) {
      const appError = ErrorHandler.handleSupabaseError(
        updateError,
        'updateProject:updateProject',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    revalidatePath('/dashboard/overview')
    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${projectId}`)

    return {
      status: 'updated',
      message: 'Project updated successfully',
      data: { projectId },
    }
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'updateProject', userId)
    return {
      status: 'error',
      message: ErrorHandler.createUserFriendlyMessage(appError),
    }
  }
}

export async function deleteProject(projectId: string): Promise<ActionResponse> {
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
        'deleteProject'
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    userId = user.id

    if (!validateAndSanitize.uuid(projectId)) {
      return {
        status: 'error',
        message: 'Invalid project ID format',
      }
    }

    // Check if user is the creator (only creators can delete projects per RLS)
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('creator_id, project_cover')
      .eq('id', projectId)
      .single()

    if (projectError || !projectData) {
      const appError = ErrorHandler.handleSupabaseError(
        projectError || { message: 'Project not found' },
        'deleteProject:checkProject',
        userId
      )
      return {
        status: 'error',
        message: 'Project not found or access denied',
      }
    }

    if (projectData.creator_id !== user.id) {
      return {
        status: 'error',
        message: 'Only the project creator can delete the project',
      }
    }

    // Delete project cover from storage if it exists
    if (projectData.project_cover) {
      try {
        const coverPath = `${projectId}/projectcover`
        await supabase.storage
          .from('project-covers')
          .remove([coverPath])
      } catch (storageError) {
        // Log but don't fail the deletion
        const appError = ErrorHandler.handleUnknownError(
          storageError,
          'deleteProject:deleteCover',
          userId
        )
        ErrorHandler.logError(appError)
      }
    }

    // Delete the project (cascading will handle related data)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (deleteError) {
      const appError = ErrorHandler.handleSupabaseError(
        deleteError,
        'deleteProject:deleteProject',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    revalidatePath('/dashboard/overview')
    revalidatePath('/dashboard/projects')

    return {
      status: 'deleted',
      message: 'Project deleted successfully',
    }
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'deleteProject', userId)
    return {
      status: 'error',
      message: ErrorHandler.createUserFriendlyMessage(appError),
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
}): Promise<ActionResponse> {
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
        'uploadProjectCover'
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    userId = user.id

    if (!validateAndSanitize.uuid(project_id)) {
      return {
        status: 'error',
        message: 'Invalid project ID format',
      }
    }

    // Check permissions
    const { data: projectAccess, error: accessError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', project_id)
      .eq('user_id', user.id)
      .single()

    if (accessError || !projectAccess || projectAccess.role === 'VIEWER') {
      return {
        status: 'error',
        message: 'You do not have permission to update this project cover',
      }
    }

    // Handle URL-based cover update
    if (url) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ project_cover: url.trim() })
        .eq('id', project_id)

      if (updateError) {
        const appError = ErrorHandler.handleSupabaseError(
          updateError,
          'uploadProjectCover:updateUrl',
          userId
        )
        return {
          status: 'error',
          message: ErrorHandler.createUserFriendlyMessage(appError),
        }
      }

      revalidatePath('/dashboard/overview')
      revalidatePath(`/dashboard/projects/${project_id}`)
      return {
        status: 'updated',
        message: 'Project cover updated successfully',
      }
    }

    // Handle file-based cover upload
    if (!file || file.size === 0) {
      return {
        status: 'error',
        message: 'No file provided',
      }
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    
    if (file.size > maxSize) {
      return {
        status: 'error',
        message: 'Cover image must be smaller than 10MB',
      }
    }
    
    if (!allowedTypes.includes(file.type)) {
      return {
        status: 'error',
        message: 'Cover image must be JPEG, PNG, or WebP format',
      }
    }

    // Upload the file to Supabase storage
    const fileExt = file.name.split('.').pop()
    const filePath = `${project_id}/projectcover.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-covers')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: 'no-cache',
      })

    if (uploadError) {
      const appError = ErrorHandler.handleSupabaseError(
        uploadError,
        'uploadProjectCover:uploadFile',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    // Get the public URL of the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from('project-covers').getPublicUrl(uploadData.path)

    // Update the project with the new cover URL
    const { error: updateError } = await supabase
      .from('projects')
      .update({ project_cover: publicUrl })
      .eq('id', project_id)

    if (updateError) {
      const appError = ErrorHandler.handleSupabaseError(
        updateError,
        'uploadProjectCover:updateProject',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    revalidatePath('/dashboard/overview')
    revalidatePath(`/dashboard/projects/${project_id}`)

    return {
      status: 'updated',
      message: 'Project cover uploaded successfully',
    }
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'uploadProjectCover', userId)
    return {
      status: 'error',
      message: ErrorHandler.createUserFriendlyMessage(appError),
    }
  }
}

export async function addProjectMember(
  projectId: string,
  userEmail: string,
  role: 'VIEWER' | 'MEMBER' | 'ADMIN' = 'MEMBER'
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
        'addProjectMember'
      )
      ErrorHandler.logError(appError)
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    userId = user.id

    if (!validateAndSanitize.uuid(projectId)) {
      return {
        status: 'error',
        message: 'Invalid project ID format',
      }
    }

    const sanitizedEmail = validateAndSanitize.email(userEmail)

    // Check if current user has permission to add members
    const { data: currentUserRole, error: roleError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !currentUserRole || currentUserRole.role === 'VIEWER') {
      return {
        status: 'error',
        message: 'You do not have permission to add members to this project',
      }
    }

    // Find the user to add
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', sanitizedEmail)
      .single()

    if (userError || !targetUser) {
      return {
        status: 'error',
        message: 'User not found with that email address',
      }
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', targetUser.id)
      .single()

    if (existingMember) {
      return {
        status: 'error',
        message: 'User is already a member of this project',
      }
    }

    // Add the member
    const { error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: targetUser.id,
        role,
      })

    if (insertError) {
      const appError = ErrorHandler.handleSupabaseError(
        insertError,
        'addProjectMember:insertMember',
        userId
      )
      return {
        status: 'error',
        message: ErrorHandler.createUserFriendlyMessage(appError),
      }
    }

    revalidatePath(`/dashboard/projects/${projectId}`)

    return {
      status: 'created',
      message: 'Member added to project successfully',
    }
  } catch (error) {
    const appError = ErrorHandler.handleUnknownError(error, 'addProjectMember', userId)
    return {
      status: 'error',
      message: ErrorHandler.createUserFriendlyMessage(appError),
    }
  }
}
