import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

// 설정 탭의 '앱 정보'에 보여줄 빌드 정보
function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 상대 경로로 빌드해서 GitHub Pages 저장소 이름과 상관없이 동작하게 함
  base: './',
  define: {
    __APP_COMMIT__: JSON.stringify(gitCommit()),
    __APP_BUILT_AT__: JSON.stringify(new Date().toISOString()),
  },
})
