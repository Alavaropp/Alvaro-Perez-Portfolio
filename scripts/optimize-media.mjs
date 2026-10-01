// Genera los medios optimizados para la web a partir de los originales.
//
//   media-src/games/<juego>/*.{png,jpg,mp4}  ->  public/images/games/<juego>/
//
// Imágenes -> <nombre>.webp (máx. 1920px) + thumbs/<nombre>.webp (320px)
// Vídeos   -> <nombre>.mp4 (H.264 CRF 24, faststart)
//             <nombre>-preview.mp4 (clip de 8 s, 1280px, sin audio, para el carrusel)
//             <nombre>-poster.webp (fotograma usado como póster) + thumbs/<nombre>-poster.webp
//
// Uso: npm run media   (requiere ffmpeg en el PATH o en la variable FFMPEG_PATH)
// Solo se regeneran los archivos cuyo original es más reciente que la salida.

import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'media-src/games'
const OUT = 'public/images/games'
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe'
const force = process.argv.includes('--force')

const isStale = (src, out) =>
  force || !fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs

const ffmpeg = (...args) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })

function duration(file) {
  try {
    return parseFloat(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString())
  } catch {
    return 60 // sin ffprobe: asumimos un vídeo de ~1 min
  }
}

const CLIP_SECONDS = 8

/**
 * Inicio del mejor tramo para el clip del carrusel. Cada 0,5 s puntúa el fotograma
 * por brillo (descarta fundidos a negro) y detalle/entropía (descarta fondos lisos
 * de transición), y elige la ventana cuyo peor fotograma sea el mejor,
 * entre el 15 % y el 85 % del vídeo (evita intros y créditos).
 */
function bestClipStart(file) {
  const fallback = (duration(file) * 0.25).toFixed(2)
  const { stderr = '' } = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-an', '-vf',
    'fps=2,scale=160:-2,signalstats,entropy,metadata=print', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 256 << 20 })
  const read = (re) => [...stderr.matchAll(re)].map((m) => parseFloat(m[1]))
  const luma = read(/signalstats\.YAVG=([\d.]+)/g)
  const detail = read(/normalized_entropy\.normal\.Y=([\d.]+)/g)
  const quality = luma.map((y, i) => Math.min(y, 80) / 80 * (detail[i] ?? 1))

  const win = CLIP_SECONDS * 2
  if (quality.length < win * 2) return fallback

  let best = { score: -1, i: 0 }
  for (let i = Math.floor(quality.length * 0.15); i + win <= quality.length * 0.85; i++) {
    const slice = quality.slice(i, i + win)
    const score = Math.min(...slice) + 0.1 * (slice.reduce((a, b) => a + b) / win)
    if (score > best.score) best = { score, i }
  }
  return (best.i / 2).toFixed(2)
}

async function image(src, dir, name) {
  const full = path.join(dir, `${name}.webp`)
  const thumb = path.join(dir, 'thumbs', `${name}.webp`)
  const isLogo = name.includes('logo')

  if (isStale(src, full)) {
    await sharp(src).resize({ width: isLogo ? 1000 : 1920, withoutEnlargement: true })
      .webp({ quality: isLogo ? 90 : 80, alphaQuality: 100 }).toFile(full)
    console.log('  img  ', full)
  }
  if (!isLogo && isStale(src, thumb)) {
    await sharp(src).resize({ width: 320, withoutEnlargement: true }).webp({ quality: 72 }).toFile(thumb)
  }
}

async function video(src, dir, name) {
  const full = path.join(dir, `${name}.mp4`)
  const preview = path.join(dir, `${name}-preview.mp4`)
  const poster = path.join(dir, `${name}-poster.webp`)

  if (isStale(src, full)) {
    console.log('  video', full)
    ffmpeg('-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-maxrate', '4500k', '-bufsize', '9000k',
      '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', full)
  }
  // Póster y clip comparten fotograma inicial: el póster se funde con el vídeo sin salto.
  const start = isStale(src, preview) || isStale(src, poster) ? bestClipStart(src) : 0

  if (isStale(src, preview)) {
    ffmpeg('-ss', start, '-t', String(CLIP_SECONDS), '-i', src, '-an', '-vf', 'scale=1280:-2,fps=30', '-c:v', 'libx264', '-preset', 'slow',
      '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', preview)
  }
  if (isStale(src, poster)) {
    const tmp = path.join(dir, `${name}-poster.png`)
    ffmpeg('-ss', start, '-i', src, '-frames:v', '1', '-vf', 'scale=1280:-2', tmp)
    await sharp(tmp).webp({ quality: 75 }).toFile(poster)
    fs.rmSync(tmp)
  }
  const posterThumb = path.join(dir, 'thumbs', `${name}-poster.webp`)
  if (isStale(poster, posterThumb)) {
    await sharp(poster).resize({ width: 320 }).webp({ quality: 72 }).toFile(posterThumb)
  }
}

for (const game of fs.readdirSync(SRC)) {
  const dir = path.join(OUT, game)
  fs.mkdirSync(path.join(dir, 'thumbs'), { recursive: true })
  console.log(game)

  for (const file of fs.readdirSync(path.join(SRC, game))) {
    const src = path.join(SRC, game, file)
    const { name, ext } = path.parse(file)
    if (/\.(png|jpe?g)$/i.test(ext)) await image(src, dir, name)
    else if (/\.mp4$/i.test(ext)) await video(src, dir, name)
  }
}
