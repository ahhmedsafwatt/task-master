import { Tables } from '@/lib/types/database.types'
import { ReactNode } from 'react'

export interface AuthResponse {
  status: 'error' | 'success' | 'idle'
  message: string | null
  errors?: Record<string, string[]>
  redirectTo?: string
}

export interface TaskResponse {
  status: 'error' | 'created' | 'updated' | 'deleted' | 'idle'
  message: string | null
  errors?: Record<string, string[]>
  data?: {
    taskId?: string
  }
}

export type userProfile = Tables<'profiles'>

export interface NavItem {
  title: string
  href: string
  icon: ReactNode
}

export type Projects = Tables<'projects'>
