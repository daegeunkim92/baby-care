import { useEffect, useState } from 'react'
import { deletePhoto, replaceAllPhotos } from './photos'
import { DEFAULT_CATEGORIES } from './types'
import type {
  AppData,
  BabyInfo,
  Category,
  Ingredient,
  ManualFood,
  MealRecord,
  StockStatus,
} from './types'

const STORAGE_KEY = 'baby-care:data'

const newId = () => crypto.randomUUID()

function initialData(): AppData {
  return {
    version: 2,
    baby: null,
    categories: DEFAULT_CATEGORIES.map((c) => ({ id: newId(), ...c })),
    ingredients: [],
    extras: [],
    records: [],
    manualFoods: [],
  }
}

/** 저장된 데이터나 백업 파일을 현재 형식(version 2)으로 변환. 형식이 맞지 않으면 null */
function migrate(raw: any): AppData | null {
  if (!Array.isArray(raw?.ingredients) || !Array.isArray(raw?.records)) return null
  const rest = {
    baby: raw.baby ?? null,
    extras: raw.extras ?? [],
    records: raw.records,
    manualFoods: raw.manualFoods ?? [],
  }

  if (raw.version === 2 && Array.isArray(raw.categories)) {
    return { version: 2, categories: raw.categories, ingredients: raw.ingredients, ...rest }
  }

  // version 1: 분류가 고정 목록이었고, 재료는 분류 이름으로 연결돼 있었음
  if (raw.version === 1) {
    const hidden: string[] = raw.hiddenSuggestions ?? []
    const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
      id: newId(),
      name: c.name,
      suggestions: c.suggestions.filter((s) => !hidden.includes(s)),
    }))
    const fallback = categories[categories.length - 1].id // '기타'
    const ingredients: Ingredient[] = raw.ingredients.map(
      ({ category, ...i }: Omit<Ingredient, 'categoryId'> & { category: string }) => ({
        ...i,
        categoryId: categories.find((c) => c.name === category)?.id ?? fallback,
      }),
    )
    return { version: 2, categories, ingredients, ...rest }
  }

  return null
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return (raw && migrate(JSON.parse(raw))) || initialData()
  } catch {
    return initialData()
  }
}

/** 백업 파일 형식: 앱 데이터 + 사진 (사진 id → data URL) */
export interface Backup {
  data: AppData
  photos: Record<string, string>
}

export function serializeBackup({ data, photos }: Backup) {
  return JSON.stringify({ ...data, photos })
}

/** 백업 파일 내용을 검사해서 변환. 형식이 맞지 않으면 null */
export function parseBackup(text: string): Backup | null {
  try {
    const raw = JSON.parse(text)
    const data = migrate(raw)
    return data && { data, photos: raw.photos ?? {} }
  } catch {
    return null
  }
}

/** activeId 항목을 overId 항목 자리로 옮긴 새 배열 */
function moveById<T extends { id: string }>(items: T[], activeId: string, overId: string) {
  const from = items.findIndex((i) => i.id === activeId)
  const to = items.findIndex((i) => i.id === overId)
  if (from < 0 || to < 0 || from === to) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function useStore() {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // 저장 공간 부족 등 — 다음 변경 때 다시 시도
    }
  }, [data])

  const updateIngredient = (id: string, patch: Partial<Ingredient>) =>
    setData((d) => ({
      ...d,
      ingredients: d.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }))

  return {
    data,

    /** 추가한 재료의 id를 돌려줌 (이미 있거나 이름이 비면 null) */
    addIngredient(name: string, categoryId: string) {
      const trimmed = name.trim()
      if (!trimmed) return null
      if (data.ingredients.some((i) => i.name === trimmed)) return null
      const id = newId()
      const isSuggested = data.categories.some((c) => c.suggestions.includes(trimmed))
      setData((d) => ({
        ...d,
        // 직접 입력한 재료도 후보에 넣어서, 재고에서 지운 뒤에도 다시 고를 수 있게 함
        categories: isSuggested
          ? d.categories
          : d.categories.map((c) =>
              c.id === categoryId ? { ...c, suggestions: [...c.suggestions, trimmed] } : c,
            ),
        ingredients: [
          ...d.ingredients,
          { id, name: trimmed, categoryId, status: 'plenty', inCart: false },
        ],
      }))
      return id
    },

    setStatus(id: string, status: StockStatus) {
      // 다시 넉넉해지면 장바구니 표시는 의미가 없으므로 해제
      updateIngredient(id, status === 'plenty' ? { status, inCart: false } : { status })
    },

    toggleIngredientCart(id: string) {
      setData((d) => ({
        ...d,
        ingredients: d.ingredients.map((i) => (i.id === id ? { ...i, inCart: !i.inCart } : i)),
      }))
    },

    /** activeId 재료를 overId 재료 자리로 옮김 (같은 분류 안에서 순서 바꾸기) */
    moveIngredient(activeId: string, overId: string) {
      setData((d) => ({ ...d, ingredients: moveById(d.ingredients, activeId, overId) }))
    },

    /** 지운 재료와 원래 위치를 돌려줌 (실행취소용) */
    removeIngredient(id: string) {
      const index = data.ingredients.findIndex((i) => i.id === id)
      if (index < 0) return null
      setData((d) => ({ ...d, ingredients: d.ingredients.filter((i) => i.id !== id) }))
      return { item: data.ingredients[index], index }
    },

    /** 지운 재료를 원래 자리에 되돌림 */
    restoreIngredient(item: Ingredient, index: number) {
      setData((d) => {
        if (d.ingredients.some((i) => i.id === item.id || i.name === item.name)) return d
        const ingredients = [...d.ingredients]
        ingredients.splice(Math.min(index, ingredients.length), 0, item)
        return { ...d, ingredients }
      })
    },

    addExtra(name: string) {
      const trimmed = name.trim()
      if (!trimmed) return
      setData((d) => ({
        ...d,
        extras: [...d.extras, { id: newId(), name: trimmed, inCart: false }],
      }))
    },

    toggleExtraCart(id: string) {
      setData((d) => ({
        ...d,
        extras: d.extras.map((e) => (e.id === id ? { ...e, inCart: !e.inCart } : e)),
      }))
    },

    removeExtra(id: string) {
      setData((d) => ({ ...d, extras: d.extras.filter((e) => e.id !== id) }))
    },

    /** 장바구니에 담은 재료는 '넉넉'으로 채우고, 담은 기타 항목은 목록에서 지움 */
    finishShopping() {
      setData((d) => ({
        ...d,
        ingredients: d.ingredients.map((i) =>
          i.inCart ? { ...i, status: 'plenty', inCart: false } : i,
        ),
        extras: d.extras.filter((e) => !e.inCart),
      }))
    },

    moveCategory(activeId: string, overId: string) {
      setData((d) => ({ ...d, categories: moveById(d.categories, activeId, overId) }))
    },

    setBaby(baby: BabyInfo) {
      setData((d) => ({ ...d, baby }))
    },

    /** 같은 이름이 이미 있으면 false. id가 있으면 수정, 없으면 추가 */
    saveManualFood(food: Omit<ManualFood, 'id'> & { id?: string }) {
      const name = food.name.trim()
      if (!name || data.manualFoods.some((f) => f.id !== food.id && f.name === name)) return false
      const saved = { ...food, name, memo: food.memo.trim(), id: food.id ?? newId() }
      setData((d) => ({
        ...d,
        manualFoods: food.id
          ? d.manualFoods.map((f) => (f.id === food.id ? saved : f))
          : [...d.manualFoods, saved],
      }))
      return true
    },

    removeManualFood(id: string) {
      setData((d) => ({ ...d, manualFoods: d.manualFoods.filter((f) => f.id !== id) }))
    },

    /** 모든 데이터와 사진을 지우고 처음 상태로 */
    async resetAll() {
      await replaceAllPhotos([])
      setData(initialData())
    },

    /** 백업 불러오기: 현재 데이터를 통째로 바꿈 */
    replaceData(next: AppData) {
      setData(next)
    },

    /** id가 있으면 수정, 없으면 새 기록 추가 */
    saveRecord(record: Omit<MealRecord, 'id'> & { id?: string }) {
      setData((d) => {
        if (record.id) {
          const saved = record as MealRecord
          return { ...d, records: d.records.map((r) => (r.id === saved.id ? saved : r)) }
        }
        return { ...d, records: [...d.records, { ...record, id: newId() }] }
      })
    },

    removeRecord(id: string) {
      const photoId = data.records.find((r) => r.id === id)?.photoId
      if (photoId) deletePhoto(photoId).catch(() => {})
      setData((d) => ({ ...d, records: d.records.filter((r) => r.id !== id) }))
    },
  }
}

export type Store = ReturnType<typeof useStore>
