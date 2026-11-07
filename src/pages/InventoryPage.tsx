import { useState } from 'react'
import type { Store } from '../store'
import { CATEGORIES, STATUS_LABEL, SUGGESTIONS } from '../types'
import type { Category, StockStatus } from '../types'

const STATUSES: StockStatus[] = ['plenty', 'low', 'out']

export function InventoryPage({ store }: { store: Store }) {
  const { ingredients } = store.data
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('채소')
  const [editing, setEditing] = useState(false)

  const existing = new Set(ingredients.map((i) => i.name))
  const suggestions = SUGGESTIONS.filter((s) => !existing.has(s.name))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (store.addIngredient(name, category)) setName('')
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>재료 재고</h1>
        {ingredients.length > 0 && (
          <button className="text-btn" onClick={() => setEditing((v) => !v)}>
            {editing ? '완료' : '편집'}
          </button>
        )}
      </header>

      <form className="add-form" onSubmit={submit}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          aria-label="분류"
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="재료 이름"
          enterKeyHint="done"
        />
        <button type="submit" className="primary-btn" disabled={!name.trim()}>
          추가
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="chips">
          {suggestions.map((s) => (
            <button
              key={s.name}
              className="chip"
              onClick={() => store.addIngredient(s.name, s.category)}
            >
              + {s.name}
            </button>
          ))}
        </div>
      )}

      {ingredients.length === 0 ? (
        <p className="empty">
          집에 있는 이유식 재료를 추가해 보세요.
          <br />
          부족해지면 '조금'이나 '없음'으로 바꾸면 장보기 목록에 자동으로 올라가요.
        </p>
      ) : (
        CATEGORIES.map((cat) => {
          const items = ingredients.filter((i) => i.category === cat)
          if (items.length === 0) return null
          return (
            <section key={cat} className="group">
              <h2>{cat}</h2>
              <ul className="list">
                {items.map((item) => (
                  <li key={item.id} className="row">
                    {editing && (
                      <button
                        className="delete-btn"
                        onClick={() => store.removeIngredient(item.id)}
                        aria-label={`${item.name} 삭제`}
                      >
                        −
                      </button>
                    )}
                    <span className="row-name">{item.name}</span>
                    <div className="segmented" role="radiogroup">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          role="radio"
                          aria-checked={item.status === s}
                          className={`seg seg-${s}`}
                          onClick={() => store.setStatus(item.id, s)}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}
