import { useMemo, useRef, useState, useEffect } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils/utils'
import { AttrbuiteLable } from '../dashboard/overview/overview-task-attrubites-lable'
import { Box, Loader2 } from 'lucide-react'
import { Projects } from '@/lib/types/types'

interface ProjectsSearchDropDownProps {
  projects: Projects[]
  label: string
  placeholder: string
  onProjectSelect: (update: {
    project_id: string
    project_name: string
  }) => void
  disabled?: boolean
  initialSelectedProjectId?: string // Optional prop to set initial selected project
  isLoading?: boolean
}

export const ProjectsSearchDropDown = ({
  projects,
  label,
  placeholder,
  onProjectSelect,
  disabled,
  initialSelectedProjectId,
  isLoading = false,
}: ProjectsSearchDropDownProps) => {
  const [searchDropDown, setSearchDropDown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialSelectedProjectId || '',
  )

  const dropDownRef = useRef<HTMLDivElement>(null)

  // Set initial search query based on selected project
  useEffect(() => {
    if (initialSelectedProjectId) {
      const initialProject = projects.find(
        (project) => project.id === initialSelectedProjectId,
      )
      if (initialProject) {
        setSearchQuery(initialProject.name)
      }
    }
  }, [initialSelectedProjectId, projects])

  const filteredProjects = useMemo(
    () =>
      searchQuery.trim() === ''
        ? projects
        : projects.filter((project) =>
            project.name?.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
    [searchQuery, projects],
  )

  // Handle input change to check if selected project name is modified
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)

    const selectedProject = projects.find(
      (project) => project.id === selectedProjectId,
    )

    // If we have a selected project and the input no longer matches it exactly
    if (
      selectedProject &&
      selectedProjectId &&
      newValue !== selectedProject.name
    ) {
      setSelectedProjectId('')
      onProjectSelect({
        project_id: '',
        project_name: '',
      })
    }
  }

  const handleProjectSelect = (project: Projects) => {
    setSelectedProjectId(project.id)
    setSearchQuery(project.name)
    onProjectSelect({
      project_id: project.id,
      project_name: project.name,
    })
    setSearchDropDown(false)
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      if (!dropDownRef.current?.contains(document.activeElement)) {
        setSearchDropDown(false)

        // Reset to selected project name if one exists, otherwise clear
        if (selectedProjectId) {
          const selectedProject = projects.find(
            (project) => project.id === selectedProjectId,
          )
          if (selectedProject) {
            setSearchQuery(selectedProject.name)
          }
        } else if (searchQuery.trim() !== '') {
          // If no project is selected but there's text, clear it
          setSearchQuery('')
        }
      }
    }, 150)
  }

  return (
    <div className="flex">
      <AttrbuiteLable label={label} icon={<Box size={18} />} />

      <div className="relative w-full">
        <Input
          type="text"
          id={label.toLowerCase()}
          autoComplete="off"
          name={label.toLowerCase()}
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setSearchDropDown(true)}
          onBlur={handleInputBlur}
          onClick={() => setSearchDropDown(true)}
          disabled={disabled || isLoading}
          className={cn(
            'h-8 w-full border-none ring-0 transition-colors focus-visible:border-none focus-visible:outline-none focus-visible:ring-0',
            searchDropDown && 'bg-accent rounded-b-none',
          )}
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        <div
          ref={dropDownRef}
          id={`${label}-listbox`}
          role="listbox"
          className={cn(
            'bg-card absolute right-0 top-full z-10 max-h-40 w-full overflow-auto rounded-md rounded-t-none shadow-lg transition-all duration-75',
            searchDropDown
              ? 'visible scale-100'
              : 'pointer-events-none invisible opacity-0',
          )}
        >
          {isLoading ? (
            <div className="text-muted-foreground flex h-20 items-center justify-center text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading projects...</span>
            </div>
          ) : projects.length > 0 ? (
            filteredProjects.map((project) => (
              <div
                tabIndex={0}
                key={project.id}
                className="hover:bg-accent focus:bg-accent cursor-pointer px-3 py-2 text-sm"
                onMouseDown={() => {
                  // Use onMouseDown to fire before onBlur
                  handleProjectSelect(project)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleProjectSelect(project)
                  }
                }}
                aria-label={`Select item ${project.name}`}
              >
                <div>{project.name}</div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground flex h-20 items-center justify-center text-sm">
              <span>No projects found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
