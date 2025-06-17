import { getProjects } from '@/lib/data/queries'

export const OverviewProjectsBody = async () => {
  const { data: projects, error } = await getProjects()

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Unable to load tasks at this time
        </p>
      </div>
    )
  }

  if (projects?.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">No projects found</p>
        <p className="text-muted-foreground text-xs">
          Create your first project to get started
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-2">
        {projects?.map((project) => (
          <div key={project.id} className="rounded border p-4">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <p className="text-muted-foreground text-sm">
              {project.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
