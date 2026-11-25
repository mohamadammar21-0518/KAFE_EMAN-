const prefetched = new Set<string>();

/** Warm browser cache for image URLs (deduped). */
export function prefetchImage(url: string | undefined | null) {
  const trimmed = url?.trim();
  if (!trimmed || prefetched.has(trimmed)) return;
  prefetched.add(trimmed);

  const img = new Image();
  img.decoding = "async";
  img.src = trimmed;
}

export function prefetchImages(urls: Array<string | undefined | null>, limit = 20) {
  const seen = new Set<string>();
  for (const raw of urls) {
    if (seen.size >= limit) break;
    const url = raw?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    prefetchImage(url);
  }
}
