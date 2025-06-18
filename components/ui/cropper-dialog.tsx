'use client'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'
import { Dialog, DialogContent } from './dialog'

interface CropperDialogProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onCrop: (file: File) => Promise<void>
  aspectRatio?: number
  cropWidth?: number
  cropHeight?: number
  isProcessing?: boolean
}

export const CropperDialog = ({
  isOpen,
  onClose,
  imageUrl,
  onCrop,
  aspectRatio = 1,
  cropWidth = 400,
  cropHeight = 400,
  isProcessing = false,
}: CropperDialogProps) => {
  const cropperRef = useRef<HTMLImageElement>(null)

  const handleCrop = async () => {
    if (!cropperRef.current) return

    try {
      const cropper = (cropperRef.current as any).cropper
      const canvas = cropper.getCroppedCanvas({
        width: cropWidth,
        height: cropHeight,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      })

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b: Blob) => {
            if (b) resolve(b)
            else reject(new Error('Canvas is empty'))
          },
          'image/jpeg',
          0.9,
        )
      })

      const croppedFile = new File([blob], 'cropped-image.jpg', {
        type: 'image/jpeg',
      })

      await onCrop(croppedFile)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to process image',
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="mt-4">
          <Cropper
            src={imageUrl}
            style={{ height: 300, width: '100%' }}
            initialAspectRatio={aspectRatio}
            aspectRatio={aspectRatio}
            guides={false}
            viewMode={1}
            ref={cropperRef}
            dragMode="move"
            cropBoxMovable={true}
            cropBoxResizable={true}
            autoCropArea={1}
            highlight={false}
            background={false}
            responsive={true}
            checkOrientation={false}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
