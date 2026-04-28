/**
 * Handles "Failed to fetch dynamically imported module" errors that happen
 * when the user's browser holds a reference to a stale chunk hash after a
 * new deploy or dev-server restart. We reload once with a cache-busting
 * query param, and guard against infinite reload loops via sessionStorage.
 */

const RELOAD_KEY = "__chunk_reload_attempted_at";
const RELOAD_COOLDOWN_MS = 10_000; // don't reload more than once per 10s

function isChunkLoadError(message: unknown): boolean {
  if (typeof message !== "string") return false;
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module") ||
    /Loading chunk \S+ failed/.test(message)
  );
}

function reloadWithCacheBust() {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
  if (now - last < RELOAD_COOLDOWN_MS) {
    // Already tried recently — bail to avoid a reload loop.
    return;
  }
  sessionStorage.setItem(RELOAD_KEY, String(now));

  const url = new URL(window.location.href);
  url.searchParams.set("_r", String(now));
  window.location.replace(url.toString());
}

export function installChunkRetry() {
  if (typeof window === "undefined") return;
  if ((window as any).__chunkRetryInstalled) return;
  (window as any).__chunkRetryInstalled = true;

  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event.message)) {
      reloadWithCacheBust();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      typeof reason === "string"
        ? reason
        : reason && typeof reason.message === "string"
          ? reason.message
          : "";
    if (isChunkLoadError(message)) {
      reloadWithCacheBust();
    }
  });
}
