import { waitUntil as vercelWaitUntil } from "@vercel/functions";

/**
 * Run a task in the background after the response has been sent, keeping the
 * serverless function alive until it settles.
 *
 * Order of preference:
 *   1. `event.waitUntil` (if a future h3/Nitro version provides it)
 *   2. Vercel's platform `waitUntil` (works on Vercel serverless/edge)
 *   3. A floating promise (fine on a long-running Node server / dev)
 *
 * Accepts either a promise or a function returning a promise. Errors are
 * always caught so background work can never crash the request.
 */
export function background(event, task) {
  const p = Promise.resolve()
    .then(() => (typeof task === "function" ? task() : task))
    .catch((e) =>
      console.error("[background] task failed:", e?.message || e),
    );

  if (event && typeof event.waitUntil === "function") {
    try {
      event.waitUntil(p);
      return;
    } catch {
      // fall through
    }
  }

  try {
    vercelWaitUntil(p);
    return;
  } catch {
    // Not running on Vercel — the floating promise still runs to completion
    // on a persistent Node process (dev / self-hosted).
  }
}
