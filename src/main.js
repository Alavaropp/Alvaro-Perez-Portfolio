// Entrada de la home.
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import './style.css'
import './background.js'
import { initHero } from './hero.js'
import { initNav } from './nav.js'
import { initGallery } from './gallery.js'
import { initCopyEmail } from './lib/utils.js'

initHero()
initNav()
initCopyEmail()

document.querySelectorAll('.project-media').forEach((media) => {
  initGallery(media.querySelector('.main-viewer'), media.querySelectorAll('.thumb-btn'))
})
