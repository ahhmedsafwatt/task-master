import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ReactNode } from 'react'

interface NavigationItemProps {
  href: string
  customIcon?: ReactNode
  title: string
  isActive?: boolean
  onClick?: () => void
}

export function NavigationItem({
  href,
  customIcon,
  title,
  isActive = false,
  onClick,
}: NavigationItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'hover:bg-accent hover:text-secondary-foreground flex items-center justify-between rounded-md px-2 py-1.5 transition-colors',
        {
          'bg-primary hover:bg-primary text-primary-foreground font-semibold shadow':
            isActive,
        },
      )}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={cn('mr-1.5', isActive ? 'opacity-100' : 'opacity-75')}>
          {customIcon}
        </div>
        <span className="line-clamp-1 text-sm">{title}</span>
      </div>
    </Link>
  )
}
