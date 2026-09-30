import './style.css'
import { gsap } from 'gsap'
import { createCustomVideoPlayer, createYouTubeBackground } from './custom-video-player.js'

// -------- YOUTUBE VIDEO MAP --------
// Maps page paths to their YouTube IDs for hero and gallery sections

const YOUTUBE_MAP = {
  '/projects/juego1.html': {
    heroId: 'P3xiex_c-Ws',
    galleryVideos: [
      { youtubeId: 'P3xiex_c-Ws', label: 'Trailer' },
      { youtubeId: 'C3WByweOZVU', label: 'Showcase' }
    ]
  },
  '/projects/juego2.html': {
    heroId: 'nbe0eFqU2ME',
    galleryVideos: [
      { youtubeId: 'nbe0eFqU2ME', label: 'Trailer' }
    ]
  },
  '/projects/juego3.html': {
    heroId: 'FyszcX8MsIc',
    galleryVideos: [
      { youtubeId: 'FyszcX8MsIc', label: 'Trailer' }
    ]
  },
  '/projects/juego4.html': {
    heroId: null, // trailer en proceso
    galleryVideos: []
  },
  '/projects/juego5.html': {
    heroId: null,
    galleryVideos: []
  }
};

// Detect current page
const currentPath = window.location.pathname;
const pageConfig = YOUTUBE_MAP[currentPath] || { heroId: null, galleryVideos: [] };

// -------- INITIALIZE HERO YOUTUBE (non-interactive, muted, looped) --------

const heroVideoContainer = document.querySelector('.project-hero-content .relative.aspect-video');

if (heroVideoContainer && pageConfig.heroId) {
  // Remove the existing video/img element
  const existingMedia = heroVideoContainer.querySelector('video, img');
  if (existingMedia) existingMedia.remove();

  createYouTubeBackground(heroVideoContainer, pageConfig.heroId, { loop: true });
}

// -------- INITIALIZE GALLERY ("Un Vistazo") with interactive YT player --------

const detailViewer = document.querySelector('.detail-main-viewer');
const galleryThumbsContainer = detailViewer ? detailViewer.parentElement : null;

if (detailViewer && pageConfig.galleryVideos.length > 0) {
  // Replace the existing video in the detail viewer with an interactive YouTube player
  const existingMedia = detailViewer.querySelector('video, img, .detail-main-media');
  if (existingMedia) existingMedia.remove();

  // Create the first YouTube video as the interactive player
  const firstVideo = pageConfig.galleryVideos[0];
  createCustomVideoPlayer(detailViewer, {
    youtubeId: firstVideo.youtubeId,
    controls: true,
    autoplay: true,
    muted: true,
    loop: true
  });

  // Update the gallery thumbs: find video thumbs and convert them to youtube type
  const galleryThumbs = galleryThumbsContainer ? galleryThumbsContainer.querySelectorAll('.gallery-thumb') : [];

  // If there are YouTube gallery videos, we need to update the first N thumbs
  // to be youtube-type instead of local video
  galleryThumbs.forEach(thumb => {
    const dataSrc = thumb.dataset.src;
    const type = thumb.dataset.type;

    // Check if this thumb is a video type and should be converted to youtube
    if (type === 'youtube') {
      // Already YouTube type, handled below
    }
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

      if (type === "youtube") {
        const youtubeId = thumb.dataset.ytid;

        // Clean up existing content
        detailViewer.querySelectorAll('video, img, iframe, .yt-bg-player-wrap, .yt-interactive-wrap, .yt-custom-controls, .detail-main-media').forEach(el => el.remove());
        currentMedia = null;

        // Create interactive YouTube player
        createCustomVideoPlayer(detailViewer, {
          youtubeId,
          controls: true,
          autoplay: true,
          muted: true,
          loop: true
        });
        return;
      }

      // Image or local video
      const newSrc = thumb.dataset.src;
      const currentSrc = currentMedia ? (currentMedia.src || currentMedia.currentSrc) : "";

      if (!currentSrc || !currentSrc.endsWith(newSrc)) {
        // Remove YouTube player wraps first
        detailViewer.querySelectorAll('.yt-bg-player-wrap, .yt-interactive-wrap, .yt-custom-controls').forEach(el => el.remove());

        const doSwap = () => {
          let newElement;
          if (type === "video") {
            newElement = document.createElement("div");
            createCustomVideoPlayer(newElement, { videoUrl: newSrc, autoplay: true, muted: true });
          } else {
            newElement = document.createElement("img");
            newElement.src = newSrc;
          }
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
