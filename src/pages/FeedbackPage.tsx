import { useState } from 'react'
import { toDateStr } from '../date'

const NEW_ISSUE_URL = 'https://github.com/daegeunkim92/baby-care/issues/new'

/** 원하는 기능을 적어서 GitHub 이슈로 남기기 (작성 화면을 미리 채워서 엶) */
export function FeedbackPage({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sent, setSent] = useState(false)
  const [today] = useState(() => toDateStr(new Date()))

  // 저장소가 공개라 이슈도 누구나 볼 수 있음: 아기 정보 같은 개인 정보는 붙이지 않음
  const body = `${content.trim()}\n\n---\n앱 버전: ${__APP_COMMIT__}\n보낸 날: ${today}`
  const url = `${NEW_ISSUE_URL}?${new URLSearchParams({
    title: title.trim(),
    body,
    labels: 'enhancement',
  })}`

  // 로그인하다가 채운 내용이 사라질 때를 대비해 클립보드에도 복사 (실패해도 링크는 열림)
  const copy = () => {
    navigator.clipboard?.writeText(`${title.trim()}\n\n${body}`).catch(() => {})
    setSent(true)
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="text-btn back-btn" onClick={onBack}>
          ‹ 설정
        </button>
      </header>
      <h1 className="sub-title">기능 제안하기</h1>
      <p className="hint left">
        적은 내용으로 GitHub 이슈 작성 화면이 열려요. 공개 저장소라 누구나 볼 수 있으니 아기 이름
        같은 개인 정보는 적지 마세요.
      </p>

      <div className="backup-card manual-form">
        <label className="field">
          <span>제목</span>
          <input
            className="text-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 장보기 목록을 카톡으로 보내기"
            enterKeyHint="next"
          />
        </label>
        <label className="field">
          <span>내용</span>
          <textarea
            className="text-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="어떤 기능이 있으면 좋을지, 왜 필요한지 적어 주세요."
            rows={6}
          />
        </label>
        {/* 아이폰은 스크립트로 연 새 창은 막을 수 있어서, 사용자가 직접 누르는 링크로 엶 */}
        {title.trim() ? (
          <a
            className="primary-btn wide link-btn"
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={copy}
          >
            GitHub에 보내기
          </a>
        ) : (
          <button className="primary-btn wide" disabled>
            GitHub에 보내기
          </button>
        )}
      </div>

      {sent && (
        <p className="backup-status">
          GitHub에서 'Submit new issue'를 누르면 기록돼요.
          <br />
          내용은 클립보드에도 복사해 뒀어요.
        </p>
      )}
    </div>
  )
}
