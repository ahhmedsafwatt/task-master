import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { FileInput } from '@/components/ui/file-input'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { UrlInput } from '@/components/ui/url-input'
import { projectKeys } from '@/hooks/use-projects'
import { ActionResponse } from '@/lib/types/types'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
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
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const [uploadCover, setUploadCover] = useState<{
    url?: string
    file?: File
    type: 'file' | 'url'
  } | null>(null)

  useEffect(() => {
    const { message, status, data } = createProjectResponse

    if (status === 'error' && message) {
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

      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      onSuccessAction()

      // Reset form state
      setUploadCover(null)
      formRef.current?.reset()
    }

    return () => {
      createProjectResponse.status = 'idle'
      createProjectResponse.message = null
      createProjectResponse.errors = undefined
    }
  }, [createProjectResponse, onSuccessAction, queryClient])

  const handleSubmit = (formData: FormData) => {
    // Add cover data to FormData based on type
    if (uploadCover?.type === 'url' && uploadCover.url) {
      formData.append('cover_url', uploadCover.url)
    } else if (uploadCover?.type === 'file' && uploadCover.file) {
      formData.append('cover_file', uploadCover.file)
    }

    createProjectAction(formData)
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col justify-start gap-4"
    >
      <DialogTitle className="font-geist-mono text-base font-semibold md:text-lg">
        Create New Project
      </DialogTitle>
      <div className="flex items-center justify-between">
        <div className="relative h-16 w-24 overflow-hidden rounded-lg md:h-24 md:w-40">
          <Popover>
            <PopoverTrigger asChild>
              <Avatar className="size-full rounded-none p-0">
                <AvatarImage
                  src={uploadCover?.url || ''}
                  alt="Project Cover"
                  className="object-cover"
                />
                <AvatarFallback className="hover:bg-accent/80 bg-accent font-geist-mono rounded-none text-lg transition-colors duration-300">
                  {uploadCover ? '' : 'Cover'}
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={14}
              className="bg-card flex h-48 w-72 max-w-sm flex-col gap-5 py-6 md:w-96"
            >
              <FileInput
                onFileSelect={(file) => {
                  setUploadCover({
                    url: URL.createObjectURL(file),
                    file: file,
                    type: 'file',
                  })
                }}
                acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                maxFileSize={5}
                hideLabels={true}
                className="bg-accent"
                id="project_cover"
              />
              <UrlInput
                hideLabels={true}
                onUrlSelect={(url) => {
                  setUploadCover({
                    url: url,
                    type: 'url',
                  })
                }}
                inputclassName="bg-accent"
                buttonClassName="bg-background"
              />
              <div className="text-muted-foreground mt-auto text-sm">
                image/jpeg, image/png, image/webp • Max 5MB
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Input
          name="name"
          placeholder="Project Title"
          className={cn(
            `font-geist-mono h-full border-none text-lg font-semibold shadow-none focus-visible:ring-0 md:text-2xl`,
            createProjectResponse.errors?.name &&
              'placeholder:text-destructive animate-shake',
          )}
          autoComplete="off"
        />
      </div>
      <Input
        name="description"
        placeholder="Project Description"
        className="font-geist-mono h-full border-none px-0 py-2 text-sm font-semibold shadow-none focus-visible:ring-0 md:text-lg"
        autoComplete="off"
      />

      <Button variant={'main'} disabled={isPending} className="w-28 text-white">
        {isPending ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  )
}
