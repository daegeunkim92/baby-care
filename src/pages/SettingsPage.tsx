import { useState } from 'react'
import { BabyForm } from '../components/BabyForm'
import { BackupSection } from '../components/BackupSection'
import { formatAge, toDateStr } from '../date'
import { summarizeFoods } from '../foods'
import type { Store } from '../store'
import { applyUpdate, checkForUpdate } from '../update'
import { FeedbackPage } from './FeedbackPage'
import { FirstFoodsPage } from './FirstFoodsPage'

const builtAt = new Date(__APP_BUILT_AT__)
const pad = (n: number) => String(n).padStart(2, '0')
const BUILT_AT_LABEL = `${builtAt.getFullYear()}.${pad(builtAt.getMonth() + 1)}.${pad(builtAt.getDate())} ${pad(builtAt.getHours())}:${pad(builtAt.getMinutes())}`

type UpdateState = 'idle' | 'checking' | 'latest' | 'available' | 'dev' | 'error'

const UPDATE_MESSAGE: Partial<Record<UpdateState, string>> = {
  latest: '최신 버전이에요.',
  dev: '개발 서버에서는 확인할 수 없어요.',
  error: '확인하지 못했어요. 인터넷 연결을 확인해 주세요.',
}

export function SettingsPage({ store }: { store: Store }) {
  const [view, setView] = useState<'main' | 'foods' | 'feedback'>('main')
  const [editingBaby, setEditingBaby] = useState(false)
  const [today] = useState(() => toDateStr(new Date()))
  const [update, setUpdate] = useState<UpdateState>('idle')

  const check = async () => {
    setUpdate('checking')
    try {
      setUpdate(await checkForUpdate())
    } catch {
      setUpdate('error')
    }
  }
  const { baby } = store.data
  const foodCount = summarizeFoods(store.data).length

  if (view === 'foods') return <FirstFoodsPage store={store} onBack={() => setView('main')} />
  if (view === 'feedback') return <FeedbackPage onBack={() => setView('main')} />

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
          <li className="row">
            {update === 'available' ? (
              <>
                <span className="row-name update-available">새 버전이 있어요</span>
                <button className="primary-btn small" onClick={applyUpdate}>
                  업데이트
                </button>
              </>
            ) : (
              <>
                <button
                  className="row-link text-btn"
                  onClick={check}
                  disabled={update === 'checking'}
                >
                  {update === 'checking' ? '확인 중…' : '최신 버전 확인'}
                </button>
                {UPDATE_MESSAGE[update] && (
                  <span className="row-count">{UPDATE_MESSAGE[update]}</span>
                )}
              </>
            )}
          </li>
          <li className="row">
            <button className="row-link" onClick={() => setView('feedback')}>
              <span className="row-name">기능 제안하기</span>
              <span className="chevron">›</span>
            </button>
          </li>
        </ul>
        <p className="hint left">
          배포하고 1~2분 뒤부터 새 버전이 보여요. 업데이트해도 데이터는 그대로예요.
        </p>
      </section>
    </div>
  )
}
