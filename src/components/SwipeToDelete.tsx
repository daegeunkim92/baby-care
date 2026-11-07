import { useRef, useState } from 'react'
import type { ReactNode } from 'react'

const ACTION_WIDTH = 80

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  disabled?: boolean
  label: string
  children: ReactNode
}

/**
 * 왼쪽으로 밀면 오른쪽에 '삭제' 버튼이 나타나는 행 (iOS 메일 앱처럼).
 * 감싸는 요소(li)에 swipe-row 클래스가 있어야 함.
 */
export function SwipeToDelete({ open, onOpenChange, onDelete, disabled, label, children }: Props) {
  const start = useRef<{ x: number; y: number; base: number } | null>(null)
  // 'h': 가로로 미는 중, 'v': 세로 스크롤로 판단, null: 아직 모름
  const direction = useRef<'h' | 'v' | null>(null)
  const swiped = useRef(false)
  const [dragX, setDragX] = useState<number | null>(null)

  const offset = dragX ?? (open && !disabled ? -ACTION_WIDTH : 0)

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    start.current = { x: e.clientX, y: e.clientY, base: open ? -ACTION_WIDTH : 0 }
    direction.current = null
    swiped.current = false
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    if (!direction.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      direction.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      if (direction.current === 'h') {
        try {
          // 손가락이 행 밖으로 나가도 계속 따라오게
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // 이미 끝난 포인터면 무시
        }
      }
    }
    if (direction.current !== 'h') return
    swiped.current = true
    setDragX(Math.min(0, Math.max(-ACTION_WIDTH * 1.5, start.current.base + dx)))
  }

  const onPointerEnd = () => {
    if (start.current && direction.current === 'h' && dragX !== null) {
      onOpenChange(dragX < -ACTION_WIDTH / 2)
    }
    start.current = null
    setDragX(null)
  }

  // 밀고 난 직후의 탭, 또는 열린 상태에서의 탭은 버튼을 누르지 않고 닫기만 함
  const onClickCapture = (e: React.MouseEvent) => {
    if (swiped.current || open) {
      e.stopPropagation()
      e.preventDefault()
      swiped.current = false
      if (open) onOpenChange(false)
    }
  }

  return (
    <>
      {/* 닫혀 있을 때는 숨겨서 둥근 모서리 사이로 빨간색이 비치지 않게 */}
      <div
        className="swipe-actions"
        aria-hidden={!open}
        style={{ visibility: offset === 0 ? 'hidden' : 'visible' }}
      >
        <button className="swipe-delete" onClick={onDelete} aria-label={`${label} 삭제`}>
          <TrashIcon />
        </button>
      </div>
      <div
        className="swipe-content"
        // 밀어도 이름이 가려지지 않게, 옆으로 옮기지 않고 폭을 줄임
        style={{
          width: `calc(100% + ${offset}px)`,
          transition: dragX === null ? 'width 0.2s ease' : 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </>
  )
}

function TrashIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4h6v3" />
    </svg>
  )
}
