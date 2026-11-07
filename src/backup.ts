import { toDateStr } from './date'
import { blobToDataUrl, dataUrlToBlob, getAllPhotos, replaceAllPhotos } from './photos'
import { parseBackup, serializeBackup } from './store'
import type { Store } from './store'
import type { AppData } from './types'

/** 지금 데이터와 사진을 백업 파일로 만듦 */
export async function buildBackupFile(data: AppData) {
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

/** 백업 파일로 데이터와 사진을 되살림 (확인 창을 띄움). 결과 메시지를 돌려줌 */
export async function restoreFromFile(
  store: Store,
  file: File,
): Promise<{ message: string; error?: boolean } | null> {
  const backup = parseBackup(await file.text())
  if (!backup) return { message: '이유식 앱 백업 파일이 아니에요.', error: true }
  const { data, photos } = backup
  const ok = confirm(
    `재료 ${data.ingredients.length}개, 기록 ${data.records.length}개, ` +
      `사진 ${Object.keys(photos).length}장을 불러올까요?\n` +
      '지금 앱에 있는 데이터는 모두 이 백업으로 바뀌어요.',
  )
  if (!ok) return null
  try {
    const blobs = await Promise.all(
      Object.entries(photos).map(async ([id, url]) => ({ id, blob: await dataUrlToBlob(url) })),
    )
    await replaceAllPhotos(blobs)
  } catch {
    return { message: '사진을 불러오지 못했어요. 데이터는 그대로예요.', error: true }
  }
  store.replaceData(data)
  return { message: '백업을 불러왔어요.' }
}
