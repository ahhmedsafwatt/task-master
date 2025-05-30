import { TablesInsert } from '@/lib/types/database.types'
import { useState, useEffect, useCallback } from 'react'

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

const loadFormDataFromStorage = (): createTaskFormData => {
  if (typeof window === 'undefined') return defaultFormData

  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    return savedData ? JSON.parse(savedData) : defaultFormData
  } catch (error) {
    console.error('Failed to parse saved form data:', error)
    return defaultFormData
  }
}

export function useCreateTaskForm() {
  const [formData, setFormData] = useState<createTaskFormData>(
    loadFormDataFromStorage,
  )

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    }
  }, [formData])

  const updateFormDataFields = useCallback(
    <K extends keyof createTaskFormData>(
      field: K,
      value: createTaskFormData[K],
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const resetFormData = useCallback(() => {
    setFormData(defaultFormData)
    // Also clear localStorage when form is reset
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [defaultFormData])

  return {
    formData,
    updateFormDataFields,
    resetFormData,
  }
}
