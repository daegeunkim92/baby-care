import { useState } from 'react'
import { InventoryPage } from './pages/InventoryPage'
import { RecordsPage } from './pages/RecordsPage'
import { ShoppingPage } from './pages/ShoppingPage'
import { useStore } from './store'

type Tab = 'records' | 'inventory' | 'shopping'

function App() {
  const store = useStore()
  const [tab, setTab] = useState<Tab>('records')
  const toBuyCount = store.data.ingredients.filter((i) => i.status !== 'plenty').length

  return (
    <div className="app">
      <main className="content">
        {tab === 'records' && <RecordsPage store={store} />}
        {tab === 'inventory' && <InventoryPage store={store} />}
        {tab === 'shopping' && <ShoppingPage store={store} />}
      </main>

      <nav className="tab-bar">
        <button className={tab === 'records' ? 'active' : ''} onClick={() => setTab('records')}>
          <span className="tab-icon">🥣</span>
          기록
        </button>
        <button
          className={tab === 'inventory' ? 'active' : ''}
          onClick={() => setTab('inventory')}
        >
          <span className="tab-icon">🥕</span>
          재고
        </button>
        <button
          className={tab === 'shopping' ? 'active' : ''}
          onClick={() => setTab('shopping')}
        >
          <span className="tab-icon">
            🛒{toBuyCount > 0 && <span className="tab-badge">{toBuyCount}</span>}
          </span>
          장보기
        </button>
      </nav>
    </div>
  )
}

export default App
