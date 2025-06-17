import Image from 'next/image'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { userProfile } from '@/lib/types/types'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface OverviewProjectItemProps {
  id?: string
  title: string
  project_cover: string
  project_members?: userProfile[]
  description: string
}

export function OverviewProjectItem({
  title,
  project_cover,
  // id,
  project_members = [],
  description,
}: OverviewProjectItemProps) {
  return (
    <Link
      href={`/dashboard/projects/${title}`}
      className="group block"
      aria-label={`View task: ${title}`}
    >
      <div className="to-accent from-accent via-secondary relative flex rounded-xl border bg-gradient-to-r p-4 shadow-md">
        {/* Cover Image */}

        <div className="relative mr-4 overflow-hidden rounded-md">
          <Image
            src={project_cover}
            alt={title}
            unoptimized
            width={160}
            height={120}
            className="h-30 w-40 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        {/* Content */}
        <div className="flex w-full justify-between gap-2">
          <div className="flex h-full w-full flex-1 flex-col">
            <h3
              className="text-foreground line-clamp-1 truncate text-xl font-bold group-hover:underline"
              title={title}
            >
              {title}
            </h3>
            {description && (
              <p className="text-muted-foreground sm:max-w-2xs max-w-30 line-clamp-3 text-sm">
                {description}
              </p>
            )}
          </div>
          {/* Members */}
          {project_members.length > 0 && (
            <div className="absolute bottom-4 right-4 flex -space-x-3">
              {project_members.slice(0, 5).map((member) => (
                <TooltipProvider key={member.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="border-background relative h-7 w-7 hover:z-50">
                        <AvatarImage
                          src={member.avatar_url || '/placeholder.svg'}
                          alt={member.username || 'User'}
                        />
                        <AvatarFallback className="text-xs">
                          {member.username?.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{member.username || member.email}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {project_members.length > 5 && (
                <div className="bg-muted border-background ml-1 flex h-7 w-7 items-center justify-center rounded-full">
                  <span className="text-muted-foreground text-xs font-medium">
                    +{project_members.length - 5}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
