import './style.css'
import { gsap } from 'gsap'
import { TextPlugin } from "gsap/TextPlugin";
import { createCustomVideoPlayer } from './custom-video-player.js';

gsap.registerPlugin(TextPlugin);

// -------- INTRO TIMELINE --------

const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

tl.to("#avatar", {
  opacity: 1,
  duration: 1
}, "-=0.3")
  .to("#typed-username", {
    duration: 0.6,
    text: "Username:",
    ease: "none"
  })
  .to("#typed-name", {
    duration: 1,
    text: "Álvaro Pérez",
    ease: "none"
  })
  .to("#divider", {
    scaleX: 1,
    duration: 0.5
  }, "-=0.3")
  .to("#cursor", {
    opacity: 0,
    duration: 0.5,
    repeat: -1,
    yoyo: true,
    ease: "steps(1)"
  })
  .to("#title-section", {
    opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
  }, "-=0.3")
  .to("#image-section", {
    opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
    onComplete: onCarouselsReady
  }, "-=0.6");

// -------- CARRUSEL DE TÍTULOS (infinito, 3 copias) --------

const titles = [
  "UI/UX Designer",
  "Unity Developer",
  "Game Designer",
  "System Designer",
  "Gameplay Programmer",
  "System Programmer"
];

const displayTitles = [...titles, ...titles, ...titles];
const total = titles.length;
let activeIndex = total + 1;

const carousel = document.getElementById("title-carousel");
const track = document.getElementById("title-track");

// 3 visible slots: previous / active / next — enough spacing so items
// don't overlap the selector bar
const itemHeight = carousel.offsetHeight / 3;

displayTitles.forEach((title) => {
  const li = document.createElement("li");
  li.textContent = title;
  li.className =
    "title-item flex items-center pl-14 md:pl-20 " +
    "text-2xl md:text-4xl font-extrabold text-slate-500";
  li.style.height = `${itemHeight}px`;
  track.appendChild(li);
});

const items = document.querySelectorAll(".title-item");

function updateCarousel(animate = true) {
  const containerHeight = carousel.offsetHeight;
  const offsetY = -(activeIndex * itemHeight) + (containerHeight / 2 - itemHeight / 2);

  if (animate) {
    gsap.to(track, {
      y: offsetY,
      duration: 0.7,
      ease: "power3.inOut",
      onComplete: checkLoopReset
    });
  } else {
    gsap.set(track, { y: offsetY });
    checkLoopReset();
  }

  const itemDuration = animate ? 0.5 : 0;

  items.forEach((item, i) => {
    const distance = Math.abs(i - activeIndex);
    gsap.to(item, {
      opacity: distance === 0 ? 1 : distance === 1 ? 0.4 : 0.15,
      color: distance === 0 ? "#ffffff" : "#64748b",
      duration: itemDuration
    });
  });
}

function checkLoopReset() {
  if (activeIndex >= total * 2) {
    activeIndex -= total;
    updateCarousel(false);
  } else if (activeIndex < total) {
    activeIndex += total;
    updateCarousel(false);
  }
}

// Init: position immediately (still invisible via opacity-0)
updateCarousel(false);

// -------- CARRUSEL DE IMÁGENES (juegos, invertido) --------
// YouTube trailers for games with available IDs, images for the rest
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')   // removes trailing slash if present
const games = [
  { title: "Prelude: Dark Pain", type: "video", videoUrl: BASE + "/images/games/juego1/prelude-trailer.mp4", fallbackImage: BASE + "/images/games/juego1/prelude-portrait.jpg", sectionIndex: 0 },
  { title: "A Reason to Exist", type: "video", videoUrl: BASE + "/images/games/juego2/reason-trailer.mp4", fallbackImage: BASE + "/images/games/juego2/reason-portrait.png", sectionIndex: 1 },
  { title: "Below the Surface", type: "video", videoUrl: BASE + "/images/games/juego3/below-trailer.mp4", fallbackImage: BASE + "/images/games/juego3/below-splash-1.png", sectionIndex: 2 },
  { title: "EvadTale",          type: "video", videoUrl: BASE + "/images/games/juego4/evadtale-trailer.mp4", fallbackImage: BASE + "/images/games/juego4/portada.png", sectionIndex: 3 },
  { title: "Sacramento",        type: "image",   media: BASE + "/images/games/juego5/portada.png", sectionIndex: 4 }
];

const displayGames = [...games, ...games, ...games];
const gamesTotal = games.length;

let activeGameIndex = gamesTotal + 1;

const imageCarousel = document.getElementById("image-carousel");
const imageTrack = document.getElementById("image-track");

const gameItemHeight = imageCarousel.offsetHeight / 3;
const CARD_GAP = 16;

displayGames.forEach((game) => {
  const li = document.createElement("li");
  li.className =
    "game-item relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer " +
    "shadow-xl shadow-indigo-900/50 ring-1 ring-white/10 origin-right";
  li.style.height = `${gameItemHeight - CARD_GAP}px`;
  li.style.marginBottom = `${CARD_GAP}px`;
  li.style.width = "100%";
  li.dataset.sectionIndex = game.sectionIndex;

  let mediaHtml;
  if (game.type === "video") {
    // Create an empty container that will be populated with a video player
    mediaHtml = `<div class="video-carousel-container w-full h-full absolute inset-0"></div>`;
  } else {
    mediaHtml = `<img src="${game.media}" alt="${game.title}" class="w-full h-full object-cover pointer-events-none" />`;
  }

  li.innerHTML = `
    ${mediaHtml}
    <div class="game-overlay absolute inset-0 bg-black/0 flex items-end p-4 opacity-0">
      <h3 class="text-white font-bold text-lg md:text-xl">${game.title}</h3>
    </div>
  `;

  imageTrack.appendChild(li);
  
  if (game.type === "video") {
    const container = li.querySelector('.video-carousel-container');
    const video = document.createElement('video');
    video.src = game.videoUrl;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.className = 'w-full h-full object-cover pointer-events-none absolute inset-0';
    container.appendChild(video);
  }
});

const gameItems = document.querySelectorAll(".game-item");

function updateImageCarousel(animate = true) {
  const containerHeight = imageCarousel.offsetHeight;
  const offsetY = -(activeGameIndex * gameItemHeight) + (containerHeight / 2 - gameItemHeight / 2);
  const duration = animate ? 0.5 : 0;

  gsap.to(imageTrack, {
    y: offsetY,
    duration: animate ? 0.8 : 0,
    ease: "power3.inOut",
    onComplete: checkImageLoopReset
  });

  gameItems.forEach((item, i) => {
    const distance = Math.abs(i - activeGameIndex);
    const isActive = distance === 0;
    gsap.to(item, {
      scale: isActive ? 1.3 : distance === 1 ? 0.6 : 0.4,
      x: 0,
      opacity: isActive ? 1 : distance === 1 ? 0.35 : 0.08,
      duration
    });
  });
}

function checkImageLoopReset() {
  if (activeGameIndex >= gamesTotal * 2) {
    activeGameIndex -= gamesTotal;
    updateImageCarousel(false);
  } else if (activeGameIndex < gamesTotal) {
    activeGameIndex += gamesTotal;
    updateImageCarousel(false);
  }
}

updateImageCarousel(false);

// Hover overlays + click to navigate to game overview section
gameItems.forEach((item) => {
  const overlay = item.querySelector(".game-overlay");

  item.addEventListener("mouseenter", () => {
    gsap.to(overlay, { backgroundColor: "rgba(0,0,0,0.6)", opacity: 1, duration: 0.3 });
  });

  item.addEventListener("mouseleave", () => {
    gsap.to(overlay, { backgroundColor: "rgba(0,0,0,0)", opacity: 0, duration: 0.3 });
  });

  // Click: scroll to the corresponding overview section
  item.addEventListener("click", () => {
    const sectionIdx = parseInt(item.dataset.sectionIndex, 10);
    const overviewSections = document.querySelectorAll('[data-project-section]');
    if (overviewSections[sectionIdx]) {
      overviewSections[sectionIdx].scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// -------- SYNCED CAROUSEL LOOP (rAF-based, tab-safe) --------
//
// Instead of two independent setIntervals (which browsers throttle/batch
// when the tab is in the background, causing the "burst" on return),
// we use a single requestAnimationFrame loop that tracks elapsed time.
// When the tab is hidden the rAF simply stops; when it comes back it
// resumes from where it left off—no accumulated ticks, no desync.

const TICK_INTERVAL_MS = 3000; // both carousels advance every 3 s

function startSyncedCarousels() {
  let lastTick = performance.now();

  function loop(now) {
    const delta = now - lastTick;

    if (delta >= TICK_INTERVAL_MS) {
      lastTick = now;

      activeIndex++;
      updateCarousel(true);

      activeGameIndex--;
      updateImageCarousel(true);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

// -------- DESCRIPTION TYPEWRITER --------

const DESCRIPTION_TEXT =
  "Desarrollador de videojuegos y diseñador de sistemas con experiencia en " +
  "Unity y C#.\n\n" +
  "Me apasiona el proceso creativo detrás de cada videojuego.\n\n" +
  "Me considero ambicioso y perfeccionista, buscando siempre la eficiencia " +
  "y facilitar el trabajo de mis compañeros.";

function startDescriptionTypewriter() {
  const section = document.getElementById("description-section");
  const heading = document.getElementById("description-title");
  const body = document.getElementById("description-body");

  // Make body preserve line breaks
  body.style.whiteSpace = "pre-line";

  // Fade in the section container
  gsap.to(section, {
    opacity: 1, y: 0, duration: 0.6, ease: "power2.out"
  });

  // Type the heading first, then the body text, then reveal tools
  const descTl = gsap.timeline({ delay: 0.3 });

  descTl.to(heading, {
    duration: 0.6,
    text: "Description",
    ease: "none"
  })
    .to(body, {
      duration: 3.5,
      text: DESCRIPTION_TEXT,
      ease: "none"
    }, "+=0.2")
    .add(revealToolIcons, "+=0.3");
}

function revealToolIcons() {
  const toolsSection = document.getElementById("tools-section");
  const icons = document.querySelectorAll(".tool-icon");

  // Fade in the container
  gsap.to(toolsSection, {
    opacity: 1, y: 0, duration: 0.5, ease: "power2.out"
  });

  // Staggered reveal for each icon
  gsap.fromTo(icons,
    { opacity: 0, y: 12, scale: 0.8 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: 0.4,
      stagger: 0.1,
      ease: "back.out(1.7)",
      delay: 0.2
    }
  );
}

function onCarouselsReady() {
  startSyncedCarousels();
  startDescriptionTypewriter();
  initProjectSectionYouTube();
}

// -------- PARTÍCULAS DE FONDO --------

const particlesContainer = document.getElementById("particles");

if (particlesContainer) {
  const PARTICLE_COUNT = 40;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement("div");
    p.className = "absolute rounded-full bg-white";

    const size = gsap.utils.random(1, 3);
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${gsap.utils.random(0, 100)}%`;
    p.style.top = `${gsap.utils.random(0, 100)}%`;
    p.style.opacity = gsap.utils.random(0.05, 0.25);

    particlesContainer.appendChild(p);

    gsap.to(p, {
      x: gsap.utils.random(-40, 40),
      y: gsap.utils.random(-60, 60),
      duration: gsap.utils.random(8, 18),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }
}

// -------- INITIALIZE VIDEO PLAYERS IN PROJECT SECTIONS --------
// For project sections on the main page, embed custom players

function initProjectSectionYouTube() {
  const localVideos = [
    BASE + '/images/games/juego1/prelude-trailer.mp4',
    BASE + '/images/games/juego2/reason-trailer.mp4',
    BASE + '/images/games/juego3/below-trailer.mp4',
    BASE + '/images/games/juego4/evadtale-trailer.mp4'
  ];

  const sections = document.querySelectorAll('[data-project-section]');
  sections.forEach((section, index) => {
    if (index >= localVideos.length) return; // e.g. juego5 with no video yet
    
    const viewer = section.querySelector('.main-viewer');
    if (!viewer) return;

    // Remove the existing hardcoded video element if it exists
    const existingMedia = viewer.querySelector('video, img, iframe, .yt-custom-controls');
    if (existingMedia) existingMedia.remove();

    const videoUrl = localVideos[index];
    const newElement = document.createElement("div");
    newElement.dataset.src = videoUrl;
    createCustomVideoPlayer(newElement, { videoUrl, autoplay: true, muted: true, controls: true, loop: true });
    newElement.className = "w-full h-full object-cover main-media pointer-events-auto absolute inset-0";
    viewer.appendChild(newElement);
  });
}

// -------- PROJECT GALLERIES --------

const projectGalleries = document.querySelectorAll(".project-media");

projectGalleries.forEach((gallery) => {
  const viewer = gallery.querySelector(".main-viewer");
  let currentMedia = viewer ? (viewer.querySelector(".main-media") || viewer.querySelector("video, img, iframe")) : null;
  const thumbs = gallery.querySelectorAll(".thumb-btn");

  if (!viewer || thumbs.length === 0) return;

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      // Remover estado activo de todas las miniaturas en esta galería
      thumbs.forEach((t) => {
        t.classList.remove("border-indigo-500", "opacity-100");
        t.classList.add("border-transparent", "opacity-60");
      });

      // Añadir estado activo a la miniatura clickeada
      thumb.classList.add("border-indigo-500", "opacity-100");
      thumb.classList.remove("border-transparent", "opacity-60");

      // Cambiar imagen principal con una suave transición
      const newSrc = thumb.dataset.src;
      const type = thumb.dataset.type || "image";

      const currentSrc = currentMedia ? (currentMedia.src || currentMedia.currentSrc || currentMedia.dataset?.src) : "";

      if (!currentSrc || !currentSrc.endsWith(newSrc)) {
        // Remove all player wraps first
        viewer.querySelectorAll('.yt-bg-player-wrap, .yt-interactive-wrap, .yt-custom-controls').forEach(el => el.remove());

        if (currentMedia) {
          gsap.to(currentMedia, {
            opacity: 0.5,
            scale: 0.98,
            duration: 0.15,
            ease: "power2.out",
            onComplete: () => {
              swapMedia();
            }
          });
        } else {
          swapMedia();
        }

        function swapMedia() {
          let newElement;
          if (type === "video") {
            newElement = document.createElement("div");
            // Set dataset.src to easily identify the current media source
            newElement.dataset.src = newSrc;
            createCustomVideoPlayer(newElement, { videoUrl: newSrc, autoplay: true, muted: true, controls: true, loop: true });
          } else {
            newElement = document.createElement("img");
            newElement.src = newSrc;
          }
          newElement.className = "w-full h-full object-cover main-media transition-opacity duration-300 pointer-events-auto border-0 relative";
          newElement.style.opacity = "0.5";
          newElement.style.transform = "scale(0.98)";

          if (currentMedia) {
            viewer.replaceChild(newElement, currentMedia);
          } else {
            viewer.appendChild(newElement);
          }
          currentMedia = newElement;

          gsap.to(currentMedia, { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" });
        }
      }
    });
  });
});

// -------- INDICADOR DE SCROLL GLOBAL FLOTANTE (FIJO ABAJO) --------

const allSections = Array.from(document.querySelectorAll('section.h-screen, [data-project-section]'));

if (allSections.length > 0) {
  // Crear el contenedor flotante único en el body
  const scrollWidget = document.createElement('div');
  scrollWidget.id = 'global-scroll-widget';
  scrollWidget.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 transition-opacity duration-300 pointer-events-auto';

  scrollWidget.innerHTML = `
    <button id="scroll-arrow-up" class="p-1 cursor-pointer opacity-70 hover:opacity-100 transition-all focus:outline-none group" title="Anterior">
      <svg class="w-5 h-5 text-white transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>

    <div id="scroll-mouse-icon" class="cursor-pointer opacity-80 hover:opacity-100 transition-opacity" title="Navegar">
      <svg class="w-6 h-9 stroke-white fill-none" viewBox="0 0 24 36" stroke-width="2">
        <rect x="2" y="2" width="20" height="32" rx="10" />
        <line x1="12" y1="8" x2="12" y2="14" class="animate-mouse-wheel" stroke-linecap="round" stroke-width="2.5" />
      </svg>
    </div>

    <button id="scroll-arrow-down" class="p-1 cursor-pointer opacity-70 hover:opacity-100 transition-all focus:outline-none group" title="Siguiente">
      <svg class="w-5 h-5 text-white transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  `;

  document.body.appendChild(scrollWidget);

  const arrowUp = scrollWidget.querySelector('#scroll-arrow-up');
  const arrowDown = scrollWidget.querySelector('#scroll-arrow-down');
  const mouseIcon = scrollWidget.querySelector('#scroll-mouse-icon');

  let currentSectionIndex = 0;

  function updateWidgetVisibility(index) {
    currentSectionIndex = index;

    // Flecha Arriba: visible si hay sección anterior (usamos visibility para no alterar el layout)
    if (currentSectionIndex > 0) {
      arrowUp.style.visibility = 'visible';
      arrowUp.style.pointerEvents = 'auto';
    } else {
      arrowUp.style.visibility = 'hidden';
      arrowUp.style.pointerEvents = 'none';
    }

    // Flecha Abajo: visible si hay sección siguiente (usamos visibility para no alterar el layout)
    if (currentSectionIndex < allSections.length - 1) {
      arrowDown.style.visibility = 'visible';
      arrowDown.style.pointerEvents = 'auto';
    } else {
      arrowDown.style.visibility = 'hidden';
      arrowDown.style.pointerEvents = 'none';
    }
  }

  // IntersectObserver para saber qué sección está activa en el viewport
  const observerOptions = {
    root: null,
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = allSections.indexOf(entry.target);
        if (index !== -1) {
          updateWidgetVisibility(index);
        }
      }
    });
  }, observerOptions);

  allSections.forEach((sec) => observer.observe(sec));

  // Listeners de Click
  arrowUp.addEventListener('click', () => {
    if (currentSectionIndex > 0) {
      allSections[currentSectionIndex - 1].scrollIntoView({ behavior: 'smooth' });
    }
  });

  arrowDown.addEventListener('click', () => {
    if (currentSectionIndex < allSections.length - 1) {
      allSections[currentSectionIndex + 1].scrollIntoView({ behavior: 'smooth' });
    }
  });

  mouseIcon.addEventListener('click', () => {
    if (currentSectionIndex < allSections.length - 1) {
      allSections[currentSectionIndex + 1].scrollIntoView({ behavior: 'smooth' });
    } else if (currentSectionIndex > 0) {
      allSections[currentSectionIndex - 1].scrollIntoView({ behavior: 'smooth' });
    }
  });
}