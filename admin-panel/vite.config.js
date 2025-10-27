import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  define: {
    // 'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000')
    'process.env.VITE_API_URL': JSON.stringify(
    process.env.NODE_ENV === 'production'
      ? 'https://expense-tracker-backend-48vm.onrender.com/api'
      : 'http://localhost:3000/api'
  )
  }
})