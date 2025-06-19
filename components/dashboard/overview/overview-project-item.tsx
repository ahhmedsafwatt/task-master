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
      <div className="to-accent from-accent via-secondary relative flex min-h-36 overflow-hidden rounded-xl border bg-gradient-to-r p-4 shadow-md">
        {/* Cover Image */}

        {project_cover && (
          <div className="h-30 relative mr-4 min-w-24 overflow-hidden rounded-md md:min-w-40">
            <Image
              src={project_cover}
              alt={title}
              unoptimized
              width={200}
              height={120}
              className="h-30 w-28 object-cover transition-transform duration-300 group-hover:scale-105 md:w-40"
            />
          </div>
        )}
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
              <p className="text-muted-foreground line-clamp-3 max-w-36 text-sm sm:max-w-xs">
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
                          src={member.avatar_url!}
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
