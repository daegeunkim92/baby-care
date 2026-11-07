import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useState } from 'react'
import { SwipeToDelete } from '../components/SwipeToDelete'
import { UndoToast } from '../components/UndoToast'
import type { Store } from '../store'
import { STATUS_LABEL } from '../types'
import type { Ingredient, StockStatus } from '../types'

const STATUSES: StockStatus[] = ['plenty', 'low', 'out']

// 재료 추가 영역을 펼쳐 둘지 (이 기기에서만 기억하는 화면 설정)
const ADD_OPEN_KEY = 'baby-care:inventory-add-open'

function loadAddOpen(hasIngredients: boolean) {
  try {
    const saved = localStorage.getItem(ADD_OPEN_KEY)
    // 처음엔 재료가 없으면 펼치고, 있으면 접어 둠
    return saved === null ? !hasIngredients : saved === 'true'
  } catch {
    return !hasIngredients
  }
}

export function InventoryPage({ store }: { store: Store }) {
  const { ingredients, categories } = store.data
  const [name, setName] = useState('')
  const [selectedId, setSelectedId] = useState<string>()
  const [addOpen, setAddOpen] = useState(() => loadAddOpen(ingredients.length > 0))
  // 왼쪽으로 밀어서 삭제 버튼이 열린 재료 (한 번에 하나만)
  const [swipedId, setSwipedId] = useState<string | null>(null)
  // 방금 지운 재료 (실행취소용)
  const [deleted, setDeleted] = useState<{ item: Ingredient; index: number } | null>(null)
  const dismissUndo = useCallback(() => setDeleted(null), [])
  // 길게 누르면(0.4초) 끌어서 순서 바꾸기. 그 전에 움직이면 스크롤이나 밀어서 삭제로 처리
  const longPress = { activationConstraint: { delay: 400, tolerance: 6 } }
  const sensors = useSensors(useSensor(TouchSensor, longPress), useSensor(MouseSensor, longPress))

  const remove = (id: string) => {
    setSwipedId(null)
    const removed = store.removeIngredient(id)
    if (removed) setDeleted(removed)
  }

  // 고른 분류가 없거나 설정에서 지워졌으면 첫 분류
  const category = categories.find((c) => c.id === selectedId) ?? categories[0]

  const existing = new Set(ingredients.map((i) => i.name))
  // 이미 재고에 있는 재료는 후보에서 뺌 (재고에서 지우면 다시 나타남)
  const suggestions = category?.suggestions.filter((s) => !existing.has(s)) ?? []

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (category && store.addIngredient(name, category.id)) setName('')
  }

  const toggleAdd = () => {
    const next = !addOpen
    setAddOpen(next)
    try {
      localStorage.setItem(ADD_OPEN_KEY, String(next))
    } catch {
      // 저장 못 해도 이번 화면에서는 동작함
    }
  }

  return (
    <div className="page">
      <div className="sticky-panel">
        <header className="page-header">
          <h1>재료 재고</h1>
          <div className="header-actions">
            <button className="text-btn" onClick={toggleAdd} aria-expanded={addOpen}>
              {addOpen ? '추가 접기 ▴' : '재료 추가 ▾'}
            </button>
          </div>
        </header>

        {!addOpen ? null : category ? (
          <>
            <div className="category-tabs" role="tablist">
              {categories.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={category.id === c.id}
                  className="category-tab"
                  onClick={() => setSelectedId(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {suggestions.length > 0 && (
              <div className="chips suggestion-chips">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    className="chip"
                    onClick={() => store.addIngredient(s, category.id)}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}

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
          </>
        ) : (
          <p className="empty">설정 탭에서 재료 분류를 먼저 추가해 주세요.</p>
        )}
      </div>

      {ingredients.length === 0 ? (
        <p className="empty">
          {addOpen
            ? '집에 있는 이유식 재료를 추가해 보세요.'
            : "위의 '재료 추가'를 눌러 재료를 넣어 보세요."}
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
                        swiped={swipedId === item.id}
                        onSwipedChange={(open) => setSwipedId(open ? item.id : null)}
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
  swiped,
  onSwipedChange,
}: {
  item: Ingredient
  store: Store
  onDelete: () => void
  swiped: boolean
  onSwipedChange: (open: boolean) => void
}) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  return (
    <li
      ref={setNodeRef}
      className={`row swipe-row ${isDragging ? 'dragging' : ''}`}
      // 세로로만 움직이게 x 이동은 무시
      style={{ transform: CSS.Transform.toString(transform && { ...transform, x: 0 }), transition }}
      {...listeners}
    >
      <SwipeToDelete
        open={swiped}
        onOpenChange={onSwipedChange}
        onDelete={onDelete}
        disabled={isDragging}
        label={item.name}
      >
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
      </SwipeToDelete>
    </li>
  )
}
