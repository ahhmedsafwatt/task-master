import 'server-only'
import { createSupabaseClient } from '@/utils/supabase/server'
import { cache } from 'react'

/**
 * Get Profile data
 * fetches the user profile data from the database
 */
export const getProfile = cache(async () => {
  try {
    const supabase = await createSupabaseClient()
    const { data: userData, error: userError } =
      await supabase.auth.getSession()

    if (userError && !userData.session) {
      console.error('User error:', userError)
      return { data: null, error: userError }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('id', userData.session?.user.id as string)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Get profile error:', error)
    return { data: null, error: { message: 'Failed to fetch profile', error } }
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
    console.error('Get session error:', error)
    return { data: null, error }
  }
})

/**
 * Get all related Project |
 * fetches all projects from the database if you don't have rls enabled you would have to pass a user_id as a comparison value
 */
export const getProjects = cache(async (limit = 4) => {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('projects')
      .select()
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Supabase query error:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in getProjects:', error)
    return { data: null, error }
  }
})

export const getProjectwithMembers = cache(async (limit = 4) => {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        project_members:project_members(
          user_id,
          role,
          joined_at,
          profiles:profiles(id, username, avatar_url)
        )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Supabase query error:', error)
      return { data: null, error }
    }

    // Transform project_members to flatten the profile info
    const transformedData = data?.map((project) => ({
      ...project,
      project_members:
        project.project_members?.map((member: any) => ({
          id: member.profiles?.id,
          username: member.profiles?.username,
          avatar_url: member.profiles?.avatar_url,
          created_at: member.created_at,
          email: member.email,
          updated_at: member.updated_at,
        })) ?? [],
    }))

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Unexpected error in getProjects:', error)
    return { data: null, error }
  }
})

/**
 * Get all related Tasks |
 * fetches all Task from the database if you don't have rls enabled you would have to pass a user_id as a comparison value
 */
export const getTasks = cache(async (limit = 4) => {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('tasks')
      .select()
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Supabase query error:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in getTasks:', error)
    return { data: null, error }
  }
})
/**
 * Get all related Task Assingees |
 * fetches all Task Assignees from the database
 * Argus: task_id - the id of the task to get assignees for
 */
export const getTaskAssignees = cache(async (limit = 4) => {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        assignees:task_assignees(
          profiles:profiles(*)
        )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Supabase query error:', error)
      return { data: null, error }
    }

    // Transform the data to match the expected format
    const transformedData = data?.map((task) => ({
      ...task,
      assignees: task.assignees.map((a: any) => a.profiles),
    }))

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Unexpected error in getTasks:', error)
    return { data: null, error }
  }
})
