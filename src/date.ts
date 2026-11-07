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

/** 생일 기준 그날의 나이. "7개월 12일", 한 달 전이면 "12일". 태어나기 전이면 null */
export function formatAge(birthDate: string, date: string) {
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [y, m, d] = date.split('-').map(Number)
  let months = (y - by) * 12 + (m - bm)
  if (d < bd) months -= 1
  if (months < 0) return null
  // 생일에서 months개월 지난 날 (31일생의 2월처럼 그 달에 없는 날이면 말일)
  const lastDay = new Date(Date.UTC(by, bm - 1 + months + 1, 0)).getUTCDate()
  const anchor = Date.UTC(by, bm - 1 + months, Math.min(bd, lastDay))
  const days = Math.round((Date.UTC(y, m - 1, d) - anchor) / 86_400_000)
  if (days < 0) return null
  return months > 0 ? `${months}개월 ${days}일` : `${days}일`
}

/** "3일 전", "오늘" 같은 상대 날짜 */
export function formatDaysAgo(from: Date, now = new Date()) {
  const days = Math.floor(
    (new Date(toDateStr(now)).getTime() - new Date(toDateStr(from)).getTime()) / 86_400_000,
  )
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  return `${days}일 전`
}
