'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera } from 'lucide-react'
import { updateAvatar } from '@/lib/actions/profile-actions'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { FileInput } from '@/components/ui/file-input'
import { CropperDialog } from '@/components/ui/cropper-dialog'

interface ProfileAvatarProps {
  avatarUrl: string | null
  username: string | null
  id: string
}

export const ProfileAvatar = ({
  avatarUrl,
  username,
  id,
}: ProfileAvatarProps) => {
  // Get initials for avatar fallback
  const initials = username ? username.substring(0, 2).toUpperCase() : 'U'

  // State for cropping
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setCropperOpen(true)
  }

  const handleCropComplete = async (croppedFile: File) => {
    try {
      setIsUploading(true)
      toast.loading('Updating avatar...')

      const data = await updateAvatar({
        file: croppedFile,
        userId: id,
      })

      if (!data) {
        throw new Error('Failed to update avatar')
      }

      toast.dismiss()
      toast.success('Avatar updated successfully')
      setCropperOpen(false)
      setSelectedFile(null)
    } catch (error) {
      toast.dismiss()
      toast.error(
        error instanceof Error ? error.message : 'Failed to update avatar',
      )
    } finally {
      setIsUploading(false)
    }
  }

  // Create object URL for cropper
  const imageUrl = selectedFile ? URL.createObjectURL(selectedFile) : ''

  return (
    <div className="flex items-center gap-4 md:gap-6">
      <div className="relative">
        <Avatar className="size-18 md:size-24">
          <AvatarImage
            src={avatarUrl ?? ''}
            alt={username || 'User avatar'}
            className="object-cover"
          />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        {/* Hidden file input with camera trigger */}
        <div className="absolute bottom-0 right-0">
          <FileInput
            onFileSelect={handleFileSelect}
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            maxFileSize={5}
            hideLabels={true}
            className="hidden"
            id="avatar-upload"
          />
          <Label
            htmlFor="avatar-upload"
            className="bg-primary text-primary-foreground hover:bg-primary/90 block cursor-pointer rounded-full p-2"
            tabIndex={0}
            aria-label="Upload avatar"
            role="button"
          >
            <Camera className="size-3 md:size-4" />
            <span className="sr-only">Upload avatar</span>
          </Label>
        </div>
      </div>

      <div>
        <h2 className="font-geist-mono text-2xl font-bold [word-spacing:-6px]">
          Your Avatar
        </h2>
        <p className="text-muted-foreground mt-2 text-xs md:text-sm">
          JPG, WEBP or PNG. Max 5MB.
        </p>
      </div>

      {/* Cropper Dialog */}
      <CropperDialog
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false)
          setSelectedFile(null)
          if (imageUrl) URL.revokeObjectURL(imageUrl)
        }}
        imageUrl={imageUrl}
        onCrop={handleCropComplete}
        aspectRatio={1}
        cropWidth={320}
        cropHeight={320}
        isProcessing={isUploading}
      />
    </div>
  )
}
