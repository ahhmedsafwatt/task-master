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
import { getProjects, getProjectMembers } from '@/lib/server/project-actions'
import { userProfile, Projects, createTaskFormData } from '@/lib/types/types'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

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
  const [users, setUsers] = useState<userProfile[]>([])
  const [projects, setProjects] = useState<Projects[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  //   const [showAttributes, setShowAttributes] = useState<boolean>(true)

  // Fetch projects on component mount
  useEffect(() => {
    if (formData.is_private === true) {
      setProjects([])
      setIsLoadingProjects(false)
      return
    }
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
  }, [formData.is_private])

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
      <input type="hidden" name={'due_date'} value={formData.due_date ?? ''} />
      <input type="hidden" name={'end_date'} value={formData.end_date ?? ''} />
    </div>
  )
}
