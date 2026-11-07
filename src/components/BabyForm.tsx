import { useState } from 'react'
import { formatAge, toDateStr } from '../date'
import type { BabyInfo } from '../types'

interface Props {
  initial?: BabyInfo | null
  submitLabel: string
  onSubmit: (baby: BabyInfo) => void
  onCancel?: () => void
}

/** 아기 이름과 생일 입력 (처음 실행할 때와 설정에서 수정할 때 같이 씀) */
export function BabyForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? '')
  const [today] = useState(() => toDateStr(new Date()))
  const age = birthDate && birthDate <= today ? formatAge(birthDate, today) : null
  const valid = name.trim() !== '' && age !== null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (valid) onSubmit({ name: name.trim(), birthDate })
  }

  return (
    <form className="baby-form" onSubmit={submit}>
      <label className="field">
        <span>이름 (태명도 좋아요)</span>
        <input
          className="text-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 튼튼이"
          enterKeyHint="next"
        />
      </label>
      <label className="field">
        <span>생일</span>
        <input
          className="text-input"
          type="date"
          value={birthDate}
          max={today}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </label>
      {age && <p className="hint left">오늘 기준 생후 {age}</p>}
      <button type="submit" className="primary-btn wide" disabled={!valid}>
        {submitLabel}
      </button>
      {onCancel && (
        <button type="button" className="text-btn cancel-btn" onClick={onCancel}>
          취소
        </button>
      )}
    </form>
  )
}
