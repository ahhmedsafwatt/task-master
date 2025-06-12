import { useQuery } from '@tanstack/react-query'
import { projectKeys } from './use-projects'
import { userProfile } from '@/lib/types/types'

// Fetch project members function
const fetchProjectMembers = async (projectId: string) => {
  const response = await fetch(`/api/projects/${projectId}/members`)
  const { data, error } = await response.json()
  if (error) throw new Error(error)
  return data as userProfile[]
}

export const useProjectMembers = (projectId: string) => {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: () => fetchProjectMembers(projectId),
    enabled: !!projectId,
  })
}
