import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Category } from '../types'

// 꾹 누르면(0.3초) 옮길 수 있는 상태가 됨. 그 전에 움직이면 가로 스크롤로 처리
const LONG_PRESS = { activationConstraint: { delay: 300, tolerance: 6 } }

interface Props {
  categories: Category[]
  selectedId: string
  /** 편집 모드: 꾹 눌러서 끌면 순서 바꾸기 */
  editable: boolean
  onSelect: (id: string) => void
  onMove: (activeId: string, overId: string) => void
}

/** 재료 분류 탭. 편집 모드에서는 꾹 눌러 좌우로 끌면 순서가 바뀜 */
export function CategoryTabs({ categories, selectedId, editable, onSelect, onMove }: Props) {
  const sensors = useSensors(useSensor(TouchSensor, LONG_PRESS), useSensor(MouseSensor, LONG_PRESS))

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
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    disabled: !editable,
  })

  return (
    <button
      ref={setNodeRef}
      role="tab"
      aria-selected={selected}
      className={`category-tab ${isDragging ? 'dragging' : ''}`}
      // 위치만 옮기고 크기(scale)는 바꾸지 않음: 폭이 다른 탭끼리 바뀔 때 늘었다 줄었다 하지 않게
      style={{ transform: CSS.Translate.toString(transform && { ...transform, y: 0 }), transition }}
      onClick={onSelect}
      {...listeners}
    >
      {category.name}
      {/* 아래 재료 목록의 순서 바꾸기 손잡이와 같은 아이콘 */}
      {editable && (
        <span className="tab-reorder-icon" aria-hidden="true">
          ☰
        </span>
      )}
    </button>
  )
}
