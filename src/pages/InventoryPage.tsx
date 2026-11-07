import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useState } from 'react'
import { CategoryTabs } from '../components/CategoryTabs'
import { UndoToast } from '../components/UndoToast'
import type { Store } from '../store'
import { STATUS_LABEL } from '../types'
import type { Ingredient, StockStatus } from '../types'

const STATUSES: StockStatus[] = ['plenty', 'low', 'out']

export function InventoryPage({ store }: { store: Store }) {
  const { ingredients, categories } = store.data
  const [name, setName] = useState('')
  // 처음 고른 분류를 id로 기억 (순서를 바꿔도 선택이 다른 분류로 옮겨가지 않게)
  const [selectedId, setSelectedId] = useState(() => categories[0]?.id)
  const [editing, setEditing] = useState(false)
  // 재료 추가 영역은 처음엔 항상 접어 둠
  const [addOpen, setAddOpen] = useState(false)
  // 편집 중에는 분류 순서를 바꿀 수 있게 분류 탭을 항상 보여줌
  const panelOpen = addOpen || editing
  // 방금 추가한 재료 (그 줄로 스크롤하고 잠깐 강조)
  const [addedId, setAddedId] = useState<string | null>(null)
  // 방금 지운 재료 (실행취소용)
  const [deleted, setDeleted] = useState<{ item: Ingredient; index: number } | null>(null)
  const dismissUndo = useCallback(() => setDeleted(null), [])
  const sensors = useSensors(useSensor(PointerSensor))

  const remove = (id: string) => {
    const removed = store.removeIngredient(id)
    if (removed) setDeleted(removed)
  }

  // 고른 분류가 없거나 설정에서 지워졌으면 첫 분류
  const category = categories.find((c) => c.id === selectedId) ?? categories[0]

  const existing = new Set(ingredients.map((i) => i.name))
  // 이미 재고에 있는 재료는 후보에서 뺌 (재고에서 지우면 다시 나타남)
  const suggestions = category?.suggestions.filter((s) => !existing.has(s)) ?? []

  const add = (ingredientName: string) => {
    if (!category) return false
    const id = store.addIngredient(ingredientName, category.id)
    if (id) setAddedId(id)
    return id !== null
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (add(name)) setName('')
  }

  useEffect(() => {
    if (!addedId) return
    document
      .querySelector(`[data-ingredient-id="${addedId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = setTimeout(() => setAddedId(null), 2000)
    return () => clearTimeout(timer)
  }, [addedId])

  return (
    <div className="page">
      <div className="sticky-panel">
        <header className="page-header">
          <h1>재료 재고</h1>
          <button className="text-btn" onClick={() => setEditing((v) => !v)}>
            {editing ? '완료' : '편집'}
          </button>
        </header>

        {!panelOpen ? null : category ? (
          <>
            <CategoryTabs
              categories={categories}
              selectedId={category.id}
              editable={editing}
              onSelect={setSelectedId}
              onMove={store.moveCategory}
            />

            {/* 편집 중엔 분류 탭만 (순서 바꾸기) */}
            {!editing && suggestions.length > 0 && (
              <div className="chips suggestion-chips">
                {suggestions.map((s) => (
                  <button key={s} className="chip" onClick={() => add(s)}>
                    + {s}
                  </button>
                ))}
              </div>
            )}

            {!editing && (
              <form className="add-form" onSubmit={submit}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`${category.name}에 직접 추가`}
                  enterKeyHint="done"
                />
                <button type="submit" className="primary-btn" disabled={!name.trim()}>
                  추가
                </button>
              </form>
            )}
          </>
        ) : (
          <p className="empty">재료 분류가 없어요.</p>
        )}

        {/* 헤더와 목록 사이의 접기/펼치기 손잡이 (편집 중엔 항상 펼침) */}
        {!editing && (
          <button
            className="collapse-toggle"
            onClick={() => setAddOpen((v) => !v)}
            aria-expanded={addOpen}
            aria-label={addOpen ? '재료 추가 접기' : '재료 추가 펼치기'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={addOpen ? 'open' : ''}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {ingredients.length === 0 ? (
        <p className="empty">
          {addOpen ? '집에 있는 이유식 재료를 추가해 보세요.' : '위의 ▾를 눌러 재료를 넣어 보세요.'}
          <br />
          부족해지면 '조금'이나 '없음'으로 바꾸면 장보기 목록에 자동으로 올라가요.
        </p>
      ) : (
        categories.map((cat) => {
          const items = ingredients.filter((i) => i.categoryId === cat.id)
          if (items.length === 0) return null
          return (
            <section key={cat.id} className="group">
              <h2>{cat.name}</h2>
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
                      <IngredientRow
                        key={item.id}
                        item={item}
                        store={store}
                        onDelete={() => remove(item.id)}
                        editing={editing}
                        highlighted={addedId === item.id}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </ul>
            </section>
          )
        })
      )}

      {deleted && (
        <UndoToast
          key={deleted.item.id}
          message={`'${deleted.item.name}' 삭제됨`}
          onUndo={() => {
            store.restoreIngredient(deleted.item, deleted.index)
            setDeleted(null)
          }}
          onDismiss={dismissUndo}
        />
      )}
    </div>
  )
}

function IngredientRow({
  item,
  store,
  onDelete,
  editing,
  highlighted,
}: {
  item: Ingredient
  store: Store
  onDelete: () => void
  editing: boolean
  highlighted: boolean
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
      data-ingredient-id={item.id}
      className={`row ${isDragging ? 'dragging' : ''} ${highlighted ? 'just-added' : ''}`}
      // 세로로만 움직이게 x 이동은 무시
      style={{ transform: CSS.Transform.toString(transform && { ...transform, x: 0 }), transition }}
    >
      {editing && (
        <button className="delete-btn" onClick={onDelete} aria-label={`${item.name} 삭제`}>
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
