'use client'
import { useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface FileInputProps {
  onFileSelect: (file: File) => void
  acceptedTypes: string[]
  maxFileSize: number
  hideLabels?: boolean
  className?: string
  id?: string
}

export const FileInput = ({
  onFileSelect,
  acceptedTypes,
  maxFileSize,
  hideLabels = false,
  className,
  id = 'file-input',
}: FileInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): boolean => {
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`File size exceeds ${maxFileSize}MB limit`)
        return false
      }
      if (!acceptedTypes.includes(file.type)) {
        toast.error(`Invalid file type. Accepted: ${acceptedTypes.join(', ')}`)
        return false
      }
      return true
    },
    [maxFileSize, acceptedTypes],
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!validateFile(file)) {
      event.target.value = ''
      return
    }
    onFileSelect(file)
  }

  return (
    <div className={className}>
      {!hideLabels && <Label htmlFor={id}>Select File</Label>}
      <Input
        id={id}
        type="file"
        name={id}
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedTypes.join(',')}
        className="cursor-pointer"
      />
      {!hideLabels && (
        <p className="text-muted-foreground text-sm">
          {acceptedTypes.join(', ')} • Max {maxFileSize}MB
        </p>
      )}
    </div>
  )
}
