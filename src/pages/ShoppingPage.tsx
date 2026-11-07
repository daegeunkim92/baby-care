import { useState } from 'react'
import type { Store } from '../store'
import { STATUS_LABEL } from '../types'

export function ShoppingPage({ store }: { store: Store }) {
  const { ingredients, extras } = store.data
  const [name, setName] = useState('')

  // 없음 → 조금 순서로
  const toBuy = ingredients
    .filter((i) => i.status !== 'plenty')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'out' ? -1 : 1))
  const cartCount =
    toBuy.filter((i) => i.inCart).length + extras.filter((e) => e.inCart).length

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    store.addExtra(name)
    setName('')
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>장보기</h1>
      </header>

      <section className="group">
        <h2>사야 할 재료</h2>
        {toBuy.length === 0 ? (
          <p className="empty">재료가 모두 넉넉해요 👍</p>
        ) : (
          <ul className="list">
            {toBuy.map((item) => (
              <li key={item.id} className="row">
                <label className={`check-row ${item.inCart ? 'done' : ''}`}>
                  <input
                    type="checkbox"
                    checked={item.inCart}
                    onChange={() => store.toggleIngredientCart(item.id)}
                  />
                  <span className="row-name">{item.name}</span>
                  <span className={`badge badge-${item.status}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="group">
        <h2>기타 (용기, 지퍼백 등)</h2>
        <form className="add-form" onSubmit={submit}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="살 것 추가"
            enterKeyHint="done"
          />
          <button type="submit" className="primary-btn" disabled={!name.trim()}>
            추가
          </button>
        </form>
        {extras.length > 0 && (
          <ul className="list">
            {extras.map((item) => (
              <li key={item.id} className="row">
                <label className={`check-row ${item.inCart ? 'done' : ''}`}>
                  <input
                    type="checkbox"
                    checked={item.inCart}
                    onChange={() => store.toggleExtraCart(item.id)}
                  />
                  <span className="row-name">{item.name}</span>
                </label>
                <button
                  className="icon-btn"
                  onClick={() => store.removeExtra(item.id)}
                  aria-label={`${item.name} 삭제`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {cartCount > 0 && (
        <div className="bottom-action">
          <button className="primary-btn wide" onClick={store.finishShopping}>
            장보기 완료 ({cartCount}개)
          </button>
          <p className="hint">체크한 재료는 '넉넉'으로 바뀌어요</p>
        </div>
      )}
    </div>
  )
}
