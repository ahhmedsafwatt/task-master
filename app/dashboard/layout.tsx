import { AppSidebar } from '@/components/dashboard/sidebar/app-sidebar'
import { DashboardHeader } from '@/components/dashboard/sidebar/dashboard-header'
import { getProjects } from '@/lib/data/queries'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Dashboard to mangage your tasks',
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const projects = await getProjects(100)
  if (!projects.data) return null

  return (
    <section className="bg-secondary dashboard dark:bg-primary flex max-h-screen overflow-hidden">
      <AppSidebar projects={projects.data} />
      <div className="bg-background dashboard relative m-1.5 h-screen flex-1 overflow-y-auto rounded-md border">
        <DashboardHeader />
        <div>{children}</div>
      </div>
    </section>
  )
}
