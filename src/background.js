// Fondo animado en un <canvas> fijo: campo de estrellas con profundidad,
// constelaciones, estrellas fugaces y ondas.
//
// Rendimiento: halos con sprites pre-renderizados (sin shadowBlur), DPR limitado,
// densidad proporcional al área, pausa con la pestaña oculta y un frame estático
// si el usuario prefiere menos movimiento.

import { prefersReducedMotion } from './lib/utils.js'

const canvas = document.getElementById('waves-canvas')
const ctx = canvas?.getContext('2d')

// 'accent' = color del tema activo (variables CSS --accent-*, ver style.css).
const COLORS = ['#ffffff', '#ffffff', '#ffffff', 'accent', 'accent']
const LINK_DISTANCE = 120
const WAVES = [
  { y: 0.85, length: 0.002, amplitude: 60, speed: 0.3, color: '#ffffff', alpha: 0.12 },
  { y: 0.88, length: 0.003, amplitude: 80, speed: 0.36, color: 'accent', alpha: 0.2 },
  { y: 0.92, length: 0.0015, amplitude: 90, speed: 0.24, color: '#ffffff', alpha: 0.08 },
  { y: 0.95, length: 0.0025, amplitude: 70, speed: 0.45, color: 'accent', alpha: 0.2 }
]

let width = 0
let height = 0
let stars = []
let meteors = []
let rafId = 0
let lastFrame = 0
let time = 0
let nextMeteor = 4
let ripples = []

// Parallax suavizado (ratón + scroll)
const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
let scrollOffset = 0

/** Halo radial pre-renderizado: drawImage es mucho más barato que shadowBlur. */
function createSprite(color) {
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, '#fff')
  grad.addColorStop(0.18, '#fff')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.33)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  // Tinte: conserva la forma del halo y aplica el color (vale cualquier color CSS).
  g.globalCompositeOperation = 'source-in'
  g.fillStyle = color
  g.fillRect(0, 0, size, size)
  return c
}

const sprites = { '#ffffff': createSprite('#ffffff'), accent: createSprite('#a5b4fc') }

// Color del tema: se lee del CSS cada frame (durante la transición va cambiando)
// y el sprite tintado se regenera como mucho cada 80 ms.
const rootStyle = getComputedStyle(document.documentElement)
const accent = { line: '#a5b4fc', wave: '#818cf8', sprite: '', builtAt: -1 }

function readAccent() {
  accent.line = rootStyle.getPropertyValue('--accent-300').trim() || accent.line
  accent.wave = rootStyle.getPropertyValue('--accent-400').trim() || accent.wave
  if (accent.line !== accent.sprite && time - accent.builtAt > 0.08) {
    sprites.accent = createSprite(accent.line)
    accent.sprite = accent.line
    accent.builtAt = time
  }
}

function createStar() {
  // z: profundidad (0.25 lejos … 1 cerca). Define tamaño, brillo, velocidad y parallax.
  const z = Math.random() ** 1.6 * 0.75 + 0.25
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    z,
    r: 0.6 + z * 2.2,
    vx: (Math.random() - 0.5) * 0.15 * z,
    vy: (-0.05 - Math.random() * 0.12) * z,
    alpha: 0.25 + z * 0.6,
    twinkle: 0.5 + Math.random() * 2,
    phase: Math.random() * Math.PI * 2,
    color: COLORS[(Math.random() * COLORS.length) | 0]
  }
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  width = window.innerWidth
  height = window.innerHeight
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const count = Math.round(Math.min(140, Math.max(45, (width * height) / 11000)))
  stars = Array.from({ length: count }, createStar)
}

const wrap = (v, max) => ((v % max) + max) % max

function drawStars(dt) {
  const positions = []

  for (const s of stars) {
    s.x += s.vx * dt
    s.y += s.vy * dt

    // Posición en pantalla con parallax: las estrellas cercanas se desplazan más.
    const x = wrap(s.x + pointer.x * 18 * s.z, width)
    const y = wrap(s.y - scrollOffset * 0.08 * s.z + pointer.y * 18 * s.z, height)
    positions.push(x, y)

    const flicker = 0.65 + 0.35 * Math.sin(time * s.twinkle + s.phase)
    ctx.globalAlpha = s.alpha * flicker
    const size = s.r * 6
    ctx.drawImage(sprites[s.color], x - size / 2, y - size / 2, size, size)
  }

  // Constelaciones: solo entre estrellas de las capas cercanas.
  ctx.lineWidth = 0.6
  ctx.strokeStyle = accent.line
  const maxSq = LINK_DISTANCE * LINK_DISTANCE
  for (let i = 0; i < stars.length; i++) {
    if (stars[i].z < 0.55) continue
    const ax = positions[i * 2]
    const ay = positions[i * 2 + 1]
    for (let j = i + 1; j < stars.length; j++) {
      if (stars[j].z < 0.55) continue
      const dx = ax - positions[j * 2]
      const dy = ay - positions[j * 2 + 1]
      const dSq = dx * dx + dy * dy
      if (dSq > maxSq) continue
      ctx.globalAlpha = (1 - Math.sqrt(dSq) / LINK_DISTANCE) * 0.18
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(positions[j * 2], positions[j * 2 + 1])
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

function drawMeteors(dt) {
  nextMeteor -= dt / 60
  if (nextMeteor <= 0) {
    nextMeteor = 6 + Math.random() * 8
    const angle = Math.PI * (0.15 + Math.random() * 0.1)
    meteors.push({
      x: width * (0.2 + Math.random() * 0.8),
      y: -20,
      vx: -Math.cos(angle) * 9,
      vy: Math.sin(angle) * 9,
      life: 1
    })
  }

  meteors = meteors.filter((m) => m.life > 0)
  for (const m of meteors) {
    m.x += m.vx * dt
    m.y += m.vy * dt
    m.life -= 0.012 * dt

    const tail = 14
    const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.35, accent.line)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.strokeStyle = grad
    ctx.globalAlpha = 0.85 * m.life
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(m.x, m.y)
    ctx.lineTo(m.x - m.vx * tail, m.y - m.vy * tail)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** Onda que se expande desde el centro al cambiar de tema (de juego). */
function drawRipples(dt) {
  ripples = ripples.filter((r) => r.life > 0)
  const max = Math.hypot(width, height) / 2
  ctx.strokeStyle = accent.wave
  for (const r of ripples) {
    r.life -= 0.009 * dt
    const p = 1 - r.life
    ctx.globalAlpha = r.life * 0.22
    ctx.lineWidth = 1 + r.life * 2
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, p * max, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawWaves() {
  WAVES.forEach((wave, i) => {
    ctx.beginPath()
    for (let x = 0; x <= width + 12; x += 12) {
      const dx = x * wave.length
      const y = height * wave.y +
        Math.sin(dx + time * wave.speed + i) * wave.amplitude +
        Math.sin(dx * 0.5 - time * wave.speed * 0.5) * wave.amplitude * 0.3
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    // Trazo ancho y tenue + trazo fino = brillo sin shadowBlur.
    ctx.strokeStyle = wave.color === 'accent' ? accent.wave : wave.color
    ctx.globalAlpha = wave.alpha * 0.35
    ctx.lineWidth = 8
    ctx.stroke()
    ctx.globalAlpha = wave.alpha
    ctx.lineWidth = 2
    ctx.stroke()
  })
  ctx.globalAlpha = 1
}

function draw(dt) {
  pointer.x += (pointer.tx - pointer.x) * 0.04 * dt
  pointer.y += (pointer.ty - pointer.y) * 0.04 * dt
  scrollOffset = window.scrollY
  readAccent()

  ctx.clearRect(0, 0, width, height)
  drawStars(dt)
  if (dt) { drawMeteors(dt); drawRipples(dt) }
  drawWaves()
}

function loop(now) {
  // dt normalizado a 60 fps: misma velocidad en pantallas de 60/120/144 Hz.
  const dt = lastFrame ? Math.min((now - lastFrame) / 16.67, 3) : 1
  lastFrame = now
  time += dt / 60
  draw(dt)
  rafId = requestAnimationFrame(loop)
}

function start() {
  if (rafId || prefersReducedMotion) return
  lastFrame = 0
  rafId = requestAnimationFrame(loop)
}

function stop() {
  cancelAnimationFrame(rafId)
  rafId = 0
}

if (ctx) {
  resize()
  draw(0)

  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => { resize(); draw(0) }, 150)
  })

  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      pointer.tx = e.clientX / width - 0.5
      pointer.ty = e.clientY / height - 0.5
    }, { passive: true })
  }

  new MutationObserver(() => { if (rafId) ripples.push({ life: 1 }) })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()))

  // Arranca cuando el navegador está libre para no competir con la carga inicial.
  ;(window.requestIdleCallback || ((cb) => setTimeout(cb, 200)))(start)
}
