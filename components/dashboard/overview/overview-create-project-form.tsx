import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ActionResponse } from '@/lib/types/types'
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const OverviewCreateProjectForm = ({
  createProjectAction,
  createProjectResponse,
  isPending,
  onSuccessAction,
}: {
  createProjectAction: (payload: FormData) => void
  createProjectResponse: ActionResponse
  isPending: boolean
  onSuccessAction: () => void
}) => {
  // Handle server action responses
  useEffect(() => {
    const { message, status, data, errors } = createProjectResponse

    if (status === 'error' && message && errors) {
      toast.error(errors[Object.keys(errors)[0]]?.[0] || message)
    }
    if (status === 'error' && message && !errors) {
      toast.error(message)
    }

    if (status === 'created' && data?.projectId) {
      toast.success('Project created successfully!', {
        description: (
          <Link
            href={`/dashboard/${data.projectId}`}
            className="text-blue-500 underline hover:text-blue-600"
          >
            View Project
          </Link>
        ),
      })

      onSuccessAction()
    }

    return () => {
      createProjectResponse.status = 'idle'
      createProjectResponse.message = null
      createProjectResponse.errors = undefined
    }
  }, [createProjectResponse, onSuccessAction])

  return (
    <form action={createProjectAction} className="flex flex-col gap-4">
      <DialogTitle className="text-lg font-semibold">
        Create New Project
      </DialogTitle>
      <Input name="name" placeholder="Project Title" />
      <Input name="project_cover" placeholder="Project cover" />
      <Input name="description" placeholder="Project Description" />

      <Button variant={'main'} disabled={isPending} className="w-28 text-white">
        {isPending ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  )
}
