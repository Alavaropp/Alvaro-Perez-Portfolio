// Fondo animado: partículas + ondas en un <canvas> fijo.
// Optimizado: sin shadowBlur (muy caro por frame), DPR limitado, pausa con la
// pestaña oculta y un único frame estático si el usuario prefiere menos movimiento.

import { prefersReducedMotion } from './lib/utils.js'

const canvas = document.getElementById('waves-canvas')
const ctx = canvas?.getContext('2d', { alpha: true })

const PARTICLE_COLORS = ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.15)', 'rgba(96,165,250,0.3)', 'rgba(129,140,248,0.3)']
const WAVES = [
  { y: 0.85, length: 0.002, amplitude: 60, speed: 0.3, color: 'rgba(255,255,255,0.12)' },
  { y: 0.88, length: 0.003, amplitude: 80, speed: 0.36, color: 'rgba(96,165,250,0.14)' },
  { y: 0.92, length: 0.0015, amplitude: 90, speed: 0.24, color: 'rgba(255,255,255,0.08)' },
  { y: 0.95, length: 0.0025, amplitude: 70, speed: 0.45, color: 'rgba(129,140,248,0.14)' }
]

let width = 0
let height = 0
let particles = []
let rafId = 0
let lastFrame = 0
let time = 0

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  width = window.innerWidth
  height = window.innerHeight
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Densidad de partículas proporcional al área (menos en móvil).
  const count = Math.round(Math.min(80, (width * height) / 18000))
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
    sx: (Math.random() - 0.5) * 0.4,
    sy: (Math.random() - 0.5) * 0.4 - 0.2,
    color: PARTICLE_COLORS[(Math.random() * PARTICLE_COLORS.length) | 0]
  }))
}

function draw(dt) {
  ctx.clearRect(0, 0, width, height)

  for (const p of particles) {
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()

    p.x += p.sx * dt
    p.y += p.sy * dt
    if (p.x < 0) p.x = width
    else if (p.x > width) p.x = 0
    if (p.y < 0) p.y = height
    else if (p.y > height) p.y = 0
  }

  // Cada onda se dibuja dos veces (trazo ancho y tenue + trazo fino) para simular el brillo.
  WAVES.forEach((wave, i) => {
    ctx.beginPath()
    for (let x = 0; x <= width + 12; x += 12) {
      const dx = x * wave.length
      const y = height * wave.y +
        Math.sin(dx + time * wave.speed + i) * wave.amplitude +
        Math.sin(dx * 0.5 - time * wave.speed * 0.5) * wave.amplitude * 0.3
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = wave.color
    ctx.globalAlpha = 0.35
    ctx.lineWidth = 8
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.lineWidth = 2
    ctx.stroke()
  })
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
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()))

  // Arranca cuando el navegador está libre para no competir con la carga inicial.
  ;(window.requestIdleCallback || ((cb) => setTimeout(cb, 200)))(start)
}
