import { useEffect, useState } from 'react'
import type { AppData, Category, Ingredient, MealRecord, StockStatus } from './types'

const STORAGE_KEY = 'baby-care:data'

const EMPTY: AppData = { version: 1, ingredients: [], extras: [], records: [] }

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as AppData
    return { ...EMPTY, ...parsed }
  } catch {
    return EMPTY
  }
}

const newId = () => crypto.randomUUID()

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

    addIngredient(name: string, category: Category) {
      const trimmed = name.trim()
      if (!trimmed) return false
      if (data.ingredients.some((i) => i.name === trimmed)) return false
      setData((d) => ({
        ...d,
        ingredients: [
          ...d.ingredients,
          { id: newId(), name: trimmed, category, status: 'plenty', inCart: false },
        ],
      }))
      return true
    },

    setStatus(id: string, status: StockStatus) {
      // 다시 넉넉해지면 장바구니 표시는 의미가 없으므로 해제
      updateIngredient(id, status === 'plenty' ? { status, inCart: false } : { status })
    },

    toggleIngredientCart(id: string) {
      setData((d) => ({
        ...d,
        ingredients: d.ingredients.map((i) =>
          i.id === id ? { ...i, inCart: !i.inCart } : i,
        ),
      }))
    },

    removeIngredient(id: string) {
      setData((d) => ({ ...d, ingredients: d.ingredients.filter((i) => i.id !== id) }))
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
      setData((d) => ({ ...d, records: d.records.filter((r) => r.id !== id) }))
    },
  }
}

export type Store = ReturnType<typeof useStore>
