'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { createTask } from '@/lib/actions/task-actions'
import { ActionResponse } from '@/lib/types/types'
import { Plus } from 'lucide-react'
import { useState, useActionState } from 'react'
import { OverviewCreateTaskForm } from './overview-create-task-form'

// Main component
export const OverviewTasksDialog = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [createTaskResponse, createTaskAction, isPending] = useActionState<
    ActionResponse,
    FormData
  >(createTask, {
    status: 'idle',
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
                variant={'main'}
                size={'smIcon'}
                disabled={isPending}
                onClick={() => setOpenDialog(true)}
                aria-label="Create new task"
              >
                <Plus className="text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create new task</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className="dark:bg-secondary bg-background max-h-[calc(100%-3rem)] w-full gap-0 overflow-auto md:max-h-[calc(100%-1.5rem)] md:max-w-3xl lg:max-w-5xl">
        <OverviewCreateTaskForm
          createTaskResponse={createTaskResponse}
          createTaskAction={createTaskAction}
          isPending={isPending}
          onSuccessAction={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
