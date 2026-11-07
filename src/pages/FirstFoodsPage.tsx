import { useState } from 'react'
import { formatAge, toDateStr } from '../date'
import type { Store } from '../store'
import type { ManualFood } from '../types'

interface FoodSummary {
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

function summarize(store: Store): FoodSummary[] {
  const { records, manualFoods } = store.data
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

const formatDate = (date: string) => date.replaceAll('-', '.')

/** 지금까지 먹여본 재료, 처음 먹인 날, 이상 반응 (병원 상담할 때 보여주기 좋게) */
export function FirstFoodsPage({ store, onBack }: { store: Store; onBack: () => void }) {
  // null: 닫힘, 'new': 새로 추가, 그 외: 수정할 항목
  const [editing, setEditing] = useState<ManualFood | 'new' | null>(null)
  const foods = summarize(store)
  const baby = store.data.baby
  const suspects = foods.filter((f) => f.suspect)

  return (
    <div className="page">
      <header className="page-header">
        <button className="text-btn back-btn" onClick={onBack}>
          ‹ 설정
        </button>
        {!editing && (
          <button className="text-btn" onClick={() => setEditing('new')}>
            + 직접 추가
          </button>
        )}
      </header>
      <h1 className="sub-title">먹어본 재료 {foods.length}가지</h1>

      {editing && (
        <ManualFoodForm
          // 다른 항목을 고르면 입력칸을 새로 채움
          key={editing === 'new' ? 'new' : editing.id}
          store={store}
          food={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {foods.length === 0 ? (
        !editing && (
          <p className="empty">
            아직 먹어본 재료가 없어요.
            <br />
            기록을 남기거나 '+ 직접 추가'로 넣어 보세요.
          </p>
        )
      ) : (
        <>
          {suspects.length > 0 && (
            <p className="reaction-summary">
              ⚠️ 처음 먹은 날 이상 반응이 있었던 재료: {suspects.map((f) => f.name).join(', ')}
            </p>
          )}
          <section className="group">
            <ul className="list">
              {foods.map((f) => {
                const content = (
                  <>
                    <span className="row-name">
                      {f.suspect && '⚠️ '}
                      {f.name}
                      {f.manual?.memo && <span className="row-sub">{f.manual.memo}</span>}
                    </span>
                    <span className="food-meta">
                      {formatDate(f.firstDate)}
                      {baby && ` · ${formatAge(baby.birthDate, f.firstDate) ?? ''}`}
                      <br />
                      {[
                        f.count > 0 && `${f.count}번 먹음`,
                        f.manual && '직접 입력',
                        f.reactions > 0 && `반응 ${f.reactions}번`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </>
                )
                const manual = f.manual
                return (
                  <li key={f.name} className={`row food-row ${f.suspect ? 'has-reaction' : ''}`}>
                    {manual ? (
                      <button className="row-link" onClick={() => setEditing(manual)}>
                        {content}
                      </button>
                    ) : (
                      content
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
          <p className="hint left">
            처음 먹인 날이 최근인 재료부터 보여줘요. 직접 입력한 재료는 눌러서 고칠 수 있어요.
          </p>
        </>
      )}
    </div>
  )
}

function ManualFoodForm({
  store,
  food,
  onClose,
}: {
  store: Store
  food?: ManualFood
  onClose: () => void
}) {
  const [today] = useState(() => toDateStr(new Date()))
  const [name, setName] = useState(food?.name ?? '')
  const [date, setDate] = useState(food?.date ?? today)
  const [reaction, setReaction] = useState(food?.reaction ?? false)
  const [memo, setMemo] = useState(food?.memo ?? '')
  // 이름 자동완성: 재료 분류의 후보 재료
  const names = [...new Set(store.data.categories.flatMap((c) => c.suggestions))]

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !date) return
    if (store.saveManualFood({ id: food?.id, name, date, reaction, memo })) onClose()
    else alert('이미 직접 입력한 재료예요. 목록에서 눌러서 고쳐 주세요.')
  }

  const remove = () => {
    if (food && confirm(`'${food.name}' 직접 입력을 삭제할까요?`)) {
      store.removeManualFood(food.id)
      onClose()
    }
  }

  return (
    <form className="backup-card manual-form" onSubmit={save}>
      <h3>{food ? '직접 입력 수정' : '먹어본 재료 직접 추가'}</h3>
      <label className="field">
        <span>재료</span>
        <input
          className="text-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 단호박"
          list="food-names"
          enterKeyHint="next"
        />
        <datalist id="food-names">
          {names.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </label>
      <label className="field">
        <span>처음 먹은 날</span>
        <input
          className="text-input"
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <label className={`reaction-toggle ${reaction ? 'on' : ''}`}>
        <input type="checkbox" checked={reaction} onChange={(e) => setReaction(e.target.checked)} />
        ⚠️ 이상 반응 있었음
      </label>
      <textarea
        className="text-input"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모 (선택)"
        rows={2}
      />
      <div className="form-actions">
        <button type="button" className="text-btn" onClick={onClose}>
          취소
        </button>
        {food && (
          <button type="button" className="text-btn danger-text" onClick={remove}>
            삭제
          </button>
        )}
        <button type="submit" className="primary-btn" disabled={!name.trim() || !date}>
          저장
        </button>
      </div>
    </form>
  )
}
