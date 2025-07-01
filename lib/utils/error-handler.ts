// Using a more generic error type to avoid dependency issues
export type SupabaseError = {
  code?: string
  message: string
  hint?: string
  details?: string
}

export type AppError = {
  code: string
  message: string
  details?: any
  timestamp: string
  userId?: string
  action?: string
}

export class ErrorHandler {
  static createError(
    code: string,
    message: string,
    details?: any,
    action?: string,
    userId?: string
  ): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      userId,
      action,
    }
  }

  static logError(error: AppError): void {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('[AppError]', {
        ...error,
        stack: error.details?.stack,
      })
    }

    // In production, you would send to your logging service
    // Example: Sentry, LogRocket, DataDog, etc.
    if (process.env.NODE_ENV === 'production') {
      // Send to external logging service
      // logToExternalService(error)
    }
  }

  static handleSupabaseError(
    error: SupabaseError,
    action: string,
    userId?: string
  ): AppError {
    const appError = this.createError(
      error.code || 'SUPABASE_ERROR',
      error.message || 'Database operation failed',
      { 
        hint: error.hint,
        details: error.details,
        originalError: error
      },
      action,
      userId
    )

    this.logError(appError)
    return appError
  }

  static handleUnknownError(
    error: unknown,
    action: string,
    userId?: string
  ): AppError {
    const appError = this.createError(
      'UNKNOWN_ERROR',
      error instanceof Error ? error.message : 'An unknown error occurred',
      error instanceof Error ? { stack: error.stack } : error,
      action,
      userId
    )

    this.logError(appError)
    return appError
  }

  static createUserFriendlyMessage(error: AppError): string {
    // Map technical errors to user-friendly messages
    const friendlyMessages: Record<string, string> = {
      '23505': 'This item already exists. Please use a different name.',
      '23503': 'Cannot perform this action due to related data.',
      '42501': 'You do not have permission to perform this action.',
      'PGRST116': 'No data found matching your request.',
      'SUPABASE_ERROR': 'Database operation failed. Please try again.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
    }

    return friendlyMessages[error.code] || error.message
  }
}

// Utility functions for common error patterns
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  action: string,
  userId?: string
): Promise<{ data: T | null; error: AppError | null }> => {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error: unknown) {
    const appError = ErrorHandler.handleUnknownError(error, action, userId)
    return { data: null, error: appError }
  }
}

export const validateAndSanitize = {
  projectName: (name: string): string => {
    return name.trim().substring(0, 100) // Limit length and trim
  },
  
  taskTitle: (title: string): string => {
    return title.trim().substring(0, 200)
  },
  
  email: (email: string): string => {
    return email.trim().toLowerCase()
  },
  
  uuid: (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }
}