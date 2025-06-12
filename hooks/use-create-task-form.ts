import { createTaskFormData } from '@/lib/types/types'
import { useState, useCallback } from 'react'

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
  const [formData, setFormData] = useState<createTaskFormData>(defaultFormData)

  const updateFormDataFields = useCallback(
    <K extends keyof createTaskFormData>(
      field: K,
      value: createTaskFormData[K],
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    [setFormData, formData],
  )

  const resetFormData = useCallback(() => {
    setFormData(defaultFormData)
  }, [defaultFormData])

  return {
    formData,
    updateFormDataFields,
    resetFormData,
  }
}
