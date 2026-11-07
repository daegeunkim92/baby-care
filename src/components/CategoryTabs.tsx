import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Category } from '../types'

interface Props {
  categories: Category[]
  selectedId: string
  /** 편집 모드: 손잡이(⠿)를 끌어서 순서 바꾸기 */
  editable: boolean
  onSelect: (id: string) => void
  onMove: (activeId: string, overId: string) => void
}

/** 재료 분류 탭. 편집 모드에서는 손잡이를 끌어 좌우로 순서를 바꿈 */
export function CategoryTabs({ categories, selectedId, editable, onSelect, onMove }: Props) {
  // 손잡이를 4px 이상 끌어야 시작 (그냥 탭하면 분류 선택)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => over && onMove(String(active.id), String(over.id))}
    >
      <SortableContext items={categories} strategy={horizontalListSortingStrategy}>
        <div className="category-tabs" role="tablist">
          {categories.map((c) => (
            <CategoryTab
              key={c.id}
              category={c}
              selected={c.id === selectedId}
              editable={editable}
              onSelect={() => onSelect(c.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function CategoryTab({
  category,
  selected,
  editable,
  onSelect,
}: {
  category: Category
  selected: boolean
  editable: boolean
  onSelect: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: !editable })

  return (
    <button
      ref={setNodeRef}
      role="tab"
      aria-selected={selected}
      className={`category-tab ${editable ? 'editable' : ''} ${isDragging ? 'dragging' : ''}`}
      // 위치만 옮기고 크기(scale)는 바꾸지 않음: 폭이 다른 탭끼리 바뀔 때 늘었다 줄었다 하지 않게
      style={{ transform: CSS.Translate.toString(transform && { ...transform, y: 0 }), transition }}
      onClick={onSelect}
    >
      {editable && (
        <span
          ref={setActivatorNodeRef}
          className="tab-handle"
          aria-label={`${category.name} 순서 바꾸기`}
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </span>
      )}
      {category.name}
    </button>
  )
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
      <circle cx="2.5" cy="2.5" r="1.5" />
      <circle cx="7.5" cy="2.5" r="1.5" />
      <circle cx="2.5" cy="7" r="1.5" />
      <circle cx="7.5" cy="7" r="1.5" />
      <circle cx="2.5" cy="11.5" r="1.5" />
      <circle cx="7.5" cy="11.5" r="1.5" />
    </svg>
  )
}
