/** SSR-safe Service Worker registration (production published app only). */
function isPreviewHost(): boolean {
  const h = window.location.hostname.toLowerCase();
  const label = h.split(".")[0];
  if (/\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(h) && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label) || /^project--.+-dev$/.test(label))) return true;
  return /(^|\.)lovableproject(-dev)?\.com$/.test(h) || /(^|\.)beta\.lovable\.dev$/.test(h);
}

async function unregisterAll() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter((r) => r.active?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()));
  } catch { /* ignore */ }
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  let inIframe = false;
  try { inIframe = window.self !== window.top; } catch { inIframe = true; }
  const off = new URLSearchParams(window.location.search).get("sw") === "off";
  if (!import.meta.env.PROD || inIframe || isPreviewHost() || off) { void unregisterAll(); return; }

  const register = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) nw.postMessage("SKIP_WAITING");
        });
      });
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (err) {
      console.warn("[SW] registration failed:", err);
    }
  };
  if (document.readyState === "complete") void register();
  else window.addEventListener("load", () => void register(), { once: true });
}
