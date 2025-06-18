'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileImage, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface ImagePreview {
  url: string
  file?: File
  method: 'url' | 'file'
}

interface PreviewCardProps {
  preview: ImagePreview
  onClear: () => void
  onCrop?: () => void
  onUpload: () => void
  isUploading: boolean
  enableCropping?: boolean
  className?: string
}

export const PreviewCard = ({
  preview,
  onClear,
  onCrop,
  onUpload,
  isUploading,
  enableCropping = true,
  className,
}: PreviewCardProps) => {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="relative">
          <Image
            src={preview.url}
            alt="Preview"
            unoptimized
            width={400}
            height={300}
            className="h-48 w-full rounded-lg object-cover"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute right-2 top-2"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 flex gap-2">
          {enableCropping && onCrop && (
            <Button
              variant="outline"
              onClick={onCrop}
              disabled={isUploading}
              className="flex-1"
            >
              <FileImage className="mr-2 h-4 w-4" />
              Crop & Upload
            </Button>
          )}
          <Button onClick={onUpload} disabled={isUploading} className="flex-1">
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
