import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { BackupSheet } from '../components/BackupSheet'
import type { Store } from '../store'
import { CATEGORIES, STATUS_LABEL, SUGGESTIONS } from '../types'
import type { Category, Ingredient, StockStatus } from '../types'

const STATUSES: StockStatus[] = ['plenty', 'low', 'out']

export function InventoryPage({ store }: { store: Store }) {
  const { ingredients } = store.data
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('채소')
  const [editing, setEditing] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  const existing = new Set(ingredients.map((i) => i.name))
  const hidden = new Set(store.data.hiddenSuggestions)
  // 이미 재고에 있는 재료는 후보에서 뺌 (재고에서 지우면 다시 나타남)
  const suggestions = SUGGESTIONS[category].filter((s) => !hidden.has(s) && !existing.has(s))
  const hiddenInCategory = SUGGESTIONS[category].filter((s) => hidden.has(s))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (store.addIngredient(name, category)) setName('')
  }

  return (
    <div className="page">
      <div className="sticky-panel">
        <header className="page-header">
          <h1>재료 재고</h1>
          <div className="header-actions">
            <button className="text-btn" onClick={() => setBackupOpen(true)}>
              백업
            </button>
            <button className="text-btn" onClick={() => setEditing((v) => !v)}>
              {editing ? '완료' : '편집'}
            </button>
          </div>
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

        <div className="chips suggestion-chips">
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
      </div>

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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={({ active, over }) =>
                    over && store.moveIngredient(String(active.id), String(over.id))
                  }
                >
                  <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                      <IngredientRow key={item.id} item={item} store={store} editing={editing} />
                    ))}
                  </SortableContext>
                </DndContext>
              </ul>
            </section>
          )
        })
      )}

      {backupOpen && <BackupSheet store={store} onClose={() => setBackupOpen(false)} />}
    </div>
  )
}

function IngredientRow({
  item,
  store,
  editing,
}: {
  item: Ingredient
  store: Store
  editing: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !editing })

  return (
    <li
      ref={setNodeRef}
      className={`row ${isDragging ? 'dragging' : ''}`}
      // 세로로만 움직이게 x 이동은 무시
      style={{ transform: CSS.Transform.toString(transform && { ...transform, x: 0 }), transition }}
    >
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
      {editing ? (
        <button
          ref={setActivatorNodeRef}
          className="drag-handle"
          aria-label={`${item.name} 순서 바꾸기`}
          {...attributes}
          {...listeners}
        >
          ☰
        </button>
      ) : (
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
      )}
    </li>
  )
}
