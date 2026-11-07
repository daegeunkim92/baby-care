import { useSyncExternalStore } from 'react'
import type { AppData } from './types'

// 마지막으로 백업한 시각. 백업 파일에 넣으면 불러올 때 옛 날짜로 돌아가서, 기기에만 따로 저장
const KEY = 'baby-care:last-backup'
const EVENT = 'baby-care:backup'
const REMIND_AFTER_DAYS = 7

function read() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function markBackedUp() {
  try {
    localStorage.setItem(KEY, new Date().toISOString())
  } catch {
    // 저장 못 해도 백업 자체는 끝났음
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useLastBackup() {
  const value = useSyncExternalStore(subscribe, read)
  return value ? new Date(value) : null
}

/** 남길 데이터가 있는데 백업한 적이 없거나 7일이 지났으면 true */
export function needsBackup(data: AppData, last: Date | null) {
  const hasData = data.records.length > 0 || data.ingredients.length > 0
  if (!hasData) return false
  return !last || Date.now() - last.getTime() > REMIND_AFTER_DAYS * 86_400_000
}
