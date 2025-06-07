import { cn } from '@/lib/utils/utils'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { format, formatISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { AttrbuiteLable } from './overview-task-attrubites-lable'
import { Separator } from '@/components/ui/separator'
import { DateRange } from 'react-day-picker'

export const TaskDatePickerField = ({
  id,
  label,
  date,
  onSelect,
}: {
  id: string
  label: string
  date: string | null
  onSelect: (update: { due_date: string; end_date?: string }) => void
}) => {
  const [isRange, setIsRange] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: date ? new Date(date) : undefined,
    to: undefined,
  })

  const handleClear = () => {
    onSelect({ due_date: '', end_date: '' })
    setDateRange({ from: undefined, to: undefined })
  }

  return (
    <div className="flex">
      <AttrbuiteLable label={label} icon={<CalendarIcon size={18} />} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              'hover:bg-accent font-norml w-full justify-start border-none bg-transparent text-left',
            )}
            aria-label={
              date
                ? `Selected ${label.toLowerCase()}: ${format(new Date(date), 'PPP')}`
                : `Pick a ${label.toLowerCase()}`
            }
          >
            {isRange
              ? dateRange?.from
                ? dateRange?.to
                  ? `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}`
                  : `${format(dateRange.from, 'PPP')} - Pick end date`
                : 'Pick a date range'
              : date
                ? format(new Date(date), 'PPP')
                : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" sideOffset={-140}>
          {isRange ? (
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range: DateRange | undefined) => {
                setDateRange(range)
                if (range?.from && range.to) {
                  onSelect({
                    due_date: formatISO(range.from),
                    end_date: formatISO(range.to),
                  })
                }
              }}
              initialFocus
            />
          ) : (
            <Calendar
              mode="single"
              selected={date ? new Date(date) : undefined}
              onSelect={(selectedDate: Date | undefined) => {
                onSelect({
                  due_date: selectedDate ? formatISO(selectedDate) : '',
                })
              }}
              initialFocus
            />
          )}
          <div className="px-4">
            <Separator />
            <div className="my-2 flex flex-col items-center gap-2">
              <div className="hover:bg-accent flex w-full items-center justify-between rounded-md px-2 py-1.5">
                <Label htmlFor="date-range-mode" className="text-sm">
                  Include end date
                </Label>
                <Switch
                  id="date-range-mode"
                  className="data-[state=checked]:bg-main"
                  checked={isRange}
                  onCheckedChange={setIsRange}
                />
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start px-2"
                onClick={handleClear}
              >
                clear
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
