import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/admin': 'http://localhost:8000',
      '/orders': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
      '/products': 'http://localhost:8000',
    }
  }
})
