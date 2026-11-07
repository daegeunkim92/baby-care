import { useEffect, useRef, useState } from 'react'
import { toDateStr } from '../date'
import { blobToDataUrl, dataUrlToBlob, getAllPhotos, replaceAllPhotos } from '../photos'
import { parseBackup, serializeBackup } from '../store'
import type { Store } from '../store'
import type { AppData } from '../types'

/** 지금 데이터와 사진을 백업 파일로 만듦 */
async function buildBackupFile(data: AppData) {
  const usedIds = new Set(data.records.map((r) => r.photoId).filter(Boolean))
  const photos: Record<string, string> = {}
  for (const p of await getAllPhotos()) {
    if (usedIds.has(p.id)) photos[p.id] = await blobToDataUrl(p.blob)
  }
  const fileName = `이유식-백업-${toDateStr(new Date())}.json`
  const file = new File([serializeBackup({ data, photos })], fileName, {
    type: 'application/json',
  })
  return { file, photoCount: Object.keys(photos).length }
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`

type Prepared = { data: AppData; file: File; photoCount: number }

export function BackupSection({ store }: { store: Store }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ message: string; error?: boolean } | null>(null)
  const { ingredients, records } = store.data

  // 아이폰은 탭한 직후에만 공유 시트를 열 수 있어서, 사진을 모으느라 시간이 걸리는
  // 백업 파일을 화면이 열릴 때(그리고 데이터가 바뀔 때) 미리 만들어 둠
  const [built, setBuilt] = useState<Prepared | null>(null)
  const prepared = built?.data === store.data ? built : null

  useEffect(() => {
    let cancelled = false
    const data = store.data
    buildBackupFile(data)
      .then((p) => !cancelled && setBuilt({ data, ...p }))
      .catch(() => !cancelled && setStatus({ message: '백업 파일을 만들지 못했어요.', error: true }))
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
    setStatus({ message: '백업 파일을 다운로드했어요.' })
  }

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 골라도 동작하게
    if (!file) return

    const backup = parseBackup(await file.text())
    if (!backup) {
      setStatus({ message: '이유식 앱 백업 파일이 아니에요.', error: true })
      return
    }
    const { data, photos } = backup
    const ok = confirm(
      `재료 ${data.ingredients.length}개, 기록 ${data.records.length}개, ` +
        `사진 ${Object.keys(photos).length}장을 불러올까요?\n` +
        '지금 앱에 있는 데이터는 모두 이 백업으로 바뀌어요.',
    )
    if (!ok) return
    try {
      const blobs = await Promise.all(
        Object.entries(photos).map(async ([id, url]) => ({ id, blob: await dataUrlToBlob(url) })),
      )
      await replaceAllPhotos(blobs)
    } catch {
      setStatus({ message: '사진을 불러오지 못했어요. 데이터는 그대로예요.', error: true })
      return
    }
    store.replaceData(data)
    setStatus({ message: '백업을 불러왔어요.' })
  }

  return (
    <>
      <section className="group">
        <h2>데이터 백업</h2>
        <div className="backup-card">
          <h3>내보내기</h3>
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
            내보낸 백업 파일을 골라 데이터와 사진을 되살려요. 지금 앱에 있는 데이터는 백업
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
        {status && (
          <p className={`backup-status ${status.error ? 'error' : ''}`}>{status.message}</p>
        )}
      </section>
    </>
  )
}
