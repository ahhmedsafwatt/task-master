'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus } from 'lucide-react'
import { useActionState, useState } from 'react'
import { OverviewCreateProjectForm } from './overview-create-project-form'
import { ActionResponse } from '@/lib/types/types'
import { createProject } from '@/lib/actions/project-actions'
import { cn } from '@/lib/utils'

export const OverviewProjectsDialog = ({
  className,
}: {
  className?: string
}) => {
  const [openDialog, setOpenDialog] = useState(false)
  const [createProjectResponse, createProjectAction, isPending] =
    useActionState<ActionResponse, FormData>(createProject, {
      status: 'idle' as const,
      message: null,
    })
  const handleSuccess = () => {
    setOpenDialog(false)
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setOpenDialog(true)}
                variant={'main'}
                size={'smIcon'}
                aria-label="Create new task"
                className={cn('', className)}
              >
                <Plus className="text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create new Project</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className="dark:bg-secondary bg-background -translate-y-full md:max-w-3xl lg:max-w-5xl">
        <OverviewCreateProjectForm
          createProjectAction={createProjectAction}
          createProjectResponse={createProjectResponse}
          isPending={isPending}
          onSuccessAction={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
