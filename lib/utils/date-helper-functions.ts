import { Duration, isAfter, intervalToDuration } from 'date-fns'

export const getRemainingTime = (targetDate: Date): Duration | null => {
  const now = new Date()

  if (isAfter(now, targetDate)) {
    return null
  }

  return intervalToDuration({
    start: now,
    end: targetDate,
  })
}

export const formatDuration = (duration: Duration | null): string => {
  if (!duration) return 'overdue'

  const { months = 0, days = 0, hours = 0, minutes = 0 } = duration

  if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`
  }

  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`
  }

  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }

  if (minutes > 0) {
    return `${minutes || 0} ${minutes === 1 ? 'minute' : 'minutes'}`
  }

  return 'Less than a minute'
}
