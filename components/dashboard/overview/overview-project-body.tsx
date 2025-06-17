import { getProjectwithMembers } from '@/lib/data/queries'
import { OverviewProjectItem } from './overview-project-item'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const OverviewProjectsBody = async () => {
  const { data: projects, error } = await getProjectwithMembers()

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
    <>
      <div className="flex flex-col gap-6">
        {projects?.map((project) => (
          <OverviewProjectItem
            key={project.id}
            title={project.name}
            project_cover={
              project.project_cover ?? '/placeholder.svg?height=32&width=32'
            }
            project_members={project.project_members}
            description={project.description ?? ''}
          />
        ))}
      </div>
      <Button asChild variant="inverted" className="mt-5 w-full">
        <Link href="/dashboard/projects">
          View all projects ({projects?.length})
        </Link>
      </Button>
    </>
  )
}
