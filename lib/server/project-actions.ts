// 'use server'

// import { createSupabaseClient } from '@/utils/supabase/server'
// import { Projects, userProfile } from '../types/types'

// export async function getProjects(): Promise<{
//   data: Projects[] | null
//   error: any
// }> {
//   try {
//     const supabase = await createSupabaseClient()

//     // Get authenticated user
//     const {
//       data: { user },
//     } = await supabase.auth.getUser()
//     if (!user) {
//       return {
//         data: null,
//         error: 'User not authenticated',
//       }
//     }

//     // Fetch projects with their members
//     const { data: projects, error: projectsError } = await supabase
//       .from('projects')
//       .select(
//         `
//           *,
//           project_members!inner(
//           role, user_id
//           )
//         `,
//       )
//       .eq('project_members.user_id', user.id)
//       .neq('project_members.role', 'VIEWER')

//     if (projectsError) {
//       console.error('Error fetching projects:', projectsError)
//       return {
//         data: null,
//         error: projectsError,
//       }
//     }

//     return {
//       data: projects as Projects[],
//       error: null,
//     }
//   } catch (error) {
//     console.error('Error in getProjectsWithMembers:', error)
//     return {
//       data: null,
//       error: error instanceof Error ? error.message : 'Unknown error occurred',
//     }
//   }
// }

// export async function getProjectMembers(projectId: string): Promise<{
//   data: userProfile[] | null
//   error: any
// }> {
//   try {
//     const supabase = await createSupabaseClient()

//     // Fetch project members excluding viewers
//     const { data: members, error: membersError } = await supabase
//       .from('profiles')
//       .select(
//         `*, project_members!inner(
//           role, user_id)`,
//       )
//       .eq('project_members.project_id', projectId)

//     if (membersError) {
//       console.error('Error fetching project members:', membersError)
//       return {
//         data: null,
//         error: membersError,
//       }
//     }

//     return {
//       data: members as userProfile[],
//       error: null,
//     }
//   } catch (error) {
//     console.error('Error in getProjectMembers:', error)
//     return {
//       data: null,
//       error: error instanceof Error ? error.message : 'Unknown error occurred',
//     }
//   }
// }

// moved to api routes insead of server actions still to implement it with reactquery
