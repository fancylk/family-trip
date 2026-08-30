/* 山河明月行 Service Worker v3 — offline-capable PWA */
const VERSION = "trip-v2.0";
const CORE = "core-" + VERSION;
const RUNTIME = "runtime-" + VERSION;
const AUDIO_CACHE = "trip-audio-v1"; // 预下载语音共用此缓存（跨版本）

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon-32.png",
  "/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CORE).then((c) => c.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("core-") || k.startsWith("runtime-")).filter((k) => k !== CORE && k !== RUNTIME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Range 请求（拖进度条）直接走网络，避免缓存整文件响应破坏分段
  if (req.headers.has("range")) return;

  // 页面导航：网络优先（保证更新），离线回退缓存
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CORE).then((c) => c.put("/index.html", copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/index.html")))
    );
    return;
  }

  // 静态资源与音频：缓存优先（caches.match 全局匹配，命中页面预下载的音频缓存）
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // 后台静默更新非音频资源
        if (!req.url.includes("/audio/")) {
          fetch(req).then((res) => {
            if (res && res.ok) caches.open(RUNTIME).then((c) => c.put(req, res));
          }).catch(() => {});
        }
        return cached;
      }
      return fetch(req).then((res) => {
        if (res && res.ok && (res.type === "basic" || res.type === "default")) {
          const copy = res.clone();
          caches.open(req.url.includes("/audio/") ? AUDIO_CACHE : RUNTIME).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match("/index.html"));
    })
  );
});