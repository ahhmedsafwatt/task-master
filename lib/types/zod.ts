import { z } from 'zod'

// Email validation schema
export const emailSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email({ message: 'Please enter a valid email address' })
    .trim(),
})

// Password validation schema
export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter',
      })
      .regex(/(?=.*?[A-Z])(?=.*?[a-z])/, {
        message:
          'Password must contain at least one uppercase letter and one lowercase',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Login schema with basic validation
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email({ message: 'Please enter a valid email address' })
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, { message: 'Password is required' })
    .trim(),
})

// Signup schema with stronger validation
export const signupSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email({ message: 'Please enter a valid email address' })
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/(?=.*?[A-Z])(?=.*?[a-z])/, {
      message:
        'Password must contain at least one uppercase letter and one lowercase',
    })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .trim(),
})

// Define Zod schema for task creation
export const TaskSchema = z
  .object({
    title: z.string().min(1, 'Task title is required'),
    markdown_content: z.string().optional(),
    is_private: z.boolean().default(true),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('LOW'),
    status: z
      .enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'])
      .default('BACKLOG'),
    project_id: z.string().nullable().optional(),
    project_name: z.string().nullable().optional(),
    assignee_ids: z.array(z.string()).nullable(),
    due_date: z
      .string()
      .refine((val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
      }, 'Invalid date format')
      .nullable()
      .optional(),
    end_date: z
      .string()
      .refine((val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
      }, 'Invalid date format')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      // Custom validation: end_date should be after due_date if both exist
      if (data.end_date && data.due_date) {
        const endDate = new Date(data.end_date)
        const dueDate = new Date(data.due_date)
        return endDate >= dueDate
      }
      return true
    },
    {
      message: 'Start date must be before due date',
      path: ['end_date'],
    },
  )
  .refine(
    (data) => {
      // Custom validation: project_id is required when is_private is false
      if (!data.is_private && !data.project_id) {
        return false
      }
      return true
    },
    {
      message: 'Project ID is required when task is not private',
      path: ['project_id'],
    },
  )

export const ProjectSchema = z.object({
  name: z.string().min(1, 'project name is required'),
  project_cover: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Infer the type from the schema for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type TaskInput = z.infer<typeof TaskSchema>
export type ProjectInput = z.infer<typeof ProjectSchema>
