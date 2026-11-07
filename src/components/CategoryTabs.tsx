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

// 길게 누르면(0.4초) 끌어서 순서 바꾸기. 그 전에 움직이면 가로 스크롤로 처리
const LONG_PRESS = { activationConstraint: { delay: 400, tolerance: 6 } }

interface Props {
  categories: Category[]
  selectedId: string
  onSelect: (id: string) => void
  onMove: (activeId: string, overId: string) => void
}

/** 재료 분류 탭. 길게 눌러 좌우로 끌면 순서가 바뀜 */
export function CategoryTabs({ categories, selectedId, onSelect, onMove }: Props) {
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
  onSelect,
}: {
  category: Category
  selected: boolean
  onSelect: () => void
}) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  return (
    <button
      ref={setNodeRef}
      role="tab"
      aria-selected={selected}
      className={`category-tab ${isDragging ? 'dragging' : ''}`}
      // 가로로만 움직이게 y 이동은 무시
      style={{ transform: CSS.Transform.toString(transform && { ...transform, y: 0 }), transition }}
      onClick={onSelect}
      {...listeners}
    >
      {category.name}
    </button>
  )
}
