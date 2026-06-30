import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, path.resolve(__dirname, '../server'), '')
  const apiPort = serverEnv.PORT || '5001'
  const proxyTarget = `http://localhost:${apiPort}`

  const proxyConfig = {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: proxyConfig,
    },
    preview: {
      proxy: proxyConfig,
    },
  }
})
