import { useRef, useState } from 'react'
import { restoreFromFile } from '../backup'
import { BabyForm } from '../components/BabyForm'
import type { Store } from '../store'

/** 아기 정보가 없을 때(처음 실행, 초기화 후) 보여주는 첫 화면 */
export function WelcomePage({ store }: { store: Store }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ message: string; error?: boolean } | null>(null)

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setStatus(await restoreFromFile(store, file))
  }

  return (
    <div className="welcome">
      <img className="welcome-icon" src="./apple-touch-icon.png" alt="" />
      <h1>이유식 기록을 시작해요</h1>
      <p className="welcome-desc">아기 정보를 넣으면 기록마다 그날의 개월 수가 표시돼요.</p>

      <BabyForm submitLabel="시작하기" onSubmit={store.setBaby} />

      <div className="welcome-restore">
        <p>전에 쓰던 데이터가 있나요?</p>
        <button className="text-btn" onClick={() => fileInput.current?.click()}>
          백업 파일 불러오기
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          onChange={importData}
          hidden
        />
        {status && (
          <p className={`backup-status ${status.error ? 'error' : ''}`}>{status.message}</p>
        )}
      </div>
    </div>
  )
}
