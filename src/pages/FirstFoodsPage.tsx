import { formatAge } from '../date'
import type { Store } from '../store'

interface FoodSummary {
  name: string
  /** 처음 먹은 날 (YYYY-MM-DD) */
  firstDate: string
  count: number
  /** 이상 반응을 체크한 기록에 들어 있었던 횟수 */
  reactions: number
  /** 처음 먹은 날 이상 반응이 있었는지 (늘 먹던 재료와 섞여 있어도 새 재료를 의심) */
  suspect: boolean
}

function summarize(store: Store): FoodSummary[] {
  const foods = new Map<string, FoodSummary>()
  const sorted = [...store.data.records].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  )
  for (const r of sorted) {
    for (const name of r.ingredients) {
      let f = foods.get(name)
      if (!f) {
        f = { name, firstDate: r.date, count: 0, reactions: 0, suspect: r.reaction }
        foods.set(name, f)
      }
      f.count += 1
      if (r.reaction) f.reactions += 1
    }
  }
  // 최근에 처음 먹인 재료가 위로
  return [...foods.values()].sort((a, b) => b.firstDate.localeCompare(a.firstDate))
}

const formatDate = (date: string) => {
  const [y, m, d] = date.split('-')
  return `${y}.${m}.${d}`
}

/** 지금까지 먹여본 재료, 처음 먹인 날, 이상 반응 (병원 상담할 때 보여주기 좋게) */
export function FirstFoodsPage({ store, onBack }: { store: Store; onBack: () => void }) {
  const foods = summarize(store)
  const baby = store.data.baby
  const suspects = foods.filter((f) => f.suspect)

  return (
    <div className="page">
      <header className="page-header">
        <button className="text-btn back-btn" onClick={onBack}>
          ‹ 설정
        </button>
      </header>
      <h1 className="sub-title">먹어본 재료 {foods.length}가지</h1>

      {foods.length === 0 ? (
        <p className="empty">아직 기록에 남긴 재료가 없어요.</p>
      ) : (
        <>
          {suspects.length > 0 && (
            <p className="reaction-summary">
              ⚠️ 처음 먹은 날 이상 반응이 있었던 재료: {suspects.map((f) => f.name).join(', ')}
            </p>
          )}
          <section className="group">
            <ul className="list">
              {foods.map((f) => (
                <li
                  key={f.name}
                  className={`row food-row ${f.suspect ? 'has-reaction' : ''}`}
                >
                  <span className="row-name">
                    {f.suspect && '⚠️ '}
                    {f.name}
                  </span>
                  <span className="food-meta">
                    {formatDate(f.firstDate)}
                    {baby && ` · ${formatAge(baby.birthDate, f.firstDate) ?? ''}`}
                    <br />
                    {f.count}번 먹음{f.reactions > 0 && ` · 반응 ${f.reactions}번`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <p className="hint left">처음 먹인 날이 최근인 재료부터 보여줘요.</p>
        </>
      )}
    </div>
  )
}
