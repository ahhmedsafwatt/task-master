import { useState } from 'react'
import { AttrbuiteLable } from './overview-task-attrubites-lable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils/utils'

// Priority and Status selection component
export const Selections = ({
  label,
  icon: Icon,
  options,
  updateFormData,
  defaultValue,
}: {
  label: string
  defaultValue?: string
  icon: React.ReactNode
  options: { option: string; icon: React.ReactNode }[]
  updateFormData: (field: string, value: any) => void
}) => {
  const [selectedValue, setSelectedValue] = useState<string>()
  const [open, setOpen] = useState<boolean>()

  return (
    <div className="flex gap-2">
      <AttrbuiteLable label={label.toLowerCase()} icon={Icon} />
      <Select
        open={open}
        onOpenChange={setOpen}
        name={label.toLowerCase()}
        value={selectedValue || defaultValue}
        onValueChange={(value) => {
          setSelectedValue(value)
          updateFormData(label.toLowerCase(), value)
        }}
      >
        <SelectTrigger
          className={cn(
            'hover:bg-accent dark:hover:bg-accent dark:focus-visible:bg-accent w-full border-none bg-transparent dark:bg-transparent',
            open && 'bg-accent dark:bg-accent',
          )}
          id={label.toLowerCase()}
        >
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent className="bg-card">
          {options.map((opt) => (
            <SelectItem key={opt.option} value={opt.option}>
              <span>{opt.icon}</span>
              <span>{opt.option}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
