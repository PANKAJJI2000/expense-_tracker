import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(
      mode === 'production'
        ? 'https://expense-tracker-backend-48vm.onrender.com/api'
        : 'http://localhost:3000/api'
    )
  },
  server: {
    headers: {
      'Cache-Control': 'no-store',
    },
  }
}))