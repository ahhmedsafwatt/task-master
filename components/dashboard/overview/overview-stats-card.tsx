'use client'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatsCardProps } from '@/lib/types/types'

export const StatsCard = ({
  title,
  description,
  icon: Icon,
}: StatsCardProps) => {
  return (
    <Card
      className={
        'from-secondary to-accent min-w-[180px] grow bg-gradient-to-b py-4 shadow-md'
      }
    >
      <CardHeader className="flex flex-col">
        <CardTitle className="flex flex-row items-center gap-2 text-xl font-medium">
          {Icon && Icon}
          {title}
        </CardTitle>
        <CardDescription className="font-geist-mono flex items-center gap-3 text-xs font-medium">
          <span>{description}</span>
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
