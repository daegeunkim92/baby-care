import { useRef, useState } from 'react'
import { toDateStr } from '../date'
import { parseBackup } from '../store'
import type { Store } from '../store'

interface Props {
  store: Store
  onClose: () => void
}

export function BackupSheet({ store, onClose }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ message: string; error?: boolean } | null>(null)
  const { ingredients, records } = store.data

  const exportData = async () => {
    const fileName = `이유식-백업-${toDateStr(new Date())}.json`
    const file = new File([JSON.stringify(store.data, null, 2)], fileName, {
      type: 'application/json',
    })

    // 아이폰: 공유 시트로 '파일에 저장', 카카오톡 나에게 보내기 등을 고를 수 있음
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        setStatus({ message: '백업 파일을 내보냈어요.' })
      } catch (e) {
        // 사용자가 공유 시트를 닫은 경우는 오류가 아님
        if ((e as Error).name !== 'AbortError') {
          setStatus({ message: '내보내기에 실패했어요.', error: true })
        }
      }
      return
    }

    // PC 브라우저 등: 바로 다운로드
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    setStatus({ message: '백업 파일을 다운로드했어요.' })
  }

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 골라도 동작하게
    if (!file) return

    const data = parseBackup(await file.text())
    if (!data) {
      setStatus({ message: '이유식 앱 백업 파일이 아니에요.', error: true })
      return
    }
    const ok = confirm(
      `재료 ${data.ingredients.length}개, 기록 ${data.records.length}개를 불러올까요?\n` +
        '지금 앱에 있는 데이터는 모두 이 백업으로 바뀌어요.',
    )
    if (!ok) return
    store.replaceData(data)
    setStatus({ message: '백업을 불러왔어요.' })
  }

  return (
    <div className="sheet">
      <header className="sheet-header">
        <span />
        <h2>데이터 백업</h2>
        <button className="text-btn strong" onClick={onClose}>
          닫기
        </button>
      </header>

      <div className="sheet-body">
        <section className="field-group">
          <div className="backup-card">
            <h3>내보내기</h3>
            <p>
              지금 데이터(재료 {ingredients.length}개, 기록 {records.length}개)를 파일로
              저장해요. '파일에 저장'을 고르면 아이폰 파일 앱에 보관돼요.
            </p>
            <button className="primary-btn wide" onClick={exportData}>
              백업 파일 내보내기
            </button>
          </div>
        </section>

        <section className="field-group">
          <div className="backup-card">
            <h3>불러오기</h3>
            <p>
              내보낸 백업 파일을 골라 데이터를 되살려요. 지금 앱에 있는 데이터는 백업
              내용으로 바뀌어요.
            </p>
            <button className="primary-btn wide" onClick={() => fileInput.current?.click()}>
              백업 파일 불러오기
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              onChange={importData}
              hidden
            />
          </div>
        </section>

        {status && (
          <p className={`backup-status ${status.error ? 'error' : ''}`}>{status.message}</p>
        )}
      </div>
    </div>
  )
}
