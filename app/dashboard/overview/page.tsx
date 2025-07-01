import { OverViewTasks } from '@/components/dashboard/overview/overview-tasks'
import { OverViewProjects } from '@/components/dashboard/overview/overview-projects'
import { DashBoardStats } from '@/components/dashboard/overview/overview-stats'

export default function Page() {
  return (
    <div className="flex flex-col gap-5 py-6">
      <DashBoardStats />

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-[repeat(auto-fit,minmax(450px,1fr))] lg:items-start">
        <OverViewTasks />
        <OverViewProjects />
      </div>
    </div>
  )
}
