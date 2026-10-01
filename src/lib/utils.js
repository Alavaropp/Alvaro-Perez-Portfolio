// Utilidades compartidas entre la home y las páginas de proyecto.

const BASE = import.meta.env.BASE_URL

/** Ruta pública relativa ("images/x.webp") -> URL con el base de GitHub Pages. */
export const asset = (path) => BASE + path.replace(/^\//, '')

/** Póster generado por scripts/optimize-media.mjs para cada vídeo. */
export const posterFor = (videoSrc) => videoSrc.replace(/\.mp4$/, '-poster.webp')

export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Ejecuta `onEnter`/`onLeave` cuando el elemento entra o sale del viewport.
 * Devuelve una función para dejar de observar.
 */
export function watchVisibility(el, { onEnter, onLeave, rootMargin = '0px', threshold = 0, once = false }) {
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      onEnter?.(entry)
      if (once) io.disconnect()
    } else {
      onLeave?.(entry)
    }
  }, { rootMargin, threshold })
  io.observe(el)
  return () => io.disconnect()
}

/** Reproduce un vídeo solo mientras es visible (ahorra CPU/GPU y batería). */
export function playWhenVisible(video, target = video, threshold = 0.25) {
  return watchVisibility(target, {
    threshold,
    onEnter: () => video.play().catch(() => {}),
    onLeave: () => video.pause()
  })
}

/** Botones .copy-email-btn: copian el email y muestran feedback temporal. */
export function initCopyEmail() {
  document.querySelectorAll('.copy-email-btn').forEach((btn) => {
    const label = btn.querySelector('.email-btn-text')
    const original = label?.textContent
    btn.addEventListener('click', async () => {
      // Si el portapapeles no está disponible, se muestra el email para copiarlo a mano.
      let delay = 2000
      try {
        await navigator.clipboard.writeText(btn.dataset.email)
        if (label) label.textContent = '¡Email copiado!'
      } catch {
        if (label) label.textContent = btn.dataset.email
        delay = 6000
      }
      setTimeout(() => { if (label) label.textContent = original }, delay)
    })
  })
}
