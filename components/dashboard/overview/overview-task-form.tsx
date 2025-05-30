'use client'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MultiSelectAssignees } from '@/components/ui/multi-select-assignees'
import { ProjectsSearchDropDown } from '@/components/ui/project-search-dropdown'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useCreateTaskForm } from '@/hooks/use-create-task-form'
import { Enums } from '@/lib/types/database.types'
import { Projects, TaskResponse, userProfile } from '@/lib/types/types'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { TaskDatePickerField } from './overview-task-date-picker'
import { PrivateTaskCheckbox } from './overview-task-private'
import { Selections } from './overview-task-selections'
import {
  Minus,
  SignalMedium,
  SignalHigh,
  Signal,
  CircleDashed,
  Loader,
  CircleCheck,
  CircleAlert,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getProjectMembers, getProjects } from '@/lib/server/project-actions'

// Task form component
export const TaskForm = ({
  createTaskAction,
  isPending,
  onSuccessAction,
  createTaskResponse,
}: {
  createTaskResponse: TaskResponse
  createTaskAction: any
  isPending: boolean
  onSuccessAction: () => void
}) => {
  const { formData, updateFormDataFields, resetFormData } = useCreateTaskForm()

  const [users, setUsers] = useState<userProfile[]>([])
  const [projects, setProjects] = useState<Projects[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await getProjects()
        if (error) {
          toast.error('Failed to fetch projects')
          return
        }
        if (data) {
          setProjects([...data])
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
        toast.error('Failed to fetch projects')
      } finally {
        setIsLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [])

  // Fetch project members when a project is selected
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!formData.project_id) {
        setUsers([])
        return
      }

      try {
        const { data, error } = await getProjectMembers(formData.project_id)
        if (error) {
          toast.error('Failed to fetch project members')
          return
        }
        if (data) {
          setUsers([...data])
        }
      } catch (error) {
        console.error('Error fetching project members:', error)
        toast.error('Failed to fetch project members')
      }
    }

    fetchProjectMembers()
  }, [formData.project_id])

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
    // for featuer me you might want to delete these.
    setProjects([])
    setUsers([])

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

      {/* Form Fields Grid */}
      <div className="flex flex-col gap-3.5">
        {/* Project Selection */}
        <ProjectsSearchDropDown
          projects={projects}
          label="Project"
          onProjectSelect={(update) => {
            updateFormDataFields('project_id', update.project_id)
            updateFormDataFields('project_name', update.project_name)
          }}
          placeholder="Search projects..."
          disabled={!!formData.is_private}
          initialSelectedProjectId={
            formData.project_id ? formData.project_id : undefined
          }
          isLoading={isLoadingProjects}
        />

        <input
          type="hidden"
          name="project_id"
          value={formData.project_id ?? ''}
        />
        <input
          type="hidden"
          name="project_name"
          value={formData.project_name ?? ''}
        />
        {/* Priority and Status */}
        <Selections
          label="Priority"
          icon={<Minus size={18} />}
          defaultValue={formData.priority as Enums<'task_priority'>}
          options={[
            { option: 'LOW', icon: <SignalMedium size={18} /> },
            { option: 'MEDIUM', icon: <SignalHigh size={18} /> },
            {
              option: 'HIGH',
              icon: <Signal size={18} />,
            },
            {
              option: 'URGENT',
              icon: <CircleAlert size={18} />,
            },
          ]}
          updateFormData={(field, value) =>
            updateFormDataFields(field as 'priority', value)
          }
        />
        <Selections
          label="Status"
          defaultValue={formData.status as Enums<'task_status'>}
          icon={<Minus size={18} />}
          options={[
            {
              option: 'BACKLOG',
              icon: <CircleDashed />,
            },
            {
              option: 'IN_PROGRESS',
              icon: <Loader className="text-in-progress" />,
            },
            {
              option: 'COMPLETED',
              icon: <CircleCheck className="text-success" />,
            },
          ]}
          updateFormData={(field, value) =>
            updateFormDataFields(field as 'status', value)
          }
        />

        <MultiSelectAssignees
          users={users}
          label="Assignees"
          placeholder="search user assign..."
          maxDisplayItems={3}
          disabled={
            !!formData.is_private ||
            formData.project_id === '' ||
            formData.project_id === null
          }
          onItemSelect={(value) => updateFormDataFields('assignee_ids', value)}
        />

        <input
          type="hidden"
          name="assignee_ids"
          value={JSON.stringify(formData.assignee_ids)}
        />
        <TaskDatePickerField
          id="due_date"
          label="Due Date"
          date={formData.due_date || null}
          onSelect={(update) => {
            updateFormDataFields('due_date', update.due_date)
            updateFormDataFields('end_date', update.end_date || null)
          }}
        />
        {/* Hidden input for form submission */}
        <input
          type="hidden"
          name={'due_date'}
          value={formData.due_date ?? ''}
        />
        <input
          type="hidden"
          name={'end_date'}
          value={formData.end_date ?? ''}
        />
      </div>

      {/* Markdown Description */}
      <Textarea
        placeholder="Add description (Markdown supported)..."
        name="markdown_content"
        value={formData.markdown_content || ''}
        onChange={(e) =>
          updateFormDataFields('markdown_content', e.target.value)
        }
        className="dark:bg-secondary bg-secondary mt-3 h-full max-h-[200px] min-h-[100px] resize-none text-pretty border-none px-2 pb-3 pt-0 shadow-none ring-0 selection:bg-[#373b67] focus:outline-none focus:ring-0 focus-visible:ring-0"
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
