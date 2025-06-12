// hooks/use-tasks.ts
import { Projects } from '@/lib/types/types'
import { useQuery } from '@tanstack/react-query'

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  members: (projectId: string) =>
    [...projectKeys.all, 'members', projectId] as const,
}

// Fetch projects function
const fetchProjects = async () => {
  const response = await fetch('/api/projects')
  const { data, error } = await response.json()
  if (error) throw new Error(error)
  return data as Projects[]
}

export const useProjects = (is_private = false) => {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: fetchProjects,
    enabled: is_private,
  })
}
