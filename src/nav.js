// Navegación de la home: barra superior (aparece al salir del hero) e
// indicador lateral de secciones, generado a partir de [data-nav-label].

import { watchVisibility } from './lib/utils.js'

export function initNav() {
  const hero = document.getElementById('hero')
  const siteNav = document.getElementById('site-nav')
  const dotsNav = document.getElementById('section-dots')
  const sections = [...document.querySelectorAll('[data-nav-label]')]

  if (hero && siteNav) {
    watchVisibility(hero, {
      threshold: 0.35,
      onEnter: () => siteNav.classList.remove('is-visible'),
      onLeave: () => siteNav.classList.add('is-visible')
    })
  }

  document.getElementById('scroll-hint')?.addEventListener('click', () => {
    sections[1]?.scrollIntoView({ behavior: 'smooth' })
  })

  if (!dotsNav || !sections.length) return

  const dots = sections.map((section) => {
    const dot = document.createElement('a')
    dot.href = `#${section.id}`
    dot.className = 'section-dot'
    dot.innerHTML = `<span class="section-dot__label">${section.dataset.navLabel}</span>`
    dot.setAttribute('aria-label', section.dataset.navLabel)
    dotsNav.appendChild(dot)
    return dot
  })

  // Sección activa = la que ocupa el centro del viewport. Su data-theme
  // (o el tema por defecto) pasa a <html> y el CSS hace la transición de color.
  const root = document.documentElement
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const i = sections.indexOf(entry.target)
      const theme = entry.target.dataset.theme
      theme ? (root.dataset.theme = theme) : delete root.dataset.theme
      dots.forEach((d, j) => (i === j ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')))
    })
  }, { rootMargin: '-45% 0px -45% 0px' })

  sections.forEach((s) => io.observe(s))
}
