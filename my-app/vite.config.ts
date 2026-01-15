import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { copyFileSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        copyFileSync(
          join(__dirname, 'public', '_redirects'),
          join(__dirname, 'dist', '_redirects')
        )
      }
    }
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  base: '/',
  publicDir: 'public',
})
