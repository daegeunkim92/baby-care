import { useState } from 'react'
import { guessMeal, toDateStr, toTimeStr } from '../date'
import type { Store } from '../store'
import { APPETITE_LABEL, CATEGORIES, MEALS } from '../types'
import type { Appetite, MealRecord } from '../types'

const APPETITES: Appetite[] = ['good', 'normal', 'refused']

interface Props {
  store: Store
  /** 수정할 기록 (없으면 새 기록) */
  record?: MealRecord
  onClose: () => void
}

function initialDraft(record?: MealRecord) {
  if (record) return { ...record, amount: record.amount?.toString() ?? '' }
  const now = new Date()
  return {
    date: toDateStr(now),
    time: toTimeStr(now),
    meal: guessMeal(now),
    menu: '',
    ingredients: [] as string[],
    amount: '',
    appetite: null as Appetite | null,
    reaction: false,
    memo: '',
  }
}

export function RecordForm({ store, record, onClose }: Props) {
  const [draft, setDraft] = useState(() => initialDraft(record))
  const [custom, setCustom] = useState('')
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const { ingredients: inventory, records } = store.data

  // 최근 메뉴 (같은 메뉴 이름은 가장 최근 것만)
  const recentMenus: MealRecord[] = []
  for (const r of [...records].sort((a, b) =>
    `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
  )) {
    if (r.menu && !recentMenus.some((m) => m.menu === r.menu)) recentMenus.push(r)
    if (recentMenus.length >= 6) break
  }

  const toggleIngredient = (name: string) =>
    set(
      'ingredients',
      draft.ingredients.includes(name)
        ? draft.ingredients.filter((i) => i !== name)
        : [...draft.ingredients, name],
    )

  const addCustom = () => {
    const name = custom.trim()
    if (name && !draft.ingredients.includes(name)) set('ingredients', [...draft.ingredients, name])
    setCustom('')
  }

  const canSave = draft.menu.trim() !== '' || draft.ingredients.length > 0

  const save = () => {
    const amount = parseFloat(draft.amount)
    store.saveRecord({
      ...draft,
      menu: draft.menu.trim(),
      memo: draft.memo.trim(),
      amount: Number.isFinite(amount) ? amount : null,
    })
    onClose()
  }

  const remove = () => {
    if (record && confirm('이 기록을 삭제할까요?')) {
      store.removeRecord(record.id)
      onClose()
    }
  }

  // 재고에 없는 재료 (직접 입력했거나 재고에서 지운 재료)
  const inventoryNames = new Set(inventory.map((i) => i.name))
  const extraSelected = draft.ingredients.filter((i) => !inventoryNames.has(i))

  return (
    <div className="sheet">
      <header className="sheet-header">
        <button className="text-btn" onClick={onClose}>
          취소
        </button>
        <h2>{record ? '기록 수정' : '새 기록'}</h2>
        <button className="text-btn strong" onClick={save} disabled={!canSave}>
          저장
        </button>
      </header>

      <div className="sheet-body">
        <section className="field-group">
          <div className="field-row">
            <input
              type="date"
              value={draft.date}
              onChange={(e) => set('date', e.target.value)}
              aria-label="날짜"
            />
            <input
              type="time"
              value={draft.time}
              onChange={(e) => set('time', e.target.value)}
              aria-label="시간"
            />
          </div>
          <div className="segmented full" role="radiogroup" aria-label="끼니">
            {MEALS.map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={draft.meal === m}
                className="seg seg-accent"
                onClick={() => set('meal', m)}
              >
                {m}
              </button>
            ))}
          </div>
        </section>

        <section className="field-group">
          <h3>메뉴</h3>
          <input
            className="text-input"
            value={draft.menu}
            onChange={(e) => set('menu', e.target.value)}
            placeholder="예: 소고기 애호박 죽"
          />
          {!record && recentMenus.length > 0 && (
            <div className="chips">
              {recentMenus.map((r) => (
                <button
                  key={r.id}
                  className="chip"
                  onClick={() => setDraft((d) => ({ ...d, menu: r.menu, ingredients: r.ingredients }))}
                >
                  ↺ {r.menu}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="field-group">
          <h3>사용 재료</h3>
          {extraSelected.length > 0 && (
            <div className="chips">
              {extraSelected.map((name) => (
                <button key={name} className="chip selected" onClick={() => toggleIngredient(name)}>
                  {name} ✕
                </button>
              ))}
            </div>
          )}
          {CATEGORIES.map((cat) => {
            const items = inventory.filter((i) => i.category === cat)
            if (items.length === 0) return null
            return (
              <div key={cat} className="chip-group">
                <span className="chip-group-label">{cat}</span>
                <div className="chips">
                  {items.map((i) => (
                    <button
                      key={i.id}
                      className={`chip ${draft.ingredients.includes(i.name) ? 'selected' : ''}`}
                      onClick={() => toggleIngredient(i.name)}
                    >
                      {i.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <form
            className="add-form"
            onSubmit={(e) => {
              e.preventDefault()
              addCustom()
            }}
          >
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="다른 재료 직접 입력"
              enterKeyHint="done"
            />
            <button type="submit" className="primary-btn" disabled={!custom.trim()}>
              추가
            </button>
          </form>
        </section>

        <section className="field-group">
          <h3>먹은 양</h3>
          <div className="field-row">
            <label className="amount-input">
              <input
                type="number"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0"
              />
              <span>g</span>
            </label>
            <div className="segmented" role="radiogroup" aria-label="먹은 정도">
              {APPETITES.map((a) => (
                <button
                  key={a}
                  role="radio"
                  aria-checked={draft.appetite === a}
                  className={`seg seg-appetite-${a}`}
                  onClick={() => set('appetite', draft.appetite === a ? null : a)}
                >
                  {APPETITE_LABEL[a]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="field-group">
          <h3>반응</h3>
          <label className={`reaction-toggle ${draft.reaction ? 'on' : ''}`}>
            <input
              type="checkbox"
              checked={draft.reaction}
              onChange={(e) => set('reaction', e.target.checked)}
            />
            ⚠️ 이상 반응 있음 (발진, 구토, 설사 등)
          </label>
          <textarea
            className="text-input"
            value={draft.memo}
            onChange={(e) => set('memo', e.target.value)}
            placeholder="메모"
            rows={3}
          />
        </section>

        {record && (
          <button className="danger-btn" onClick={remove}>
            기록 삭제
          </button>
        )}
      </div>
    </div>
  )
}
