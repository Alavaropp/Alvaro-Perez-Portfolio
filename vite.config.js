import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = import.meta.dirname

// Cada .html de projects/ se convierte en una página: basta con añadir el archivo.
const projectPages = Object.fromEntries(
  readdirSync(resolve(root, 'projects'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => [f.replace('.html', ''), resolve(root, 'projects', f)])
)

export default defineConfig({
  base: '/Alvaro-Perez-Portfolio/',
  plugins: [tailwindcss()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        ...projectPages
      }
    }
  }
})
