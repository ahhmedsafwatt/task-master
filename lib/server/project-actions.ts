'use server'

import { createSupabaseClient } from '@/utils/supabase/server'
import { Projects, userProfile } from '../types/types'

export async function getProjects(): Promise<{
  data: Projects[] | null
  error: any
}> {
  try {
    const supabase = await createSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        data: null,
        error: 'User not authenticated',
      }
    }

    // Fetch projects with their members
    const { data: projects, error: projectsError } = await supabase
      .from('project_members')
      .select('projects(*)')
      .eq('user_id', user.id)
      .neq('role', 'VIEWER')

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return {
        data: null,
        error: projectsError,
      }
    }

    const projectList = Array.isArray(projects)
      ? projects.map((item) => item.projects)
      : []

    return {
      data: projectList as Projects[],
      error: null,
    }
  } catch (error) {
    console.error('Error in getProjectsWithMembers:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function getProjectMembers(projectId: string): Promise<{
  data: userProfile[] | null
  error: any
}> {
  try {
    const supabase = await createSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        data: null,
        error: 'User not authenticated',
      }
    }

    // Fetch project members excluding viewers
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('profiles(*)')
      .eq('project_id', projectId)
      .neq('role', 'VIEWER')

    if (membersError) {
      console.error('Error fetching project members:', membersError)
      return {
        data: null,
        error: membersError,
      }
    }

    const membersList = Array.isArray(members)
      ? members.map((item) => item.profiles)
      : []

    return {
      data: membersList as userProfile[],
      error: null,
    }
  } catch (error) {
    console.error('Error in getProjectMembers:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
