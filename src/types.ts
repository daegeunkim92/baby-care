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

export const MEALS = ['아침', '점심', '저녁', '간식'] as const

export type Meal = (typeof MEALS)[number]

export type Appetite = 'good' | 'normal' | 'refused'

export const APPETITE_LABEL: Record<Appetite, string> = {
  good: '잘 먹음',
  normal: '보통',
  refused: '거부',
}

export interface MealRecord {
  id: string
  /** YYYY-MM-DD (로컬 날짜) */
  date: string
  /** HH:MM */
  time: string
  meal: Meal
  menu: string
  /** 재료 이름 목록 (재고에 없는 재료도 가능) */
  ingredients: string[]
  /** 먹은 양 (g) */
  amount: number | null
  appetite: Appetite | null
  /** 알레르기 등 이상 반응 여부 */
  reaction: boolean
  memo: string
}

export interface AppData {
  version: 1
  ingredients: Ingredient[]
  extras: ExtraItem[]
  records: MealRecord[]
}

/** 빠른 추가용 자주 쓰는 이유식 재료 (분류별) */
export const SUGGESTIONS: Record<Category, string[]> = {
  곡류: ['쌀가루', '찹쌀가루', '현미', '오트밀', '퀴노아'],
  채소: [
    '애호박',
    '브로콜리',
    '당근',
    '양배추',
    '감자',
    '고구마',
    '단호박',
    '시금치',
    '청경채',
    '무',
    '양파',
    '콜리플라워',
    '비타민',
    '오이',
    '가지',
    '파프리카',
    '버섯',
  ],
  과일: ['사과', '배', '바나나', '아보카도', '블루베리', '딸기', '복숭아', '수박'],
  '고기·생선': ['소고기', '닭고기', '돼지고기', '대구살', '광어', '연어'],
  '두부·달걀·유제품': ['두부', '달걀노른자', '달걀', '요거트', '치즈'],
  기타: ['다시마', '김', '들기름', '참기름'],
}
