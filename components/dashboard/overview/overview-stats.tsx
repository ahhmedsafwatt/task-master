import { getDashboardStats } from '@/lib/data/stats'
import { StatsCard } from './overview-stats-card'
import HorizontalSlider from '@/components/ui/horizontal-slider'
import {
  AlertCircle,
  BarChart2Icon,
  BarChart3,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Suspense } from 'react'
import { CardsSkeleton } from './overview-skeletons'

async function Stats() {
  const statsResponse = await getDashboardStats()

  if (!statsResponse.data) {
    return [] // Return empty array if no data
  }

  const stats = statsResponse.data

  const statsCards = [
    {
      title: stats.projectsCount.toString(),
      description: 'Projects',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: stats.completedThisMonth.toString(),
      description: 'Completed this month',
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      title: `${(stats.completedTasks / stats.assignedTasks) * 100}%`,
      description: 'Completion rate',
      icon: <BarChart2Icon className="h-5 w-5" />,
    },
    {
      title: stats.assignedTasks.toString(),
      description: 'Assigned tasks',
      icon: <AlertCircle className="h-5 w-5" />,
    },
    {
      title: stats.overdueTasks.toString(),
      description: 'Overdue tasks',
      icon: <Clock className="h-5 w-5" />,
    },
  ]

  if (!statsCards) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg bg-red-100 text-red-700">
        <p>Could not load stats.</p>
        Could not load stats.
      </div>
    )
  }

  return (
    <HorizontalSlider className="px-4">
      {statsCards.map((card, index: number) => (
        <StatsCard
          key={card.description ?? index}
          title={card.title}
          icon={card.icon}
          description={card.description}
        />
      ))}
    </HorizontalSlider>
  )
}

export const DashBoardStats = () => {
  return (
    <Suspense fallback={<CardsSkeleton />}>
      <Stats />
    </Suspense>
  )
}
