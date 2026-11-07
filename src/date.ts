import type { Meal } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

/** 로컬 기준 YYYY-MM-DD (toISOString은 UTC라 새벽에 날짜가 밀림) */
export function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toTimeStr(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 현재 시각으로 끼니 추정 */
export function guessMeal(d: Date): Meal {
  const h = d.getHours()
  if (h >= 5 && h < 10) return '아침'
  if (h >= 11 && h < 14) return '점심'
  if (h >= 17 && h < 20) return '저녁'
  return '간식'
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** "오늘", "어제", 또는 "11월 5일 (목)" */
export function formatDateLabel(date: string) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date === toDateStr(today)) return '오늘'
  if (date === toDateStr(yesterday)) return '어제'
  const d = new Date(`${date}T00:00`)
  const label = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`
  return d.getFullYear() === today.getFullYear() ? label : `${d.getFullYear()}년 ${label}`
}
