// 배포하면 JS 파일 이름(assets/index-해시.js)이 바뀌므로, 지금 실행 중인 파일 이름과
// 서버의 최신 index.html이 가리키는 파일 이름을 비교해서 새 버전인지 알아냄
const BUNDLE = /assets\/index-[\w-]+\.js/

function currentBundle() {
  const script = document.querySelector<HTMLScriptElement>('script[type="module"][src]')
  return script?.src.match(BUNDLE)?.[0] ?? null
}

/** 'latest': 최신 버전 / 'available': 새 버전 있음 / 'dev': 개발 서버라 비교 불가 */
export async function checkForUpdate(): Promise<'latest' | 'available' | 'dev'> {
  const current = currentBundle()
  if (!current) return 'dev'
  // GitHub Pages는 index.html을 10분 캐시하므로, 캐시를 쓰지 않고 주소도 매번 다르게 요청
  const res = await fetch(`./index.html?check=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const latest = (await res.text()).match(BUNDLE)?.[0]
  return latest && latest !== current ? 'available' : 'latest'
}

/** 새 버전으로 다시 열기. 주소가 달라야 캐시된 옛 index.html을 쓰지 않음 (데이터는 그대로) */
export function applyUpdate() {
  location.replace(`./?v=${Date.now()}`)
}
