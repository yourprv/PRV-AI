import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  base: mode === 'production' ? '/' : './',
  plugins: [inspectAttr(), react()],
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY': JSON.stringify(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || env.VITE_TURNSTILE_SITE_KEY || ''),
    },
  }
})
