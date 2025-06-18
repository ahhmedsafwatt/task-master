'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface UrlInputProps {
  onUrlSelect: (url: string) => void
  hideLabels?: boolean
  className?: string
  id?: string
}

export const UrlInput = ({
  onUrlSelect,
  hideLabels = false,
  className,
  id = 'url-input',
}: UrlInputProps) => {
  const [urlInput, setUrlInput] = useState('')
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)

  const handleUrlPreview = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid URL')
      return
    }
    setIsLoadingUrl(true)
    try {
      const url = new URL(urlInput)
      const response = await fetch(url.toString(), { method: 'HEAD' })
      if (!response.ok) throw new Error('Unable to access the image URL')

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('URL does not point to an image')
      }

      onUrlSelect(urlInput)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid image URL')
    } finally {
      setIsLoadingUrl(false)
    }
  }

  return (
    <div className={className}>
      {!hideLabels && <Label htmlFor={id}>Image URL</Label>}
      <div className="flex gap-2">
        <Input
          id={id}
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="flex-1"
        />
        <Button
          onClick={handleUrlPreview}
          disabled={isLoadingUrl || !urlInput.trim()}
        >
          {isLoadingUrl ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
