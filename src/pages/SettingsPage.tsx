import { BackupSection } from '../components/BackupSection'
import type { Store } from '../store'

export function SettingsPage({ store }: { store: Store }) {
  return (
    <div className="page">
      <header className="page-header">
        <h1>설정</h1>
      </header>
      <BackupSection store={store} />
    </div>
  )
}
