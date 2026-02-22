/**
 * Live deals service: fetches from (1) DEALS_FEED_URL, (2) OpenMenu API when OPENMENU_API_KEY is set,
 * caches with TTL, and always filters out expired deals. No separate "external API" server needed.
 */

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const OPENMENU_BASE = "https://openmenu.com/api/v2";

let cache = {
  deals: null,
  fetchedAt: 0,
};

/**
 * Normalize a raw deal from a feed or OpenMenu into our app schema.
 */
function normalizeDeal(raw, index) {
  const title = raw.title ?? raw.headline ?? raw.name ?? "";
  const description = raw.description ?? "";
  const restaurant = raw.restaurant ?? raw.restaurant_name ?? "Restaurant";
  const validUntil = raw.validUntil ?? raw.date_end ?? raw.expires ?? null;
  const cuisine = raw.cuisine ?? raw.cuisine_type_primary ?? "American";
  const id = raw.id ?? `live-${index}-${restaurant.replace(/\W/g, "_")}`;
  const location = raw.location ?? (raw.city_town ? `${raw.city_town}, ${raw.address_1 || ""}`.trim() : "Nationwide");
  return {
    id: String(id),
    restaurant: String(restaurant),
    cuisine: String(cuisine),
    title: String(title),
    description: String(description),
    savings: raw.savings ?? "0%",
    savingsAmount: raw.savingsAmount ?? raw.savings_amount ?? "",
    validUntil: validUntil ? String(validUntil).slice(0, 10) : null,
    location: String(location).slice(0, 80) || "Nationwide",
    image: raw.image ?? null,
    imageFallback: raw.imageFallback ?? raw.image_fallback ?? null,
  };
}

function filterUnexpired(deals) {
  const today = new Date().toISOString().slice(0, 10);
  return (deals || []).filter((d) => !d.validUntil || d.validUntil >= today);
}

/**
 * Fetch from DEALS_FEED_URL. Returns normalized, unexpired array or null.
 */
async function fetchFromFeed() {
  const url = process.env.DEALS_FEED_URL?.trim();
  if (!url) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rawList = Array.isArray(data) ? data : data?.deals ?? data?.results ?? [];
    const normalized = rawList.map((r, i) => normalizeDeal(r, i));
    return filterUnexpired(normalized);
  } catch (err) {
    console.warn("[liveDeals] Feed fetch failed:", err.message);
    return null;
  }
}

/**
 * Fetch deals from OpenMenu (no separate server: just set OPENMENU_API_KEY).
 * With OPENMENU_CITY + OPENMENU_COUNTRY: search by location then fetch deals per restaurant.
 * With only API key: use id=sample for sample deals (no credits).
 */
async function fetchFromOpenMenu() {
  const key = process.env.OPENMENU_API_KEY?.trim();
  if (!key) return null;

  const city = process.env.OPENMENU_CITY?.trim();
  const state = process.env.OPENMENU_STATE?.trim();
  const country = (process.env.OPENMENU_COUNTRY || "US").trim().toUpperCase().slice(0, 2);
  const postalCode = process.env.OPENMENU_POSTAL_CODE?.trim();

  try {
    let allDeals = [];

    if (city && country) {
      const searchParams = new URLSearchParams({ key, s: "restaurant", city, country });
      if (state) searchParams.set("state", state.slice(0, 2));
      if (postalCode) searchParams.set("postal_code", postalCode);
      const searchRes = await fetch(`${OPENMENU_BASE}/search.php?${searchParams}`, {
        signal: AbortSignal.timeout(12000),
      });
      if (!searchRes.ok) return null;
      const searchData = await searchRes.json();
      const restaurants = searchData?.response?.result?.restaurants ?? [];
      const ids = restaurants.slice(0, 10).map((r) => r.id).filter(Boolean);
      for (const id of ids) {
        const dealRes = await fetch(`${OPENMENU_BASE}/deals.php?key=${encodeURIComponent(key)}&id=${encodeURIComponent(id)}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!dealRes.ok) continue;
        const dealData = await dealRes.json();
        const deals = dealData?.response?.result?.deals ?? [];
        allDeals = allDeals.concat(deals);
      }
    } else {
      const sampleRes = await fetch(`${OPENMENU_BASE}/deals.php?key=${encodeURIComponent(key)}&id=sample`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!sampleRes.ok) return null;
      const sampleData = await sampleRes.json();
      allDeals = sampleData?.response?.result?.deals ?? [];
    }

    const normalized = allDeals.map((r, i) => normalizeDeal(r, i));
    return filterUnexpired(normalized);
  } catch (err) {
    console.warn("[liveDeals] OpenMenu fetch failed:", err.message);
    return null;
  }
}

/**
 * Get deals: from cache if fresh, otherwise from feed URL → OpenMenu → scraper. Never returns expired deals.
 */
export async function getLiveDeals() {
  const now = Date.now();
  const useCache = cache.deals !== null && now - cache.fetchedAt < CACHE_TTL_MS;

  if (useCache) {
    return { deals: cache.deals, source: "cache", fetchedAt: cache.fetchedAt };
  }

  let deals = await fetchFromFeed();
  if (deals === null || deals.length === 0) {
    deals = await fetchFromOpenMenu();
  }
  if ((deals === null || deals.length === 0)) {
    const { getScrapedDeals } = await import("./dealScraper.js");
    const scraped = getScrapedDeals();
    if (scraped && scraped.length > 0) deals = scraped;
  }
  if (deals !== null && deals.length > 0) {
    cache = { deals, fetchedAt: now };
    return { deals, source: "live", fetchedAt: now };
  }

  return { deals: null };
}

/**
 * Force next getLiveDeals() to refetch (e.g. after admin refresh).
 */
export function invalidateCache() {
  cache = { deals: null, fetchedAt: 0 };
}
