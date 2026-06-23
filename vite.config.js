import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600, // Increase warning limit to 1.6MB (1600 kB)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase'; // Group Firebase into its own chunk
            }
            return 'vendor'; // Group other node_modules libraries together
          }
        }
      }
    }
  }
})
//node generate-sitemap.js
// firebase deploy