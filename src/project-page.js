// Entrada de las páginas de detalle de proyecto (projects/*.html).
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import './style.css'
import './background.js'
import { initGallery } from './gallery.js'
import { initCopyEmail, playWhenVisible, prefersReducedMotion } from './lib/utils.js'

// Vídeo de cabecera: se pausa cuando sale de pantalla.
const heroVideo = document.querySelector('.hero-video')
if (heroVideo) playWhenVisible(heroVideo)

initGallery(document.querySelector('.detail-main-viewer'), document.querySelectorAll('#galeria .thumb-btn'))
initCopyEmail()

// Aparición suave de cada sección al entrar en pantalla (solo CSS + IntersectionObserver).
if (!prefersReducedMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-revealed')
      io.unobserve(entry.target)
    })
  }, { rootMargin: '0px 0px -10% 0px' })

  document.querySelectorAll('.detail-section').forEach((s) => {
    s.classList.add('reveal')
    io.observe(s)
  })
}
