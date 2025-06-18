'use client'
import { usePathname } from 'next/navigation'
import { NavigationItem } from './navigation-item'
import Image from 'next/image'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Projects } from '@/lib/types/types'
import { OverviewProjectsDialog } from '../overview/overview-project-dialog'

interface SidebarProjectsProps {
  onItemClick?: () => void
  projects: Projects[]
}

export function SidebarProjects({
  onItemClick,
  projects,
}: SidebarProjectsProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-0 flex-col">
      <div className="text-muted-foreground mb-3 flex items-center justify-between rounded-md px-1.5 text-xs">
        <span>projects</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <OverviewProjectsDialog className="box-content size-3 p-0.5" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Create project</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="space-y-1.5 overflow-y-auto">
        {projects.map((project: Projects) => {
          const isActive = pathname === `/dashboard/projects/${project.name}`
          return (
            <NavigationItem
              href={`/dashboard/projects/${project.name}`}
              title={project.name}
              isActive={isActive}
              key={project.id + project.name}
              customIcon={
                project.project_cover ? (
                  <div className="max-h-7 max-w-8 rounded-sm">
                    {' '}
                    <Image
                      src={project.project_cover}
                      alt={project.name}
                      height={28}
                      unoptimized
                      width={32}
                      className="h-7 w-8 rounded-sm object-cover"
                    />
                  </div>
                ) : undefined
              }
              onClick={onItemClick}
            />
          )
        })}
      </div>
    </div>
  )
}
