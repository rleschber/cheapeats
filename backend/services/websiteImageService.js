/**
 * Fetch a restaurant website's homepage and extract the first meaningful image
 * (og:image preferred, else first <img>). Used for deal card images when we have a domain.
 * Results are cached in memory per domain.
 */

const FETCH_TIMEOUT_MS = 5000;
const USER_AGENT = "Mozilla/5.0 (compatible; CheapEats/1.0)";

const cache = new Map(); // domain -> string | null

function resolveUrl(base, href) {
  if (!href || typeof href !== "string") return null;
  const t = href.trim();
  if (t.startsWith("data:") || t.startsWith("javascript:")) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  try {
    return new URL(t, base).href;
  } catch {
    return null;
  }
}

function isSkippableImageUrl(url) {
  if (!url) return true;
  const u = url.toLowerCase();
  return (
    u.includes("1x1") ||
    u.includes("pixel") ||
    u.includes("tracking") ||
    u.includes("beacon") ||
    u.includes("blank.") ||
    u.includes("spacer") ||
    u.includes("transparent.")
  );
}

/**
 * Extract og:image or first <img src> from HTML.
 * @param {string} html
 * @param {string} baseUrl - e.g. "https://mcdonalds.com"
 * @returns {string | null}
 */
function extractFirstImage(html, baseUrl) {
  if (!html || typeof html !== "string") return null;

  // Prefer og:image (main share image)
  const ogMatch = html.match(
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i
  );
  if (!ogMatch) {
    const ogContentFirst = html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i
    );
    if (ogContentFirst) {
      const url = resolveUrl(baseUrl, ogContentFirst[1]);
      if (url && !isSkippableImageUrl(url)) return url;
    }
  } else {
    const url = resolveUrl(baseUrl, ogMatch[1]);
    if (url && !isSkippableImageUrl(url)) return url;
  }

  // First <img src="..."> with http(s) or relative
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) {
    const url = resolveUrl(baseUrl, imgMatch[1]);
    if (url && !isSkippableImageUrl(url)) return url;
  }

  return null;
}

/**
 * Fetch homepage for domain and return first image URL, or null.
 * Results are cached per domain.
 * @param {string} domain - e.g. "mcdonalds.com"
 * @returns {Promise<string | null>}
 */
export async function getWebsiteImageUrl(domain) {
  if (!domain || typeof domain !== "string") return null;
  const key = domain.toLowerCase().replace(/^www\./, "").trim();
  if (cache.has(key)) return cache.get(key);

  const baseUrl = `https://${key}`;
  let url = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(baseUrl, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      cache.set(key, null);
      return null;
    }

    const html = await res.text();
    url = extractFirstImage(html, baseUrl);
  } catch {
    url = null;
  }

  cache.set(key, url);
  return url;
}

/**
 * Get website image URLs for multiple domains in parallel.
 * @param {string[]} domains
 * @returns {Promise<Map<string, string>>} domain -> image URL (only entries that succeeded)
 */
export async function getWebsiteImagesForDomains(domains) {
  const unique = [...new Set(domains.filter(Boolean))];
  const results = await Promise.all(
    unique.map(async (d) => {
      const url = await getWebsiteImageUrl(d);
      return [d, url];
    })
  );
  const map = new Map();
  for (const [domain, url] of results) {
    if (url) map.set(domain, url);
  }
  return map;
}

export function clearWebsiteImageCache() {
  cache.clear();
}
