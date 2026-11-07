import { useEffect, useState } from 'react'

// 사진은 용량이 커서 localStorage(약 5MB) 대신 IndexedDB에 따로 저장
const DB_NAME = 'baby-care'
const STORE = 'photos'
const MAX_SIZE = 1280
const QUALITY = 0.8

let dbPromise: Promise<IDBDatabase> | null = null

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
  })
}

export async function putPhoto(id: string, blob: Blob) {
  // 브라우저가 저장 공간이 부족할 때 임의로 지우지 않도록 요청 (실패해도 무시)
  navigator.storage?.persist?.().catch(() => {})
  await run('readwrite', (s) => s.put(blob, id))
}

export const getPhoto = (id: string) =>
  run<Blob | undefined>('readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>)

export const deletePhoto = (id: string) => run('readwrite', (s) => s.delete(id))

export async function getAllPhotos() {
  const [keys, values] = await Promise.all([
    run('readonly', (s) => s.getAllKeys()),
    run<Blob[]>('readonly', (s) => s.getAll()),
  ])
  return keys.map((key, i) => ({ id: String(key), blob: values[i] }))
}

/** 백업 불러오기: 기존 사진을 모두 지우고 백업의 사진으로 바꿈 */
export async function replaceAllPhotos(photos: { id: string; blob: Blob }[]) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.clear()
    photos.forEach((p) => store.put(p.blob, p.id))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 카메라 사진(수 MB)을 긴 변 1280px JPEG로 줄임 */
export async function resizeImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, MAX_SIZE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', QUALITY),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob()

/** 저장된 사진 id → <img>에 쓸 URL (컴포넌트가 사라지면 해제) */
export function usePhotoUrl(photoId: string | null | undefined) {
  const [loaded, setLoaded] = useState<{ id: string; url: string }>()

  useEffect(() => {
    if (!photoId) return
    let url: string | undefined
    let cancelled = false
    getPhoto(photoId).then((blob) => {
      if (cancelled || !blob) return
      url = URL.createObjectURL(blob)
      setLoaded({ id: photoId, url })
    })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [photoId])

  return photoId && loaded?.id === photoId ? loaded.url : undefined
}
