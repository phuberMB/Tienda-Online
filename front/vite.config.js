import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/products': 'http://web:8000',
      '/orders': 'http://web:8000',
      '/auth': 'http://web:8000',
      '/admin': 'http://web:8000',
    }
  }
})
