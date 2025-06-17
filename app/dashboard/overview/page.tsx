import { StatsCard } from '@/components/dashboard/overview/overview-stats-card'
import { OverViewTasks } from '@/components/dashboard/overview/overview-tasks'
import { BarChart3, CheckCircle2, AlertCircle, CarIcon } from 'lucide-react'
import { OverViewProjects } from '@/components/dashboard/overview/overview-projects'
import HorizontalSlider from '@/components/ui/horizontal-slider'

export default function Page() {
  // Mock data - replace with real data from your backend
  const stats = {
    activeProjects: 5,
    completedThisMonth: 12,
    lastMonthCompleted: 8,
    completionRate: 85,
    tasksCompleted: 15,
    projectsContributed: 3,
  }

  // Array of stats cards - you can modify this as needed
  const statsCards = [
    {
      title: '8',
      value: stats.activeProjects,
      description: `Active Projects`,
      icon: BarChart3,
      trend: {
        value: stats.activeProjects - stats.completedThisMonth,
        isPositive: false,
      },
    },
    {
      title: '50',
      value: stats.completedThisMonth,
      description: 'completed this month',
      icon: CheckCircle2,
      trend: {
        value: stats.completedThisMonth - stats.lastMonthCompleted,
        isPositive: true,
      },
    },
    {
      title: `${stats.completionRate}`,
      description: `assigned tasks`,
      icon: AlertCircle,
      trend: {
        value: 5,
        isPositive: true,
      },
    },
    {
      title: `${stats.projectsContributed}`,
      value: stats.tasksCompleted,
      description: `Tasks Completed`,
      icon: CheckCircle2,
      trend: {
        value: stats.tasksCompleted - 10,
        isPositive: false,
      },
    },
    {
      title: '8',
      description: 'Overdue Tasks',
      icon: CarIcon,
      trend: {
        value: 2,
        isPositive: false,
      },
    },
  ]

  return (
    <div className="flex flex-col gap-5 py-6">
      {/* Quick Stats */}
      <HorizontalSlider className="px-4">
        {statsCards.map((card, index) => (
          <StatsCard
            key={card.title + index}
            title={card.title}
            description={card.description}
            trend={card.trend}
          />
        ))}
      </HorizontalSlider>

      <div className="grid auto-rows-fr grid-cols-1 gap-4 px-4 lg:grid-cols-[repeat(auto-fit,minmax(450px,1fr))]">
        <OverViewTasks />
        <OverViewProjects />
      </div>
    </div>
  )
}
