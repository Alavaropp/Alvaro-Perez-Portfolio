// Hero de la home: animación de entrada, carrusel de títulos y carrusel de juegos.

import { gsap } from 'gsap'
import { asset, posterFor, prefersReducedMotion, watchVisibility } from './lib/utils.js'

const TICK_SECONDS = 3

const TITLES = [
  'UI/UX Designer',
  'Unity Developer',
  'Game Designer',
  'System Designer',
  'Gameplay Programmer',
  'System Programmer'
]

const GAMES = [
  { title: 'Prelude: Dark Pain', video: 'images/games/juego1/prelude-trailer.mp4' },
  { title: 'A Reason to Exist', video: 'images/games/juego2/reason-trailer.mp4' },
  { title: 'Below the Surface', video: 'images/games/juego3/below-trailer.mp4' },
  { title: 'EvadTale', video: 'images/games/juego4/evadtale-trailer.mp4' },
  { title: 'Sacramento', image: 'images/games/juego5/portada.webp' }
]

const hero = document.getElementById('hero')
const isDesktop = window.matchMedia('(min-width: 768px)')

// ---------------------------------------------------------------------------
// Carrusel infinito genérico: 3 copias de la lista y salto invisible al
// llegar a los extremos.
// ---------------------------------------------------------------------------
function createLoopCarousel({ container, track, count, direction, render, onActivate }) {
  const items = []
  for (let copy = 0; copy < 3; copy++) {
    for (let i = 0; i < count; i++) {
      const el = render(i)
      track.appendChild(el)
      items.push(el)
    }
  }

  let active = count + 1
  let itemHeight = 0

  function layout() {
    itemHeight = container.offsetHeight / 3
    items.forEach((el) => { el.style.height = `${itemHeight}px` })
    update(false)
  }

  function update(animate = true) {
    const y = -(active * itemHeight) + container.offsetHeight / 2 - itemHeight / 2
    gsap.to(track, {
      y,
      duration: animate ? 0.8 : 0,
      ease: 'power3.inOut',
      onComplete: wrap
    })
    items.forEach((el, i) => onActivate(el, Math.abs(i - active), animate))
  }

  function wrap() {
    if (active >= count * 2) active -= count
    else if (active < count) active += count
    else return
    update(false)
  }

  layout()

  return {
    items,
    layout,
    get activeIndex() { return active },
    step() {
      active += direction
      update(true)
    }
  }
}

// ---- Títulos ----
function initTitleCarousel() {
  return createLoopCarousel({
    container: document.getElementById('title-carousel'),
    track: document.getElementById('title-track'),
    count: TITLES.length,
    direction: 1,
    render(i) {
      const li = document.createElement('li')
      li.textContent = TITLES[i]
      li.className = 'title-item'
      return li
    },
    onActivate(el, distance, animate) {
      gsap.to(el, {
        opacity: distance === 0 ? 1 : distance === 1 ? 0.4 : 0.12,
        color: distance === 0 ? '#ffffff' : '#64748b',
        duration: animate ? 0.5 : 0
      })
    }
  })
}

// ---- Juegos ----
function initGameCarousel() {
  const sections = document.querySelectorAll('[data-project-section]')

  const carousel = createLoopCarousel({
    container: document.getElementById('image-carousel'),
    track: document.getElementById('image-track'),
    count: GAMES.length,
    direction: -1,
    render(i) {
      const game = GAMES[i]
      const li = document.createElement('li')
      li.className = 'game-item'
      li.dataset.index = i

      const media = game.video
        ? `<video muted loop playsinline preload="none" poster="${posterFor(asset(game.video))}"
             data-src="${asset(game.video.replace(/\.mp4$/, '-preview.mp4'))}"></video>`
        : `<img src="${asset(game.image)}" alt="" loading="lazy" decoding="async" />`

      li.innerHTML = `
        <button type="button" class="game-card" tabindex="-1" aria-label="Ver ${game.title}">
          ${media}
          <span class="game-card__title">${game.title}</span>
        </button>`
      li.querySelector('button').addEventListener('click', () => {
        sections[i]?.scrollIntoView({ behavior: 'smooth' })
      })
      return li
    },
    onActivate(el, distance, animate) {
      gsap.to(el, {
        scale: distance === 0 ? 1.3 : distance === 1 ? 0.6 : 0.4,
        opacity: distance === 0 ? 1 : distance === 1 ? 0.35 : 0.08,
        duration: animate ? 0.5 : 0
      })

      // Solo la tarjeta activa reproduce su clip; el resto muestra el póster.
      const video = el.querySelector('video')
      if (!video) return
      if (distance === 0 && carouselRunning) {
        if (!video.src) video.src = video.dataset.src
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }
  })

  return carousel
}

// ---------------------------------------------------------------------------
// Animación de entrada
// ---------------------------------------------------------------------------
let carouselRunning = false
let heroVisible = true
let introDone = false
let titles
let games
let tickCall

function tick() {
  titles.step()
  games?.step()
  tickCall = gsap.delayedCall(TICK_SECONDS, tick)
}

function activeVideo() {
  return games?.items[games.activeIndex].querySelector('video')
}

/** Arranca o detiene los carruseles según la intro y la visibilidad del hero. */
function syncCarousels() {
  const shouldRun = introDone && heroVisible
  if (shouldRun === carouselRunning) return
  carouselRunning = shouldRun
  tickCall?.kill()

  const video = activeVideo()
  if (shouldRun) {
    if (video) { video.src ||= video.dataset.src; video.play().catch(() => {}) }
    if (!prefersReducedMotion) tickCall = gsap.delayedCall(TICK_SECONDS, tick)
  } else {
    video?.pause()
  }
}

function onIntroDone() {
  introDone = true
  syncCarousels()
}

/** Efecto máquina de escribir (respeta saltos de línea, a diferencia de TextPlugin). */
function typeText(el, text, duration) {
  const state = { n: 0 }
  return gsap.to(state, {
    n: text.length,
    duration,
    ease: 'none',
    onUpdate: () => { el.textContent = text.slice(0, Math.round(state.n)) }
  })
}

/** Guarda el texto del HTML y lo vacía para "teclearlo" después. */
function takeText(el) {
  const text = el.textContent.trim().replace(/[ \t]*\n[ \t]*/g, '\n')
  el.textContent = ''
  return text
}

function playIntro() {
  const username = document.getElementById('typed-username')
  const name = document.getElementById('typed-name')
  const descTitle = document.getElementById('description-title')
  const descBody = document.getElementById('description-body')

  if (prefersReducedMotion) {
    gsap.set('[data-intro]', { opacity: 1, y: 0, scale: 1 })
    onIntroDone()
    return
  }

  const texts = [username, name, descTitle, descBody].map(takeText)
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

  tl.to('#avatar', { opacity: 1, scale: 1, duration: 0.8 })
    .add(typeText(username, texts[0], 0.5), '-=0.4')
    .add(typeText(name, texts[1], 0.8))
    .to('#divider', { scaleX: 1, duration: 0.5 }, '-=0.3')
    .to('#title-section', { opacity: 1, y: 0, duration: 0.7 }, '-=0.3')
    .to('#image-section', { opacity: 1, y: 0, duration: 0.7, onComplete: onIntroDone }, '-=0.5')
    .to('#description-section', { opacity: 1, y: 0, duration: 0.5 }, '-=0.4')
    .add(typeText(descTitle, texts[2], 0.4))
    .add(typeText(descBody, texts[3], 2.6))
    .to('#hero-actions', { opacity: 1, y: 0, duration: 0.5 }, '-=1.2')
    .to('#tools-section', { opacity: 1, y: 0, duration: 0.5 }, '-=0.8')
    .fromTo('.tool-icon', { opacity: 0, y: 12, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.7)' }, '<')
    .to('#scroll-hint', { opacity: 1, duration: 0.6 })

  gsap.to('#cursor', { opacity: 0, duration: 0.5, repeat: -1, yoyo: true, ease: 'steps(1)' })
}

// ---------------------------------------------------------------------------

export function initHero() {
  if (!hero) return

  titles = initTitleCarousel()

  const setupGames = () => {
    if (games || !isDesktop.matches) return
    games = initGameCarousel()
  }
  setupGames()
  isDesktop.addEventListener('change', setupGames)

  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => { titles.layout(); games?.layout() }, 150)
  })

  playIntro()

  // Los carruseles solo trabajan mientras el hero está en pantalla.
  watchVisibility(hero, {
    threshold: 0.2,
    onEnter: () => { heroVisible = true; syncCarousels() },
    onLeave: () => { heroVisible = false; syncCarousels() }
  })
}
