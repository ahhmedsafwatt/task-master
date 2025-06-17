'use client'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useCreateTaskForm } from '@/hooks/use-create-task-form'
import { ActionResponse } from '@/lib/types/types'
import { Separator } from '@/components/ui/separator'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { PrivateTaskCheckbox } from './overview-task-private'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TaskAttributs } from './task-attributes'

// Task form component
export const OverviewCreateTaskForm = ({
  createTaskAction,
  isPending,
  onSuccessAction,
  createTaskResponse,
}: {
  createTaskResponse: ActionResponse
  createTaskAction: (payload: FormData) => void
  isPending: boolean
  onSuccessAction: () => void
}) => {
  const { formData, updateFormDataFields, resetFormData } = useCreateTaskForm()

  // Handle server action responses
  useEffect(() => {
    const { message, status, data } = createTaskResponse

    if (status === 'error' && message) {
      toast.error(message)
    }

    if (status === 'created' && data?.taskId) {
      toast.success('Task created successfully!', {
        description: (
          <Link
            href={`/dashboard/${data.taskId}`}
            className="text-blue-500 underline hover:text-blue-600"
          >
            View task
          </Link>
        ),
      })

      resetFormData()
      onSuccessAction()
    }

    return () => {
      createTaskResponse.status = 'idle'
      createTaskResponse.message = null
      createTaskResponse.errors = undefined
    }
  }, [createTaskResponse, onSuccessAction])

  return (
    <form
      className="flex min-h-0 flex-col justify-between overflow-hidden"
      action={createTaskAction}
    >
      {/* Task Title */}
      <DialogHeader className="mb-4">
        <DialogTitle>
          <Input
            type="text"
            id="task-title"
            name="title"
            placeholder="Task title"
            className={cn(
              'text-2xl! h-14 text-pretty rounded-md border-0 p-2 font-bold shadow-none ring-0 selection:bg-[#373b67] placeholder:text-2xl focus-visible:ring-0',
              createTaskResponse.errors?.title &&
                'placeholder:text-destructive animate-shake',
            )}
            autoFocus
            value={formData.title ?? ''}
            onChange={(e) => updateFormDataFields('title', e.target.value)}
          />
        </DialogTitle>
      </DialogHeader>

      <TaskAttributs
        formData={formData}
        updateFormDataFields={updateFormDataFields}
      />
      {/* Markdown Description */}
      <Textarea
        placeholder="what do you want to accomplish?"
        name="markdown_content"
        value={formData.markdown_content || ''}
        onChange={(e) =>
          updateFormDataFields('markdown_content', e.target.value)
        }
        className="dark:bg-secondary bg-secondary mt-3 h-60 min-h-[100px] resize-none overflow-y-auto text-pretty border-none px-2 pb-3 pt-0 shadow-none ring-0 selection:bg-[#373b67] focus:outline-none focus:ring-0 focus-visible:ring-0"
      />

      <Separator className="my-4" />

      <div className="flex items-center justify-end">
        {/* Private Task Checkbox */}
        <PrivateTaskCheckbox
          isPrivate={formData.is_private!}
          onCheckedChange={(checked) => {
            updateFormDataFields('is_private', checked)

            if (checked) {
              updateFormDataFields('project_id', null)
              updateFormDataFields('assignee_ids', [])
              updateFormDataFields('project_name', '')
            }
          }}
        />

        <input
          type="hidden"
          name="is_private"
          value={formData.is_private ? 'true' : 'false'}
        />

        <Button
          variant={'main'}
          disabled={isPending}
          className="w-28 text-white"
        >
          {isPending ? 'Creating...' : 'Create task'}
        </Button>
      </div>
    </form>
  )
}
