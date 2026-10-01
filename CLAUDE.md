# Portfolio Development Rules

## Tech Stack & Commands
- Stack: Vite, Tailwind CSS, GSAP, JavaScript/TypeScript
- Dev Server: `npm run dev`
- Build Check: `npm run build`
- Deployment: GitHub Pages
- Media: originals live in `media-src/games/<juego>/` (not deployed). `npm run media` (needs ffmpeg) generates WebP/thumbs/optimized MP4/previews/posters into `public/images/games/`. Never reference media-src from HTML.
- Asset paths: HTML `src` uses `/images/...` (Vite adds base); `data-src` and JS paths are relative (`images/...`) and go through `asset()` in `src/lib/utils.js`.

## Token & Coding Efficiency Rules (Ponytail style)
- Be concise. Write minimal, modular, clean code.
- Avoid rewriting entire files when fixing bugs or adding small features. Edit only target lines/functions.
- Do not inspect `node_modules/`, `dist/`, or lock files.