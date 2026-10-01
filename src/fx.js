// Efectos sutiles compartidos por todas las páginas:
//  - Halo que sigue al cursor sobre el fondo y grano de película (detrás del contenido).
//  - Chispas del color del tema al pulsar botones y enlaces.
//  - Sonidos de interfaz sintetizados con Web Audio (sin archivos), desactivados
//    por defecto y con un interruptor que recuerda la preferencia.
//
// Todo respeta prefers-reduced-motion y nada intercepta eventos (pointer-events: none).

import { prefersReducedMotion } from './lib/utils.js'

const root = document.documentElement
const finePointer = window.matchMedia('(pointer: fine)').matches
const INTERACTIVE = 'a, button, [role="button"]'
const HOVER_TARGETS = '.btn, .thumb-btn, .section-dot, .mini-card, .tool-icon, .game-card'

function el(tag, className, parent = document.body) {
  const node = document.createElement(tag)
  node.className = className
  node.setAttribute('aria-hidden', 'true')
  parent.appendChild(node)
  return node
}

// ---------------------------------------------------------------------------
// Decoración: grano + halo del cursor
// ---------------------------------------------------------------------------
function initDecor() {
  el('div', 'fx-grain')
  if (!finePointer || prefersReducedMotion) return

  const glow = el('div', 'fx-cursor-glow')
  const pos = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 }
  let raf = 0

  // Interpolación suave: el halo "persigue" al cursor sin seguirlo a tirones.
  function follow() {
    pos.x += (pos.tx - pos.x) * 0.12
    pos.y += (pos.ty - pos.y) * 0.12
    glow.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
    raf = Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.5 ? requestAnimationFrame(follow) : 0
  }

  window.addEventListener('pointermove', (e) => {
    pos.tx = e.clientX
    pos.ty = e.clientY
    glow.classList.add('is-visible')
    raf ||= requestAnimationFrame(follow)
  }, { passive: true })
  document.addEventListener('pointerleave', () => glow.classList.remove('is-visible'))
}

// ---------------------------------------------------------------------------
// Partículas: pequeña ráfaga al pulsar un elemento interactivo
// ---------------------------------------------------------------------------
function initSparks() {
  if (prefersReducedMotion) return
  const layer = el('div', 'fx-layer')

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !e.target.closest(INTERACTIVE)) return
    const count = 7
    for (let i = 0; i < count; i++) {
      const spark = el('span', 'fx-spark', layer)
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6
      const dist = 18 + Math.random() * 16
      spark.style.left = `${e.clientX}px`
      spark.style.top = `${e.clientY}px`
      spark.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.9 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0.2)`, opacity: 0 }
      ], { duration: 480 + Math.random() * 160, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => spark.remove()
    }
  }, { passive: true })
}

// ---------------------------------------------------------------------------
// Sonido
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'portfolio-sound'
// Nota base por tema: cada juego "suena" distinto al llegar a su sección.
const THEME_NOTES = { prelude: 196, reason: 220, below: 146.8, evadtale: 293.7, sacramento: 164.8, otros: 261.6 }

let ctx = null
let master = null
let enabled = false

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Tono simple con envolvente (ataque/caída exponencial). */
function tone({ freq, to = freq, type = 'sine', gain = 0.05, attack = 0.005, decay = 0.12, delay = 0 }) {
  if (!enabled) return
  const ac = audio()
  const t = ac.currentTime + delay
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t + decay)
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(gain, t + attack)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  osc.connect(amp).connect(master)
  osc.start(t)
  osc.stop(t + attack + decay + 0.05)
}

const sounds = {
  hover: () => tone({ freq: 1400, type: 'sine', gain: 0.012, decay: 0.05 }),
  click: () => tone({ freq: 520, to: 260, type: 'triangle', gain: 0.05, decay: 0.09 }),
  success: () => { tone({ freq: 784, gain: 0.04, decay: 0.18 }); tone({ freq: 1175, gain: 0.035, decay: 0.3, delay: 0.09 }) },
  theme: (note) => {
    // Acorde suave (fundamental + quinta) con ataque lento: un "ambiente", no un aviso.
    tone({ freq: note, gain: 0.03, attack: 0.25, decay: 1.4 })
    tone({ freq: note * 1.5, gain: 0.018, attack: 0.3, decay: 1.2, delay: 0.05 })
  }
}

function setEnabled(value, button) {
  enabled = value
  button.setAttribute('aria-pressed', String(value))
  button.setAttribute('aria-label', value ? 'Desactivar sonido' : 'Activar sonido')
  button.title = value ? 'Sonido activado' : 'Sonido desactivado'
  try { localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off') } catch {}
}

function initSound() {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'fx-sound-toggle'
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
      <path class="fx-sound-on" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      <path class="fx-sound-off" d="m16 9 6 6m0-6-6 6" />
    </svg>`
  document.body.appendChild(button)

  let saved = 'off'
  try { saved = localStorage.getItem(STORAGE_KEY) || 'off' } catch {}
  setEnabled(saved === 'on', button)

  // Los navegadores solo permiten audio tras un gesto: el contexto se crea en la primera interacción.
  button.addEventListener('click', () => {
    setEnabled(!enabled, button)
    if (enabled) sounds.success()
  })

  let lastHover = 0
  let lastTarget = null
  document.addEventListener('pointerover', (e) => {
    if (!enabled || !finePointer) return
    const target = e.target.closest(HOVER_TARGETS)
    if (!target || target === lastTarget) return
    lastTarget = target
    const now = performance.now()
    if (now - lastHover > 70) sounds.hover()
    lastHover = now
  }, { passive: true })
  document.addEventListener('pointerout', (e) => {
    if (lastTarget && !lastTarget.contains(e.relatedTarget)) lastTarget = null
  }, { passive: true })

  document.addEventListener('click', (e) => {
    if (!enabled || e.target.closest('.fx-sound-toggle')) return
    if (e.target.closest('.copy-email-btn')) sounds.success()
    else if (e.target.closest(INTERACTIVE)) sounds.click()
  })

  // Cambio de juego en la home (nav.js cambia data-theme en <html>).
  let lastTheme = root.dataset.theme
  new MutationObserver(() => {
    const theme = root.dataset.theme
    if (theme === lastTheme) return
    lastTheme = theme
    if (THEME_NOTES[theme]) sounds.theme(THEME_NOTES[theme])
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] })
}

export function initFx() {
  initDecor()
  initSparks()
  initSound()
}
