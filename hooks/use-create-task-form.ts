import { TablesInsert } from '@/lib/types/database.types'
import { useState, useEffect } from 'react'

interface createTaskFormData extends TablesInsert<'tasks'> {
  assignee_ids: string[]
}

const STORAGE_KEY = 'task-form-data'

const defaultFormData: createTaskFormData = {
  title: '',
  assignee_ids: [],
  markdown_content: '',
  is_private: true,
  project_id: null,
  project_name: null,
  priority: 'LOW',
  status: 'BACKLOG',
  creator_id: '',
  due_date: null,
  end_date: null,
}

export function useCreateTaskForm() {
  const [formData, setFormData] = useState<createTaskFormData>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        try {
          return JSON.parse(savedData)
        } catch (e) {
          console.error('Failed to parse saved form data:', e)
        }
      }
    }
    // Return default values if no saved data exists
    return defaultFormData
  })

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    }
  }, [formData])

  const updateFormDataFields = <K extends keyof createTaskFormData>(
    field: K,
    value: createTaskFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetFormData = () => {
    setFormData(defaultFormData)
    // Also clear localStorage when form is reset
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return {
    formData,
    updateFormDataFields,
    resetFormData,
  }
}
