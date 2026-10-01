/**
 * custom-video-player.js
 * ----------------------
 * Reusable HTML5 Video player with fully custom controls.
 *
 * Uses a standard HTML5 <video> element and provides
 * a custom UI (play/pause, seek bar, volume, mute, time display).
 *
 * Usage:
 *   import { createCustomVideoPlayer } from './custom-video-player.js'
 *
 *   createCustomVideoPlayer(container, { videoUrl: '/path/to/video.mp4' })
 */

// ---- Format mm:ss ----

function fmtTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---- Main factory: interactive player with custom controls ----

export function createCustomVideoPlayer(container, opts = {}) {
  const {
    videoUrl = null,
    controls = true,
    loop = true,
    autoplay = true,
    muted = true
  } = opts;

  if (!videoUrl) return null;

  // Clear container contents except overlays we'll add
  container.querySelectorAll('.yt-custom-controls, video').forEach(el => el.remove());

  return createHTML5Player(container, videoUrl, { controls, loop, autoplay, muted });
}

// ---- HTML5 Video player ----

function createHTML5Player(container, videoUrl, { controls, loop, autoplay, muted }) {
  const video = document.createElement('video');
  video.className = 'absolute inset-0 w-full h-full object-cover pointer-events-none';
  video.src = videoUrl;
  video.playsInline = true;
  video.loop = loop;
  video.muted = muted;
  if (autoplay) video.autoplay = true;

  container.appendChild(video);

  if (controls) {
    buildHTML5Controls(container, video);
  }

  if (autoplay) {
    video.play().catch(() => {});
  }

  return video;
}

// ---- Build HTML5 video controls ----

function buildHTML5Controls(container, video) {
  container.querySelectorAll('.yt-custom-controls').forEach(el => el.remove());

  const wrapper = document.createElement('div');
  wrapper.className = 'yt-custom-controls';
  wrapper.innerHTML = `
    <div class="yt-controls-bar">
      <button class="yt-play-btn" title="Play / Pause">
        <svg class="yt-icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        <svg class="yt-icon-pause" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
      </button>
      <div class="yt-time-current">0:00</div>
      <div class="yt-progress-wrap">
        <div class="yt-progress-bar">
          <div class="yt-progress-buffered"></div>
          <div class="yt-progress-played"></div>
          <div class="yt-progress-handle"></div>
        </div>
      </div>
      <div class="yt-time-total">0:00</div>
      <button class="yt-mute-btn" title="Silenciar / Activar audio">
        <svg class="yt-icon-muted" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
        <svg class="yt-icon-unmuted" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
      </button>
      <div class="yt-volume-wrap">
        <div class="yt-volume-bar">
          <div class="yt-volume-level"></div>
          <div class="yt-volume-handle"></div>
        </div>
      </div>
    </div>
  `;

  container.appendChild(wrapper);

  const bar           = wrapper.querySelector('.yt-controls-bar');
  const playBtn       = wrapper.querySelector('.yt-play-btn');
  const iconPlay      = wrapper.querySelector('.yt-icon-play');
  const iconPause     = wrapper.querySelector('.yt-icon-pause');
  const timeCurrent   = wrapper.querySelector('.yt-time-current');
  const timeTotal     = wrapper.querySelector('.yt-time-total');
  const progressWrap  = wrapper.querySelector('.yt-progress-wrap');
  const progressBar   = wrapper.querySelector('.yt-progress-bar');
  const played        = wrapper.querySelector('.yt-progress-played');
  const buffered      = wrapper.querySelector('.yt-progress-buffered');
  const progressHandle = wrapper.querySelector('.yt-progress-handle');
  const muteBtn       = wrapper.querySelector('.yt-mute-btn');
  const iconMuted     = wrapper.querySelector('.yt-icon-muted');
  const iconUnmuted   = wrapper.querySelector('.yt-icon-unmuted');
  const volumeBar     = wrapper.querySelector('.yt-volume-bar');
  const volumeLevel   = wrapper.querySelector('.yt-volume-level');
  const volumeHandle  = wrapper.querySelector('.yt-volume-handle');

  let currentVolume = 0.7;

  function syncPlayState() {
    if (video.paused) {
      iconPlay.style.display = '';
      iconPause.style.display = 'none';
    } else {
      iconPlay.style.display = 'none';
      iconPause.style.display = '';
    }
  }

  function syncMuteState() {
    if (video.muted || video.volume === 0) {
      iconMuted.style.display = '';
      iconUnmuted.style.display = 'none';
      volumeLevel.style.width = '0%';
      volumeHandle.style.left = '0%';
    } else {
      iconMuted.style.display = 'none';
      iconUnmuted.style.display = '';
      volumeLevel.style.width = \`\${video.volume * 100}%\`;
      volumeHandle.style.left = \`\${video.volume * 100}%\`;
    }
  }

  video.addEventListener('play', syncPlayState);
  video.addEventListener('pause', syncPlayState);
  video.addEventListener('volumechange', syncMuteState);
  video.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = fmtTime(video.duration);
  });
  video.addEventListener('timeupdate', () => {
    const current = video.currentTime;
    const duration = video.duration || 0;
    const pct = duration > 0 ? (current / duration) * 100 : 0;
    played.style.width = \`\${pct}%\`;
    progressHandle.style.left = \`\${pct}%\`;
    timeCurrent.textContent = fmtTime(current);
  });
  
  // Track buffered progress
  video.addEventListener('progress', () => {
    if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
            buffered.style.width = \`\${(bufferedEnd / duration) * 100}%\`;
        }
    }
  });

  syncPlayState();
  syncMuteState();

  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (video.paused) video.play();
    else video.pause();
  });

  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (video.muted) {
      video.muted = false;
      if (video.volume === 0) video.volume = currentVolume || 0.7;
    } else {
      video.muted = true;
    }
  });

  function setVolumeFromEvent(e) {
    const rect = volumeBar.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    currentVolume = pct;
    video.volume = pct;
    if (pct === 0) video.muted = true;
    else if (video.muted) video.muted = false;
  }

  let draggingVolume = false;
  volumeBar.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    draggingVolume = true;
    setVolumeFromEvent(e);
  });
  document.addEventListener('mousemove', (e) => {
    if (draggingVolume) setVolumeFromEvent(e);
  });
  document.addEventListener('mouseup', () => { draggingVolume = false; });

  function setProgressFromEvent(e) {
    const rect = progressBar.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    const duration = video.duration || 0;
    video.currentTime = pct * duration;
  }

  let draggingProgress = false;
  progressWrap.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    draggingProgress = true;
    setProgressFromEvent(e);
  });
  document.addEventListener('mousemove', (e) => {
    if (draggingProgress) setProgressFromEvent(e);
  });
  document.addEventListener('mouseup', () => { draggingProgress = false; });

  let hideTimeout;
  function showControls() {
    clearTimeout(hideTimeout);
    bar.classList.add('yt-controls-visible');
  }
  function scheduleHide() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      bar.classList.remove('yt-controls-visible');
    }, 2500);
  }

  container.addEventListener('mouseenter', showControls);
  container.addEventListener('mousemove', () => {
    showControls();
    scheduleHide();
  });
  container.addEventListener('mouseleave', scheduleHide);
  scheduleHide();

  wrapper.addEventListener('click', (e) => e.stopPropagation());
}
