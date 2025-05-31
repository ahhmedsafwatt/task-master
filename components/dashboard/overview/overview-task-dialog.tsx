'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { createTask } from '@/lib/server/task-actions'
import { TaskResponse } from '@/lib/types/types'
import { Plus } from 'lucide-react'
import { useState, useActionState } from 'react'
import { TaskForm } from './overview-task-form'

// Main component
export const OverViewTasksDialog = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [createTaskResponse, createTaskAction, isPending] = useActionState<
    TaskResponse,
    FormData
  >(createTask, {
    status: 'idle',
    message: null,
  })

  const handleSuccess = () => {
    setOpenDialog(false)
  }

  return (
    <Dialog
      open={openDialog}
      onOpenChange={(open) => {
        setOpenDialog(open)
        if (!open) {
          createTaskResponse.status = 'idle'
          createTaskResponse.message = null
          createTaskResponse.errors = undefined
          setOpenDialog(false)
        } else {
          createTaskResponse.status = 'idle'
          createTaskResponse.message = null
          createTaskResponse.errors = undefined
          setOpenDialog(true)
        }
      }}
    >
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
      <DialogContent className="dark:bg-secondary bg-background max-h-[calc(100%-3rem)] w-full gap-0 overflow-auto md:max-h-[calc(100%-6rem)] md:max-w-3xl lg:max-w-5xl">
        <TaskForm
          createTaskResponse={createTaskResponse}
          createTaskAction={createTaskAction}
          isPending={isPending}
          onSuccessAction={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
