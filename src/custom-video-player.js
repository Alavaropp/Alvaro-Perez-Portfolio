// Reproductor HTML5 con controles personalizados (play, progreso, volumen, pantalla completa).
//
//   const player = createVideoPlayer(container, { src, poster })
//   player.destroy()   // libera listeners y observers al cambiar de medio

import { playWhenVisible } from './lib/utils.js'

const ICONS = {
  play: '<path d="M8 5v14l11-7z"/>',
  pause: '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>',
  muted: '<path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>',
  sound: '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>',
  expand: '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>'
}

const icon = (name) => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS[name]}</svg>`

const fmtTime = (s) => {
  if (!Number.isFinite(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function createVideoPlayer(container, { src, poster, loop = true, muted = true, autoplay = true }) {
  const root = document.createElement('div')
  root.className = 'vp is-loading'
  root.innerHTML = `
    <video class="vp-video" playsinline preload="metadata"></video>
    <div class="vp-spinner" aria-hidden="true"></div>
    <div class="vp-bar">
      <button type="button" class="vp-btn vp-play" aria-label="Reproducir">${icon('play')}</button>
      <span class="vp-time vp-current">0:00</span>
      <div class="vp-progress" role="slider" aria-label="Progreso" tabindex="0">
        <div class="vp-track"><div class="vp-buffered"></div><div class="vp-played"></div><div class="vp-handle"></div></div>
      </div>
      <span class="vp-time vp-total">0:00</span>
      <button type="button" class="vp-btn vp-mute" aria-label="Activar sonido">${icon('muted')}</button>
      <div class="vp-volume" role="slider" aria-label="Volumen" tabindex="0">
        <div class="vp-track"><div class="vp-level"></div></div>
      </div>
      <button type="button" class="vp-btn vp-fs" aria-label="Pantalla completa">${icon('expand')}</button>
    </div>`
  container.appendChild(root)

  const $ = (sel) => root.querySelector(sel)
  const video = $('.vp-video')
  const playBtn = $('.vp-play')
  const muteBtn = $('.vp-mute')
  const progress = $('.vp-progress')
  const volume = $('.vp-volume')
  const played = $('.vp-played')
  const handle = $('.vp-handle')
  const buffered = $('.vp-buffered')
  const level = $('.vp-level')
  const current = $('.vp-current')
  const total = $('.vp-total')

  video.loop = loop
  video.muted = muted
  if (poster) video.poster = poster
  video.src = src

  // ---- Sincronización de estado ----
  const syncPlay = () => {
    const paused = video.paused
    playBtn.innerHTML = icon(paused ? 'play' : 'pause')
    playBtn.setAttribute('aria-label', paused ? 'Reproducir' : 'Pausar')
    root.classList.toggle('is-paused', paused)
  }
  const syncVolume = () => {
    const silent = video.muted || video.volume === 0
    muteBtn.innerHTML = icon(silent ? 'muted' : 'sound')
    muteBtn.setAttribute('aria-label', silent ? 'Activar sonido' : 'Silenciar')
    level.style.transform = `scaleX(${silent ? 0 : video.volume})`
  }
  const syncTime = () => {
    const pct = video.duration ? video.currentTime / video.duration : 0
    played.style.transform = `scaleX(${pct})`
    handle.style.left = `${pct * 100}%`
    current.textContent = fmtTime(video.currentTime)
  }

  video.addEventListener('play', syncPlay)
  video.addEventListener('pause', syncPlay)
  video.addEventListener('volumechange', syncVolume)
  video.addEventListener('timeupdate', syncTime)
  video.addEventListener('loadedmetadata', () => { total.textContent = fmtTime(video.duration) })
  video.addEventListener('waiting', () => root.classList.add('is-loading'))
  video.addEventListener('playing', () => root.classList.remove('is-loading'))
  video.addEventListener('canplay', () => root.classList.remove('is-loading'))
  video.addEventListener('progress', () => {
    if (video.buffered.length && video.duration) {
      buffered.style.transform = `scaleX(${video.buffered.end(video.buffered.length - 1) / video.duration})`
    }
  })

  const togglePlay = () => (video.paused ? video.play().catch(() => {}) : video.pause())

  // ---- Controles ----
  video.addEventListener('click', togglePlay)
  playBtn.addEventListener('click', togglePlay)
  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted
    if (!video.muted && video.volume === 0) video.volume = 0.7
  })
  $('.vp-fs').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else (root.requestFullscreen?.() ?? video.webkitEnterFullscreen?.())
  })

  // Arrastre con pointer capture: sin listeners globales en document.
  function draggable(el, onValue) {
    const valueAt = (e) => {
      const r = el.getBoundingClientRect()
      return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    }
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId)
      onValue(valueAt(e))
    })
    el.addEventListener('pointermove', (e) => {
      if (el.hasPointerCapture(e.pointerId)) onValue(valueAt(e))
    })
  }

  draggable(progress, (v) => { if (video.duration) video.currentTime = v * video.duration })
  draggable(volume, (v) => {
    video.volume = v
    video.muted = v === 0
  })

  progress.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') video.currentTime += 5
    if (e.key === 'ArrowLeft') video.currentTime -= 5
  })
  volume.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { video.volume = Math.min(1, video.volume + 0.1); video.muted = false }
    if (e.key === 'ArrowLeft') video.volume = Math.max(0, video.volume - 0.1)
  })

  // Controles visibles al mover el ratón; se ocultan tras 2.5 s de inactividad.
  let hideTimer
  const showControls = () => {
    root.classList.add('show-controls')
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => root.classList.remove('show-controls'), 2500)
  }
  root.addEventListener('pointermove', showControls)
  root.addEventListener('focusin', showControls)

  syncPlay()
  syncVolume()

  const stopWatching = autoplay ? playWhenVisible(video, root) : () => {}

  return {
    video,
    destroy() {
      stopWatching()
      clearTimeout(hideTimer)
      video.pause()
      video.removeAttribute('src')
      video.load() // corta la descarga en curso
      root.remove()
    }
  }
}
