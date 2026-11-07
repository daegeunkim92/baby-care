import { useState } from 'react'
import { needsBackup, useLastBackup } from './backupStatus'
import { InventoryPage } from './pages/InventoryPage'
import { RecordsPage } from './pages/RecordsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShoppingPage } from './pages/ShoppingPage'
import { WelcomePage } from './pages/WelcomePage'
import { useStore } from './store'

type Tab = 'records' | 'inventory' | 'shopping' | 'settings'

function App() {
  const store = useStore()
  const [tab, setTab] = useState<Tab>('inventory')
  const toBuyCount = store.data.ingredients.filter((i) => i.status !== 'plenty').length
  const remindBackup = needsBackup(store.data, useLastBackup())

  // 아기 정보가 없으면(처음 실행, 초기화 후) 첫 화면부터
  if (!store.data.baby) return <WelcomePage store={store} />

  return (
    <div className="app">
      <main className="content">
        {tab === 'records' && <RecordsPage store={store} />}
        {tab === 'inventory' && <InventoryPage store={store} />}
        {tab === 'shopping' && <ShoppingPage store={store} />}
        {tab === 'settings' && <SettingsPage store={store} />}
      </main>

      <nav className="tab-bar">
        <button className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}>
          <span className="tab-icon">🥕</span>
          재고
        </button>
        <button className={tab === 'records' ? 'active' : ''} onClick={() => setTab('records')}>
          <span className="tab-icon">🥣</span>
          기록
        </button>
        <button className={tab === 'shopping' ? 'active' : ''} onClick={() => setTab('shopping')}>
          <span className="tab-icon">
            🛒{toBuyCount > 0 && <span className="tab-badge">{toBuyCount}</span>}
          </span>
          장보기
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          <span className="tab-icon">
            ⚙️{remindBackup && <span className="tab-dot" aria-label="백업 필요" />}
          </span>
          설정
        </button>
      </nav>
    </div>
  )
}

export default App
