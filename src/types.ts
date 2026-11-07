export type StockStatus = 'plenty' | 'low' | 'out'

export const STATUS_LABEL: Record<StockStatus, string> = {
  plenty: '넉넉',
  low: '조금',
  out: '없음',
}

export const CATEGORIES = [
  '곡류',
  '채소',
  '과일',
  '고기·생선',
  '두부·달걀·유제품',
  '기타',
] as const

export type Category = (typeof CATEGORIES)[number]

export interface Ingredient {
  id: string
  name: string
  category: Category
  status: StockStatus
  /** 장보기 목록에서 장바구니에 담았는지 (장보기 완료 시 '넉넉'으로 바뀜) */
  inCart: boolean
}

/** 재고로 관리하지 않는 일회성 장보기 항목 (이유식 용기, 지퍼백 등) */
export interface ExtraItem {
  id: string
  name: string
  inCart: boolean
}

export interface AppData {
  version: 1
  ingredients: Ingredient[]
  extras: ExtraItem[]
}

/** 빠른 추가용 자주 쓰는 이유식 재료 */
export const SUGGESTIONS: { name: string; category: Category }[] = [
  { name: '쌀가루', category: '곡류' },
  { name: '오트밀', category: '곡류' },
  { name: '애호박', category: '채소' },
  { name: '브로콜리', category: '채소' },
  { name: '당근', category: '채소' },
  { name: '양배추', category: '채소' },
  { name: '감자', category: '채소' },
  { name: '고구마', category: '채소' },
  { name: '단호박', category: '채소' },
  { name: '시금치', category: '채소' },
  { name: '사과', category: '과일' },
  { name: '배', category: '과일' },
  { name: '바나나', category: '과일' },
  { name: '소고기', category: '고기·생선' },
  { name: '닭고기', category: '고기·생선' },
  { name: '흰살생선', category: '고기·생선' },
  { name: '두부', category: '두부·달걀·유제품' },
  { name: '달걀', category: '두부·달걀·유제품' },
]
