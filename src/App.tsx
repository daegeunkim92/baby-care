import { useState } from 'react'
import { InventoryPage } from './pages/InventoryPage'
import { ShoppingPage } from './pages/ShoppingPage'
import { useStore } from './store'

type Tab = 'inventory' | 'shopping'

function App() {
  const store = useStore()
  const [tab, setTab] = useState<Tab>('inventory')
  const toBuyCount = store.data.ingredients.filter((i) => i.status !== 'plenty').length

  return (
    <div className="app">
      <main className="content">
        {tab === 'inventory' ? <InventoryPage store={store} /> : <ShoppingPage store={store} />}
      </main>

      <nav className="tab-bar">
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
