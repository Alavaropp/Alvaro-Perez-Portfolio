import './style.css'
import { gsap } from 'gsap'
import { createCustomVideoPlayer } from './custom-video-player.js'

// -------- LOCAL VIDEO MAP --------
// Maps page paths to their local MP4 files for hero and gallery sections

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')

const VIDEO_MAP = {
  '/projects/juego1': {
    heroVideo: '/images/games/juego1/prelude-trailer.mp4',
    galleryVideos: [
      { src: '/images/games/juego1/prelude-trailer.mp4', label: 'Trailer' },
      { src: '/images/games/juego1/prelude-showcase.mp4', label: 'Showcase' }
    ]
  },
  '/projects/juego2': {
    heroVideo: '/images/games/juego2/reason-trailer.mp4',
    galleryVideos: [
      { src: '/images/games/juego2/reason-trailer.mp4', label: 'Trailer' }
    ]
  },
  '/projects/juego3': {
    heroVideo: '/images/games/juego3/below-trailer.mp4',
    galleryVideos: [
      { src: '/images/games/juego3/below-trailer.mp4', label: 'Trailer' }
    ]
  },
  '/projects/juego4': {
    heroVideo: null,
    galleryVideos: []
  },
  '/projects/juego5': {
    heroVideo: null,
    galleryVideos: []
  }
};

// Detect current page
const currentPath = window.location.pathname
  .replace(basePath, '')
  .replace(/\.html$/, '')
  .replace(/\/$/, '')
const pageConfig = VIDEO_MAP[currentPath] || { heroVideo: null, galleryVideos: [] };

// -------- INITIALIZE HERO VIDEO (non-interactive, muted, looped) --------

const heroVideoContainer = document.querySelector('.project-hero-content .relative.aspect-video');

if (heroVideoContainer && pageConfig.heroVideo) {
  // Remove the existing video/img placeholder
  const existingMedia = heroVideoContainer.querySelector('video, img');
  if (existingMedia) existingMedia.remove();

  // Create a simple muted, looping background video
  const heroVideo = document.createElement('video');
  heroVideo.src = pageConfig.heroVideo;
  heroVideo.autoplay = true;
  heroVideo.loop = true;
  heroVideo.muted = true;
  heroVideo.playsInline = true;
  heroVideo.preload = 'auto';
  heroVideo.className = 'w-full h-full object-cover';
  heroVideo.style.cssText = 'position:absolute;inset:0;';

  heroVideoContainer.insertBefore(heroVideo, heroVideoContainer.firstChild);
  heroVideo.play().catch(() => {});
}

// -------- INITIALIZE GALLERY ("Un Vistazo") with custom HTML5 player --------

const detailViewer = document.querySelector('.detail-main-viewer');
const galleryThumbsContainer = detailViewer ? detailViewer.parentElement : null;

if (detailViewer && pageConfig.galleryVideos.length > 0) {
  // Remove existing placeholder content
  const existingMedia = detailViewer.querySelector('video, img, .detail-main-media');
  if (existingMedia) existingMedia.remove();

  // Create the first video as the interactive player
  const firstVideo = pageConfig.galleryVideos[0];
  createCustomVideoPlayer(detailViewer, {
    videoUrl: firstVideo.src,
    controls: true,
    autoplay: true,
    muted: true,
    loop: true
  });
}

// -------- GALLERY THUMBNAIL SWITCHING --------

const galleryItems = document.querySelectorAll('.gallery-thumb');

if (galleryItems.length && detailViewer) {
  let currentMedia = detailViewer.querySelector('.detail-main-media') ||
    detailViewer.querySelector('img, video, iframe, .yt-custom-player-wrapper, .yt-interactive-wrap');

  galleryItems.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      // Update active states
      galleryItems.forEach(t => {
        t.classList.remove('ring-2', 'ring-indigo-500', 'opacity-100');
        t.classList.add('opacity-50');
      });
      thumb.classList.add('ring-2', 'ring-indigo-500', 'opacity-100');
      thumb.classList.remove('opacity-50');

      const type = thumb.dataset.type || "image";

      if (type === "video") {
        const videoSrc = thumb.dataset.src;

        // Clean up existing content
        detailViewer.querySelectorAll('video, img, iframe, .yt-bg-player-wrap, .yt-interactive-wrap, .yt-custom-controls, .detail-main-media').forEach(el => el.remove());
        currentMedia = null;

        // Create interactive HTML5 video player
        createCustomVideoPlayer(detailViewer, {
          videoUrl: videoSrc,
          controls: true,
          autoplay: true,
          muted: true,
          loop: true
        });
        return;
      }

      // Image
      const newSrc = thumb.dataset.src;
      const currentSrc = currentMedia ? (currentMedia.src || currentMedia.currentSrc) : "";

      if (!currentSrc || !currentSrc.endsWith(newSrc)) {
        // Remove any player wraps first
        detailViewer.querySelectorAll('.yt-bg-player-wrap, .yt-interactive-wrap, .yt-custom-controls, video').forEach(el => el.remove());

        const doSwap = () => {
          const newElement = document.createElement("img");
          newElement.src = newSrc;
          newElement.className = "w-full h-full object-cover detail-main-media transition-opacity duration-300 pointer-events-auto border-0 relative";
          newElement.style.opacity = "0";
          newElement.style.transform = "scale(0.98)";

          if (currentMedia && currentMedia.parentNode === detailViewer) {
            detailViewer.replaceChild(newElement, currentMedia);
          } else {
            detailViewer.appendChild(newElement);
          }
          currentMedia = newElement;
          gsap.to(currentMedia, { opacity: 1, scale: 1, duration: 0.2 });
        };

        if (currentMedia) {
          gsap.to(currentMedia, {
            opacity: 0, scale: 0.98, duration: 0.15,
            onComplete: doSwap
          });
        } else {
          doSwap();
        }
      }
    });
  });
}

// -------- ENTRANCE ANIMATIONS --------
const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

tl.from('.project-hero-content', { opacity: 0, y: 40, duration: 0.8 })
  .from('.detail-section', { opacity: 0, y: 30, duration: 0.6, stagger: 0.15 }, '-=0.3');

// -------- SMOOTH SCROLL for anchor links --------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// -------- COPY EMAIL TO CLIPBOARD --------
document.querySelectorAll('.copy-email-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const email = btn.dataset.email || 'alavaro.code@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
      const textSpan = btn.querySelector('.email-btn-text');
      if (textSpan) {
        const originalText = textSpan.textContent;
        textSpan.textContent = '¡Email Copiado!';
        setTimeout(() => {
          textSpan.textContent = originalText;
        }, 2000);
      }
    }).catch(err => {
      console.error('Error al copiar email:', err);
    });
  });
});
