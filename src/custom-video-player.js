/**
 * custom-video-player.js
 * ----------------------
 * Reusable YouTube + HTML5 Video player with fully custom controls.
 *
 * Uses the YouTube IFrame Player API to hide all YT chrome and provide
 * a custom UI (play/pause, seek bar, volume, mute, time display).
 *
 * Usage:
 *   import { createCustomVideoPlayer, createYouTubeBackground } from './custom-video-player.js'
 *
 *   // Interactive player with custom controls (overview gallery, "Un Vistazo")
 *   createCustomVideoPlayer(container, { youtubeId: 'abc123' })
 *
 *   // Background-only, no interaction (hero sections, carousel)
 *   createYouTubeBackground(container, 'abc123')
 */

// ---- YouTube IFrame API loader (singleton) ----

let ytApiReady = false;
const ytReadyCallbacks = [];

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) {
    ytApiReady = true;
    return Promise.resolve();
  }
  if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    return new Promise((resolve) => ytReadyCallbacks.push(resolve));
  }
  return new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    ytReadyCallbacks.push(resolve);
    window.onYouTubeIframeAPIReady = () => {
      ytApiReady = true;
      ytReadyCallbacks.forEach(cb => cb());
      ytReadyCallbacks.length = 0;
    };
  });
}

// ---- Format mm:ss ----

function fmtTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---- Create a non-interactive YouTube background (carousel, hero) ----

export async function createYouTubeBackground(container, youtubeId, opts = {}) {
  if (!youtubeId) return null;
  const { loop = true } = opts;

  await loadYouTubeAPI();

  // Create a unique div for the YT player
  const playerDiv = document.createElement('div');
  const uid = 'ytbg-' + Math.random().toString(36).slice(2, 9);
  playerDiv.id = uid;
  playerDiv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';

  // Remove previous players
  container.querySelectorAll('.yt-bg-player-wrap').forEach(el => el.remove());

  const wrap = document.createElement('div');
  wrap.className = 'yt-bg-player-wrap';
  wrap.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none;';
  wrap.appendChild(playerDiv);
  container.style.position = 'relative';

  // Insert at the beginning (behind other content)
  container.insertBefore(wrap, container.firstChild);

  return new Promise((resolve) => {
    const player = new window.YT.Player(uid, {
      width: '100%',
      height: '100%',
      videoId: youtubeId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        showinfo: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        cc_load_policy: 0,
        loop: loop ? 1 : 0,
        playlist: loop ? youtubeId : undefined,
        playsinline: 1,
        origin: window.location.origin,
        vq: 'hd1080'
      },
      events: {
        onReady: (event) => {
          event.target.setPlaybackQuality('hd1080');
          event.target.mute();
          event.target.playVideo();
          resolve(player);
        },
        onStateChange: (event) => {
          // Force max quality when playing
          if (event.data === window.YT.PlayerState.PLAYING) {
            event.target.setPlaybackQuality('hd1080');
          }
        }
      }
    });
  });
}

// ---- Main factory: interactive player with custom controls ----

export async function createCustomVideoPlayer(container, opts = {}) {
  const {
    youtubeId = null,
    videoUrl = null,
    controls = true,
    loop = true,
    autoplay = true,
    muted = true
  } = opts;

  if (!youtubeId && !videoUrl) return null;

  // Clear container contents except overlays we'll add
  container.querySelectorAll('.yt-custom-controls, .yt-interactive-wrap, video').forEach(el => el.remove());

  if (youtubeId) {
    return createYouTubeInteractive(container, youtubeId, { controls, loop, autoplay, muted });
  } else {
    return createHTML5Player(container, videoUrl, { controls, loop, autoplay, muted });
  }
}

// ---- YouTube interactive player ----

async function createYouTubeInteractive(container, youtubeId, { controls, loop, autoplay, muted }) {
  await loadYouTubeAPI();

  const playerDiv = document.createElement('div');
  const uid = 'ytint-' + Math.random().toString(36).slice(2, 9);
  playerDiv.id = uid;

  // Remove previous wraps
  container.querySelectorAll('.yt-interactive-wrap').forEach(el => el.remove());

  const wrap = document.createElement('div');
  wrap.className = 'yt-interactive-wrap';
  wrap.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:hidden;';
  wrap.appendChild(playerDiv);
  container.style.position = 'relative';
  container.insertBefore(wrap, container.firstChild);

  return new Promise((resolve) => {
    const player = new window.YT.Player(uid, {
      width: '100%',
      height: '100%',
      videoId: youtubeId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        mute: muted ? 1 : 0,
        controls: 0,
        showinfo: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        cc_load_policy: 0,
        loop: loop ? 1 : 0,
        playlist: loop ? youtubeId : undefined,
        playsinline: 1,
        origin: window.location.origin,
        vq: 'hd1080'
      },
      events: {
        onReady: (event) => {
          event.target.setPlaybackQuality('hd1080');
          if (muted) event.target.mute();
          if (autoplay) event.target.playVideo();

          if (controls) {
            buildYouTubeControls(container, player, { muted });
          }
          resolve(player);
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            event.target.setPlaybackQuality('hd1080');
          }
        }
      }
    });
  });
}

// ---- Build custom controls for YouTube player ----

function buildYouTubeControls(container, player, { muted }) {
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

  // Element refs
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
  const volumeWrap    = wrapper.querySelector('.yt-volume-wrap');
  const volumeBar     = wrapper.querySelector('.yt-volume-bar');
  const volumeLevel   = wrapper.querySelector('.yt-volume-level');
  const volumeHandle  = wrapper.querySelector('.yt-volume-handle');

  let currentVolume = 0.7;
  let isMuted = muted;

  // ----- Polling loop for YT player state (no events for timeupdate) -----
  let pollId;

  function syncUI() {
    try {
      const state = player.getPlayerState();
      const current = player.getCurrentTime() || 0;
      const duration = player.getDuration() || 0;
      const pct = duration > 0 ? (current / duration) * 100 : 0;

      played.style.width = `${pct}%`;
      progressHandle.style.left = `${pct}%`;
      timeCurrent.textContent = fmtTime(current);

      if (duration > 0) {
        timeTotal.textContent = fmtTime(duration);
      }

      // Buffered
      const loadedFraction = player.getVideoLoadedFraction ? player.getVideoLoadedFraction() : 0;
      buffered.style.width = `${loadedFraction * 100}%`;

      // Play/Pause state
      if (state === window.YT.PlayerState.PLAYING) {
        iconPlay.style.display = 'none';
        iconPause.style.display = '';
      } else {
        iconPlay.style.display = '';
        iconPause.style.display = 'none';
      }

      // Mute state
      const playerMuted = player.isMuted();
      if (playerMuted) {
        iconMuted.style.display = '';
        iconUnmuted.style.display = 'none';
        volumeLevel.style.width = '0%';
        volumeHandle.style.left = '0%';
      } else {
        iconMuted.style.display = 'none';
        iconUnmuted.style.display = '';
        const vol = player.getVolume() || 0;
        volumeLevel.style.width = `${vol}%`;
        volumeHandle.style.left = `${vol}%`;
      }
    } catch (e) { /* player might be destroyed */ }
  }

  pollId = setInterval(syncUI, 250);

  // Cleanup when container is removed
  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      clearInterval(pollId);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ----- Play / Pause -----
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const state = player.getPlayerState();
    if (state === window.YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  });

  // ----- Mute / Unmute -----
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (player.isMuted()) {
      player.unMute();
      player.setVolume(currentVolume * 100);
    } else {
      player.mute();
    }
  });

  // ----- Volume slider -----
  function setVolumeFromEvent(e) {
    const rect = volumeBar.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    currentVolume = pct;
    player.setVolume(pct * 100);
    if (pct === 0) {
      player.mute();
    } else if (player.isMuted()) {
      player.unMute();
    }
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

  // ----- Progress / Seek -----
  function setProgressFromEvent(e) {
    const rect = progressBar.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    const duration = player.getDuration() || 0;
    player.seekTo(pct * duration, true);
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

  // ----- Show/hide on hover -----
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

  // Prevent clicks on controls from propagating
  wrapper.addEventListener('click', (e) => e.stopPropagation());
}

// ---- HTML5 Video player (fallback for local videos) ----

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
      volumeLevel.style.width = `${video.volume * 100}%`;
      volumeHandle.style.left = `${video.volume * 100}%`;
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
    played.style.width = `${pct}%`;
    progressHandle.style.left = `${pct}%`;
    timeCurrent.textContent = fmtTime(current);
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
