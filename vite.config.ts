import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Cho phép truy cập từ các thiết bị khác trong cùng mạng LAN
    port: 3000
  }
})