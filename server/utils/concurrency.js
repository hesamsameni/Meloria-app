/**
 * Run an async function over an array of items with a bounded concurrency limit.
 * At most `limit` tasks run simultaneously; the rest are queued.
 *
 * Returns a Promise.allSettled-style array of { status, value } | { status, reason }.
 */
export async function runWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i]) };
      } catch (err) {
        results[i] = { status: "rejected", reason: err };
      }
    }
  }

  // Spawn `limit` workers; they each pull from the queue until empty
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );

  return results;
}
