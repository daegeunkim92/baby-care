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
  const hidden = new Set(store.data.hiddenSuggestions)
  const suggestions = SUGGESTIONS[category].filter((s) => !hidden.has(s))
  const hiddenInCategory = SUGGESTIONS[category].filter((s) => hidden.has(s))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (store.addIngredient(name, category)) setName('')
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>재료 재고</h1>
        <button className="text-btn" onClick={() => setEditing((v) => !v)}>
          {editing ? '완료' : '편집'}
        </button>
      </header>

      <div className="category-tabs" role="tablist">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            className="category-tab"
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="chips">
        {suggestions.map((s) =>
          editing ? (
            <button
              key={s}
              className="chip removable"
              onClick={() => store.hideSuggestion(s)}
              aria-label={`${s} 후보에서 지우기`}
            >
              {s} ✕
            </button>
          ) : existing.has(s) ? (
            <span key={s} className="chip added">
              ✓ {s}
            </span>
          ) : (
            <button key={s} className="chip" onClick={() => store.addIngredient(s, category)}>
              + {s}
            </button>
          ),
        )}
        {editing && hiddenInCategory.length > 0 && (
          <button
            className="chip restore"
            onClick={() => store.restoreSuggestions(hiddenInCategory)}
          >
            지운 후보 {hiddenInCategory.length}개 되돌리기
          </button>
        )}
      </div>

      <form className="add-form" onSubmit={submit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${category}에 직접 추가`}
          enterKeyHint="done"
        />
        <button type="submit" className="primary-btn" disabled={!name.trim()}>
          추가
        </button>
      </form>

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
