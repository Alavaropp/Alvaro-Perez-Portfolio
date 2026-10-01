// Galería: visor principal + miniaturas (.thumb-btn con data-type y data-src).
// El primer medio solo se crea cuando el visor se acerca al viewport, y los cambios
// hacen un fundido cruzado sin parpadeos (la imagen se decodifica antes de mostrarse).

import { createVideoPlayer } from './custom-video-player.js'
import { asset, posterFor, watchVisibility } from './lib/utils.js'

export function initGallery(viewer, thumbs) {
  thumbs = [...thumbs]
  if (!viewer || !thumbs.length) return

  let current = null // { el, destroy }
  let token = 0

  async function show(thumb) {
    thumbs.forEach((t) => t.setAttribute('aria-current', String(t === thumb)))

    const src = asset(thumb.dataset.src)
    if (current?.src === src) return
    const myToken = ++token

    let next
    if (thumb.dataset.type === 'video') {
      const holder = document.createElement('div')
      holder.className = 'gallery-media'
      const player = createVideoPlayer(holder, { src, poster: posterFor(src) })
      next = { el: holder, src, destroy: () => { player.destroy(); holder.remove() } }
    } else {
      const img = new Image()
      img.className = 'gallery-media object-cover'
      img.alt = thumb.querySelector('img')?.alt || ''
      img.src = src
      await img.decode().catch(() => {})
      next = { el: img, src, destroy: () => img.remove() }
    }

    // Otra miniatura se pulsó mientras decodificábamos: descartamos esta.
    if (myToken !== token) return next.destroy()

    viewer.appendChild(next.el)
    requestAnimationFrame(() => next.el.classList.add('is-visible'))

    const prev = current
    current = next
    if (prev) setTimeout(prev.destroy, 350)
  }

  thumbs.forEach((thumb) => thumb.addEventListener('click', () => show(thumb)))

  const initial = thumbs.find((t) => t.getAttribute('aria-current') === 'true') || thumbs[0]
  thumbs.forEach((t) => t.setAttribute('aria-current', String(t === initial)))
  watchVisibility(viewer, { rootMargin: '300px', once: true, onEnter: () => show(initial) })
}
