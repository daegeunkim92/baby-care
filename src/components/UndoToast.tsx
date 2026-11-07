import { useEffect } from 'react'

const DURATION_MS = 4000

interface Props {
  message: string
  onUndo: () => void
  onDismiss: () => void
}

/** 화면 아래에 잠깐 떠서 '실행취소'를 할 수 있게 하는 알림. key를 바꾸면 시간이 다시 시작됨 */
export function UndoToast({ message, onUndo, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, DURATION_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="toast" role="status">
      <span className="toast-message">{message}</span>
      <button className="toast-action" onClick={onUndo}>
        실행취소
      </button>
    </div>
  )
}
