import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { BackupSection } from '../components/BackupSection'
import type { Store } from '../store'
import type { Category } from '../types'

export function SettingsPage({ store }: { store: Store }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const opened = store.data.categories.find((c) => c.id === openId)

  if (opened) {
    return <CategoryDetail store={store} category={opened} onBack={() => setOpenId(null)} />
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>설정</h1>
      </header>
      <CategoryList store={store} onOpen={setOpenId} />
      <BackupSection store={store} />
    </div>
  )
}

function CategoryList({ store, onOpen }: { store: Store; onOpen: (id: string) => void }) {
  const { categories } = store.data
  const [name, setName] = useState('')
  const sensors = useSensors(useSensor(PointerSensor))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (store.addCategory(name)) setName('')
    else if (name.trim()) alert('같은 이름의 분류가 이미 있어요.')
  }

  return (
    <section className="group">
      <h2>재료 관리</h2>
      {categories.length > 0 && (
        <ul className="list">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) =>
              over && store.moveCategory(String(active.id), String(over.id))
            }
          >
            <SortableContext items={categories} strategy={verticalListSortingStrategy}>
              {categories.map((c) => (
                <CategoryRow key={c.id} category={c} onOpen={() => onOpen(c.id)} />
              ))}
            </SortableContext>
          </DndContext>
        </ul>
      )}
      <form className="add-form inline" onSubmit={submit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="새 분류 이름 (예: 해산물)"
          enterKeyHint="done"
        />
        <button type="submit" className="primary-btn" disabled={!name.trim()}>
          추가
        </button>
      </form>
      <p className="hint left">☰를 끌어서 분류 순서를 바꿀 수 있어요.</p>
    </section>
  )
}

function CategoryRow({ category, onOpen }: { category: Category; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id })

  return (
    <li
      ref={setNodeRef}
      className={`row ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform && { ...transform, x: 0 }), transition }}
    >
      <button
        ref={setActivatorNodeRef}
        className="drag-handle left"
        aria-label={`${category.name} 순서 바꾸기`}
        {...attributes}
        {...listeners}
      >
        ☰
      </button>
      <button className="row-link" onClick={onOpen}>
        <span className="row-name">{category.name}</span>
        <span className="row-count">{category.suggestions.length}</span>
        <span className="chevron">›</span>
      </button>
    </li>
  )
}

function CategoryDetail({
  store,
  category,
  onBack,
}: {
  store: Store
  category: Category
  onBack: () => void
}) {
  const [title, setTitle] = useState(category.name)
  const [name, setName] = useState('')
  const inStock = new Set(store.data.ingredients.map((i) => i.name))

  const saveTitle = () => {
    if (title.trim() === category.name) return
    if (!store.renameCategory(category.id, title)) {
      alert(title.trim() ? '같은 이름의 분류가 이미 있어요.' : '분류 이름을 입력해 주세요.')
      setTitle(category.name)
    }
  }

  const addSuggestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (store.addSuggestion(category.id, name)) setName('')
    else if (name.trim()) alert('이미 다른 분류나 이 분류에 있는 재료예요.')
  }

  const remove = () => {
    const blocking = store.data.ingredients.filter((i) => i.categoryId === category.id).length
    if (blocking > 0) {
      alert(
        `재고에 '${category.name}' 재료가 ${blocking}개 있어요.\n재고 탭에서 먼저 지운 뒤 분류를 삭제해 주세요.`,
      )
      return
    }
    if (confirm(`'${category.name}' 분류와 후보 재료를 모두 삭제할까요?`)) {
      store.removeCategory(category.id)
      onBack()
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="text-btn back-btn" onClick={onBack}>
          ‹ 설정
        </button>
      </header>

      <section className="group">
        <h2>분류 이름</h2>
        <input
          className="text-input title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          enterKeyHint="done"
        />
      </section>

      <section className="group">
        <h2>후보 재료 {category.suggestions.length}개</h2>
        <form className="add-form" onSubmit={addSuggestion}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="후보 재료 추가"
            enterKeyHint="done"
          />
          <button type="submit" className="primary-btn" disabled={!name.trim()}>
            추가
          </button>
        </form>
        {category.suggestions.length === 0 ? (
          <p className="empty">후보 재료가 없어요.</p>
        ) : (
          <div className="chips">
            {category.suggestions.map((s) => (
              <button
                key={s}
                className="chip removable"
                onClick={() => store.removeSuggestion(category.id, s)}
                aria-label={`${s} 후보에서 지우기`}
              >
                {inStock.has(s) && '• '}
                {s} ✕
              </button>
            ))}
          </div>
        )}
        <p className="hint left">
          누르면 후보에서 지워져요. • 표시는 지금 재고에 있는 재료예요 (후보에서 지워도 재고는
          그대로예요).
        </p>
      </section>

      <button className="danger-btn" onClick={remove}>
        분류 삭제
      </button>
    </div>
  )
}
