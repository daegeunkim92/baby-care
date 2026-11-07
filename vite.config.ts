import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 상대 경로로 빌드해서 GitHub Pages 저장소 이름과 상관없이 동작하게 함
  base: './',
})
