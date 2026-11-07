import { useEffect, useRef, useState } from 'react'
import { markBackedUp, needsBackup, useLastBackup } from '../backupStatus'
import { formatDaysAgo } from '../date'
import { buildBackupFile, restoreFromFile } from '../backup'
import type { Store } from '../store'
import type { AppData } from '../types'

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`

type Prepared = { data: AppData; file: File; photoCount: number }

export function BackupSection({ store }: { store: Store }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ message: string; error?: boolean } | null>(null)
  const { ingredients, records } = store.data
  const lastBackup = useLastBackup()
  const remind = needsBackup(store.data, lastBackup)

  // 아이폰은 탭한 직후에만 공유 시트를 열 수 있어서, 사진을 모으느라 시간이 걸리는
  // 백업 파일을 화면이 열릴 때(그리고 데이터가 바뀔 때) 미리 만들어 둠
  const [built, setBuilt] = useState<Prepared | null>(null)
  const prepared = built?.data === store.data ? built : null

  useEffect(() => {
    let cancelled = false
    const data = store.data
    buildBackupFile(data)
      .then((p) => !cancelled && setBuilt({ data, ...p }))
      .catch(
        () => !cancelled && setStatus({ message: '백업 파일을 만들지 못했어요.', error: true }),
      )
    return () => {
      cancelled = true
    }
  }, [store.data])

  const exportData = async () => {
    if (!prepared) return
    const { file } = prepared

    // 아이폰: 공유 시트로 '파일에 저장', 카카오톡 나에게 보내기 등을 고를 수 있음
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        markBackedUp()
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
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
    markBackedUp()
    setStatus({ message: '백업 파일을 다운로드했어요.' })
  }

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 골라도 동작하게
    if (file) setStatus(await restoreFromFile(store, file))
  }

  return (
    <>
      <section className="group">
        <h2>데이터 백업</h2>
        <div className="backup-card">
          <h3>내보내기</h3>
          <p className={`last-backup ${remind ? 'warn' : ''}`}>
            {lastBackup
              ? `마지막 백업: ${formatDaysAgo(lastBackup)} (${lastBackup.getMonth() + 1}월 ${lastBackup.getDate()}일)`
              : '아직 백업한 적이 없어요.'}
            {remind && ' 데이터는 이 폰에만 있으니 백업해 두세요.'}
          </p>
          <p>
            지금 데이터(재료 {ingredients.length}개, 기록 {records.length}개
            {prepared && `, 사진 ${prepared.photoCount}장`})를 파일로 저장해요. '파일에 저장'을
            고르면 아이폰 파일 앱에 보관돼요.
          </p>
          <button className="primary-btn wide" onClick={exportData} disabled={!prepared}>
            {prepared ? `백업 파일 내보내기 (${formatSize(prepared.file.size)})` : '백업 준비 중…'}
          </button>
        </div>
      </section>

      <section className="group">
        <div className="backup-card">
          <h3>불러오기</h3>
          <p>
            내보낸 백업 파일을 골라 데이터와 사진을 되살려요. 지금 앱에 있는 데이터는 백업 내용으로
            바뀌어요.
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
        {status && (
          <p className={`backup-status ${status.error ? 'error' : ''}`}>{status.message}</p>
        )}
      </section>
    </>
  )
}
