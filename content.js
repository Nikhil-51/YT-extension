/* === Nikhil's Personal YT Extension - Content Script === */

let ambientGlowEnabled = true;
let transparentUIEnabled = true;
let minimalistSearchEnabled = true;

let canvas = null;
let ctx = null;
let offscreenCanvas = null;
let offscreenCtx = null;
let isLoopRunning = false;
let lastFrameTime = 0;
const fpsLimit = 30; // 30 FPS is visually perfect and saves CPU/GPU resources
const frameInterval = 1000 / fpsLimit;

// Initialize the ambient canvas
function initCanvas() {
  if (document.getElementById("yt-reigen-glow-canvas")) {
    canvas = document.getElementById("yt-reigen-glow-canvas");
    ctx = canvas.getContext("2d");
    return;
  }

  canvas = document.createElement("canvas");
  canvas.id = "yt-reigen-glow-canvas";
  ctx = canvas.getContext("2d");

  offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = 16;
  offscreenCanvas.height = 9; // 16:9 ratio matches modern videos
  offscreenCtx = offscreenCanvas.getContext("2d");

  document.documentElement.appendChild(canvas);
}

// Find YouTube's main video element
function findVideoElement() {
  return document.querySelector("ytd-watch-flexy video.html5-main-video, video.html5-main-video");
}

// Main rendering engine
function renderGlow() {
  if (!canvas) {
    initCanvas();
  }

  const video = findVideoElement();
  if (!video) return;

  // Only render if video is active, playing, and has loaded frames
  if (video.paused || video.ended || video.readyState < 2) {
    return;
  }

  // Handle canvas sizing relative to viewport
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  try {
    // Step 1: Downsample video frame to tiny offscreen canvas
    offscreenCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Step 2: Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Step 3: Draw Zone 1 - Ambient Backdrop Wash (stretched, very soft)
    ctx.globalAlpha = 0.18;
    ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);

    // Step 4: Draw Zone 2 - Player-Anchored Glow (matches player location & size)
    const rect = video.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      ctx.globalAlpha = 0.8;
      ctx.drawImage(offscreenCanvas, rect.left, rect.top, rect.width, rect.height);
    }
  } catch (err) {
    // Graceful fallback for cross-origin or rendering errors
    console.warn("Nikhil's Personal YT: Glow rendering bypassed due to frame access limitations.", err);
  }
}

// Frame loop runner
function tick(now) {
  if (!ambientGlowEnabled) {
    isLoopRunning = false;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return;
  }

  isLoopRunning = true;
  requestAnimationFrame(tick);

  const elapsed = now - lastFrameTime;
  if (elapsed < frameInterval) return;
  lastFrameTime = now - (elapsed % frameInterval);

  renderGlow();
}

// Apply current configuration classes/attributes
function applySettings() {
  const html = document.documentElement;

  // 1. Ambient Glow Engine
  html.setAttribute("data-yt-reigen-glow", ambientGlowEnabled ? "true" : "false");
  if (ambientGlowEnabled && !isLoopRunning) {
    isLoopRunning = true;
    requestAnimationFrame(tick);
  }

  // 2. Transparent UI
  html.setAttribute("data-yt-reigen-transparent", transparentUIEnabled ? "true" : "false");

  // 3. Minimalist Search
  html.setAttribute("data-yt-reigen-search", minimalistSearchEnabled ? "true" : "false");
  if (!minimalistSearchEnabled) {
    const searchBox = document.querySelector("ytd-searchbox");
    if (searchBox) {
      searchBox.classList.remove("yt-search-expanded");
    }
  }
}

// Load configurations from storage
function loadSettings() {
  chrome.storage.local.get(
    ["ambientGlowEnabled", "transparentUIEnabled", "minimalistSearchEnabled"],
    (result) => {
      if (result.ambientGlowEnabled !== undefined) {
        ambientGlowEnabled = result.ambientGlowEnabled;
      }
      if (result.transparentUIEnabled !== undefined) {
        transparentUIEnabled = result.transparentUIEnabled;
      }
      if (result.minimalistSearchEnabled !== undefined) {
        minimalistSearchEnabled = result.minimalistSearchEnabled;
      }
      applySettings();
    }
  );
}

// Listen for updates from popup panel
chrome.storage.onChanged.addListener((changes) => {
  if (changes.ambientGlowEnabled) {
    ambientGlowEnabled = changes.ambientGlowEnabled.newValue;
  }
  if (changes.transparentUIEnabled) {
    transparentUIEnabled = changes.transparentUIEnabled.newValue;
  }
  if (changes.minimalistSearchEnabled) {
    minimalistSearchEnabled = changes.minimalistSearchEnabled.newValue;
  }
  applySettings();
});

// --- Keyboard Event Interceptors for Minimalist Search ---
window.addEventListener("keydown", (e) => {
  if (!minimalistSearchEnabled) return;

  // 'S' key triggers search focus
  if (e.key === "s" || e.key === "S") {
    const activeEl = document.activeElement;
    if (
      activeEl &&
      (activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.isContentEditable ||
        activeEl.closest("[contenteditable]"))
    ) {
      return; // Do not interrupt typing
    }

    const searchBox = document.querySelector("ytd-searchbox");
    if (searchBox) {
      e.preventDefault();
      searchBox.classList.add("yt-search-expanded");
      const searchInput = searchBox.querySelector('input#search, input[name="search_query"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  }

  // 'Escape' key collapses search
  if (e.key === "Escape") {
    const searchBox = document.querySelector("ytd-searchbox");
    if (searchBox && searchBox.classList.contains("yt-search-expanded")) {
      searchBox.classList.remove("yt-search-expanded");
      const searchInput = searchBox.querySelector('input#search, input[name="search_query"]');
      if (searchInput) {
        searchInput.blur();
      }
    }
  }
});

// --- Mouse Interceptors for Minimalist Search ---
document.addEventListener("click", (e) => {
  if (!minimalistSearchEnabled) return;

  const searchBox = document.querySelector("ytd-searchbox");
  if (!searchBox) return;

  const isExpanded = searchBox.classList.contains("yt-search-expanded");
  const clickedInside = searchBox.contains(e.target);

  if (clickedInside) {
    if (!isExpanded) {
      e.preventDefault();
      searchBox.classList.add("yt-search-expanded");
      const searchInput = searchBox.querySelector('input#search, input[name="search_query"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  } else {
    if (isExpanded) {
      searchBox.classList.remove("yt-search-expanded");
      const searchInput = searchBox.querySelector('input#search, input[name="search_query"]');
      if (searchInput) {
        searchInput.blur();
      }
    }
  }
});

// Run initialization
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadSettings);
} else {
  loadSettings();
}
