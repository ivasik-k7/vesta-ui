import { createFileRoute } from '@tanstack/react-router'

import { CONSOLE_TABS, type ConsoleTab, ConsoleView } from './app.console'

export const Route = createFileRoute('/app/console_/$tab')({
  component: ConsoleTabPage,
})

function ConsoleTabPage() {
  const { tab } = Route.useParams()
  const safe: ConsoleTab = (CONSOLE_TABS as string[]).includes(tab)
    ? (tab as ConsoleTab)
    : 'overview'
  return <ConsoleView tab={safe} />
}
