import { MultiSelectAssignees } from '@/components/ui/multi-select-assignees'
import { ProjectsSearchDropDown } from '@/components/ui/project-search-dropdown'
import { Enums } from '@/lib/types/database.types'
import {
  Minus,
  SignalMedium,
  SignalHigh,
  Signal,
  CircleAlert,
  CircleDashed,
  Loader,
  CircleCheck,
} from 'lucide-react'
import { TaskDatePickerField } from './overview-task-date-picker'
import { Selections } from './overview-task-selections'
import { createTaskFormData } from '@/lib/types/types'
import { toast } from 'sonner'
import { useProjects } from '@/hooks/use-projects'
import { useProjectMembers } from '@/hooks/use-project-members'

interface TaskAttributesProps {
  updateFormDataFields: <K extends keyof createTaskFormData>(
    field: K,
    value: createTaskFormData[K],
  ) => void
  formData: createTaskFormData
}

export const TaskAttributs = ({
  formData,
  updateFormDataFields,
}: TaskAttributesProps) => {
  // Query for projects
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useProjects(!formData.is_private)

  // Query for project members
  const {
    data: users = [],
    isLoading: isLoadingMembers,
    error: membersError,
  } = useProjectMembers(formData.project_id || '')

  // Handle errors with toasts
  if (projectsError) {
    toast.error('Failed to fetch projects')
  }

  if (membersError) {
    toast.error('Failed to fetch project members')
  }

  return (
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
          formData.project_id === null ||
          isLoadingMembers
        }
        onItemSelect={(value) => updateFormDataFields('assignee_ids', value)}
        isLoading={isLoadingMembers}
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
      <input type="hidden" name={'due_date'} value={formData.due_date ?? ''} />
      <input type="hidden" name={'end_date'} value={formData.end_date ?? ''} />
    </div>
  )
}
