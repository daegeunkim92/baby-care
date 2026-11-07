import type { AppData, ManualFood } from './types'

export interface FoodSummary {
  name: string
  /** 처음 먹은 날 (YYYY-MM-DD) */
  firstDate: string
  /** 기록에 들어 있었던 횟수 */
  count: number
  /** 이상 반응이 있었던 횟수 (기록 + 직접 입력) */
  reactions: number
  /** 처음 먹은 날 이상 반응이 있었는지 (늘 먹던 재료와 섞여 있어도 새 재료를 의심) */
  suspect: boolean
  /** 직접 입력한 항목 (있으면 눌러서 수정) */
  manual?: ManualFood
}

/** 기록과 직접 입력을 합친 먹어본 재료 목록 (설정의 개수와 먹어본 재료 화면이 같이 씀) */
export function summarizeFoods({ records, manualFoods }: AppData): FoodSummary[] {
  // 직접 입력은 그날 기록보다 앞선 것으로 봄 ('2026-11-07' < '2026-11-0708:00')
  const events = [
    ...manualFoods.map((m) => ({
      key: m.date,
      date: m.date,
      names: [m.name],
      reaction: m.reaction,
      manual: m,
    })),
    ...records.map((r) => ({
      key: `${r.date}${r.time}`,
      date: r.date,
      names: r.ingredients,
      reaction: r.reaction,
      manual: undefined,
    })),
  ].sort((a, b) => a.key.localeCompare(b.key))

  const foods = new Map<string, FoodSummary>()
  for (const e of events) {
    for (const name of e.names) {
      let f = foods.get(name)
      if (!f) {
        f = { name, firstDate: e.date, count: 0, reactions: 0, suspect: e.reaction }
        foods.set(name, f)
      }
      if (e.manual) f.manual = e.manual
      else f.count += 1
      if (e.reaction) f.reactions += 1
    }
  }
  // 최근에 처음 먹인 재료가 위로
  return [...foods.values()].sort((a, b) => b.firstDate.localeCompare(a.firstDate))
}
