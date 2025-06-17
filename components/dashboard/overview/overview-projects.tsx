import { OverViewCard } from './overview-card'
import { OverviewProjectsBody } from './overview-project-body'
import { OverviewProjectsDialog } from './overview-project-dialog'

export const OverViewProjects = () => {
  return (
    <OverViewCard
      title="Projects"
      bodyChildren={<OverviewProjectsBody />}
      headerChildren={<OverviewProjectsDialog />}
    />
  )
}
