import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToFirstScrollableAncestor, restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Category } from '../types'

interface Props {
  categories: Category[]
  selectedId: string
  /** 편집 모드: ☰를 잡고 끌면 순서 바꾸기 (선택 표시는 하지 않음) */
  editable: boolean
  onSelect: (id: string) => void
  onMove: (activeId: string, overId: string) => void
}

/** 재료 분류 탭. 편집 모드에서는 ☰를 잡고 좌우로 끌면 순서가 바뀜 */
export function CategoryTabs({ categories, selectedId, editable, onSelect, onMove }: Props) {
  // ☰를 잡고 4px 이상 움직이면 끌기 시작
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      // 탭 목록 밖으로 못 나가게: 끝을 넘어가면 스크롤할 폭이 계속 늘어나 끝없이 스크롤됐음
      modifiers={[restrictToHorizontalAxis, restrictToFirstScrollableAncestor]}
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
  const { listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id, disabled: !editable })

  return (
    <button
      ref={setNodeRef}
      role="tab"
      aria-selected={selected && !editable}
      className={`category-tab ${editable ? 'editable' : ''} ${isDragging ? 'dragging' : ''}`}
      // 위치만 옮기고 크기(scale)는 바꾸지 않음: 폭이 다른 탭끼리 바뀔 때 늘었다 줄었다 하지 않게
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={editable ? undefined : onSelect}
    >
      {category.name}
      {/* 아래 재료 목록과 같은 ☰ 손잡이: 여기를 잡고 끌 때만 옮겨짐 (나머지는 가로 스크롤) */}
      {editable && (
        <span
          ref={setActivatorNodeRef}
          className="tab-reorder-icon"
          aria-label={`${category.name} 순서 바꾸기`}
          {...listeners}
        >
          ☰
        </span>
      )}
    </button>
  )
}
