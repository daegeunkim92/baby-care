import { useState } from 'react'
import { BabyForm } from '../components/BabyForm'
import { BackupSection } from '../components/BackupSection'
import { formatAge, toDateStr } from '../date'
import { summarizeFoods } from '../foods'
import type { Store } from '../store'
import { FirstFoodsPage } from './FirstFoodsPage'

const builtAt = new Date(__APP_BUILT_AT__)
const pad = (n: number) => String(n).padStart(2, '0')
const BUILT_AT_LABEL = `${builtAt.getFullYear()}.${pad(builtAt.getMonth() + 1)}.${pad(builtAt.getDate())} ${pad(builtAt.getHours())}:${pad(builtAt.getMinutes())}`

export function SettingsPage({ store }: { store: Store }) {
  const [view, setView] = useState<'main' | 'foods'>('main')
  const [editingBaby, setEditingBaby] = useState(false)
  const [today] = useState(() => toDateStr(new Date()))
  const { baby } = store.data
  const foodCount = summarizeFoods(store.data).length

  if (view === 'foods') return <FirstFoodsPage store={store} onBack={() => setView('main')} />

  const reset = async () => {
    if (!confirm('재고, 기록, 사진, 아기 정보를 모두 지울까요?')) return
    if (!confirm('정말 지울까요? 되돌릴 수 없어요.\n필요하면 먼저 백업해 두세요.')) return
    await store.resetAll()
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>설정</h1>
      </header>

      <section className="group">
        <h2>아기 정보</h2>
        {editingBaby || !baby ? (
          <div className="backup-card">
            <BabyForm
              initial={baby}
              submitLabel="저장"
              onSubmit={(b) => {
                store.setBaby(b)
                setEditingBaby(false)
              }}
              onCancel={baby ? () => setEditingBaby(false) : undefined}
            />
          </div>
        ) : (
          <ul className="list">
            <li className="row">
              <button className="row-link" onClick={() => setEditingBaby(true)}>
                <span className="row-name">
                  {baby.name}
                  <span className="row-sub">
                    {baby.birthDate.replaceAll('-', '.')} 출생 · 생후{' '}
                    {formatAge(baby.birthDate, today)}
                  </span>
                </span>
                <span className="row-action">수정</span>
              </button>
            </li>
          </ul>
        )}
      </section>

      <section className="group">
        <h2>기록</h2>
        <ul className="list">
          <li className="row">
            <button className="row-link" onClick={() => setView('foods')}>
              <span className="row-name">먹어본 재료</span>
              <span className="row-count">{foodCount}가지</span>
              <span className="chevron">›</span>
            </button>
          </li>
        </ul>
      </section>

      <BackupSection store={store} />

      <section className="group">
        <h2>데이터 초기화</h2>
        <button className="danger-btn flat" onClick={reset}>
          모든 데이터 지우기
        </button>
      </section>

      <section className="group">
        <h2>앱 정보</h2>
        <ul className="list">
          <li className="row">
            <span className="row-name">버전</span>
            <span className="row-count">{__APP_COMMIT__}</span>
          </li>
          <li className="row">
            <span className="row-name">배포 시각</span>
            <span className="row-count">{BUILT_AT_LABEL}</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
