import { useState } from 'react'
import { RecordForm } from '../components/RecordForm'
import { formatDateLabel } from '../date'
import { usePhotoUrl } from '../photos'
import type { Store } from '../store'
import { APPETITE_LABEL } from '../types'
import type { MealRecord } from '../types'

const sortKey = (r: MealRecord) => `${r.date}${r.time}`

/** 기록 id → 그 기록에서 처음 먹은 재료들 */
function findFirstTimes(records: MealRecord[]) {
  const seen = new Set<string>()
  const result = new Map<string, Set<string>>()
  for (const r of [...records].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))) {
    const firsts = new Set(r.ingredients.filter((i) => !seen.has(i)))
    r.ingredients.forEach((i) => seen.add(i))
    result.set(r.id, firsts)
  }
  return result
}

export function RecordsPage({ store }: { store: Store }) {
  const { records } = store.data
  // null: 닫힘, 'new': 새 기록, 그 외: 수정할 기록
  const [editing, setEditing] = useState<MealRecord | 'new' | null>(null)

  const firstTimes = findFirstTimes(records)
  const sorted = [...records].sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
  const days: { date: string; items: MealRecord[] }[] = []
  for (const r of sorted) {
    const last = days[days.length - 1]
    if (last?.date === r.date) last.items.push(r)
    else days.push({ date: r.date, items: [r] })
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>이유식 기록</h1>
        <button className="primary-btn" onClick={() => setEditing('new')}>
          + 기록
        </button>
      </header>

      {days.length === 0 ? (
        <p className="empty">
          아직 기록이 없어요.
          <br />
          '+ 기록'을 눌러 오늘 먹인 이유식을 남겨보세요.
        </p>
      ) : (
        days.map(({ date, items }) => (
          <section key={date} className="group">
            <h2>{formatDateLabel(date)}</h2>
            <ul className="list">
              {items.map((r) => {
                const firsts = firstTimes.get(r.id)
                return (
                  <li key={r.id}>
                    <button
                      className={`record ${r.reaction ? 'has-reaction' : ''}`}
                      onClick={() => setEditing(r)}
                    >
                      <div className="record-body">
                        <div className="record-top">
                          <span className="record-meal">{r.meal}</span>
                          <span className="record-time">{r.time}</span>
                          <span className="record-menu">{r.menu || r.ingredients.join(', ')}</span>
                        </div>
                        {r.ingredients.length > 0 && (
                          <div className="record-ingredients">
                            {r.ingredients.map((i) => (
                              <span key={i} className={firsts?.has(i) ? 'first' : ''}>
                                {firsts?.has(i) && '🆕 '}
                                {i}
                              </span>
                            ))}
                          </div>
                        )}
                        {(r.amount !== null || r.appetite) && (
                          <div className="record-meta">
                            {r.amount !== null && <span>{r.amount}g</span>}
                            {r.appetite && <span>{APPETITE_LABEL[r.appetite]}</span>}
                          </div>
                        )}
                        {(r.reaction || r.memo) && (
                          <p className="record-memo">
                            {r.reaction && '⚠️ '}
                            {r.memo || '이상 반응'}
                          </p>
                        )}
                      </div>
                      {r.photoId && <RecordThumb photoId={r.photoId} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}

      {editing && (
        <RecordForm
          store={store}
          record={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function RecordThumb({ photoId }: { photoId: string }) {
  const url = usePhotoUrl(photoId)
  return url ? <img className="record-thumb" src={url} alt="" /> : <span className="record-thumb" />
}
