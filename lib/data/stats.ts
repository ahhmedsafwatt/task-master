import 'server-only'
import { endOfMonth, startOfMonth } from 'date-fns'
import { cache } from 'react'
import { getProjects, getTasks } from './queries'

export interface DashboardStatsData {
  projectsCount: number
  completedThisMonth: number

  overdueTasks: number
  assignedTasks: number
  completedTasks: number
}

export interface DashboardStatsResponse {
  data: DashboardStatsData | null
  error?: string
}

export const getDashboardStats = cache(
  async (): Promise<DashboardStatsResponse> => {
    try {
      const currentMonth = {
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
      }

      const [projects, tasks] = await Promise.all([
        getProjects({
          or: [{ key: 'status', value: 'ACTIVE' }],
        }),
        getTasks(),
      ])

      if (!projects || !tasks) {
        throw new Error('Failed to fetch projects or tasks')
      }

      const projectsCount = projects.count ?? 0

      const completedThisMonth =
        tasks.data?.filter((task) =>
          task.status === 'DONE' && task.completed_at
            ? new Date(task.completed_at) >= currentMonth.startDate &&
              new Date(task.completed_at) <= currentMonth.endDate
            : null,
        ).length ?? 0

      const overdueTasks =
        tasks.data?.filter((task) =>
          task.due_date ? new Date(task.due_date) < new Date() : null,
        ).length ?? 0

      const assignedTasks =
        tasks.data?.filter((task) => task.status !== 'DONE').length ?? 0

      const completedTasks =
        tasks.data?.filter(
          (task) => task.status === 'DONE' && task.completed_at,
        ).length ?? 0

      return {
        data: {
          projectsCount,
          completedThisMonth,

          overdueTasks,
          assignedTasks,
          completedTasks,
        },
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        data: null,
        error: 'Error fetching dashboard stats',
      }
    }
  },
)
