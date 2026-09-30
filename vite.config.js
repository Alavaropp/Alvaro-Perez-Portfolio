import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        juego1: resolve(import.meta.dirname, 'projects/juego1.html'),
        juego2: resolve(import.meta.dirname, 'projects/juego2.html'),
        juego3: resolve(import.meta.dirname, 'projects/juego3.html'),
        juego4: resolve(import.meta.dirname, 'projects/juego4.html'),
        juego5: resolve(import.meta.dirname, 'projects/juego5.html'),
      },
    },
  },
})