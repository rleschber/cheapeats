/**
 * Deal scraper: fetches configured URLs, looks for deal-like content in the HTML,
 * and exposes it for the live deals pipeline. Use only on sites you are allowed to scrape.
 *
 * URLs come from (1) env SCRAPER_URLS (comma-separated) or (2) BUILT_IN_SCRAPER_URLS below.
 * Add or edit URLs directly here to scrape without using .env.
 */

import * as cheerio from "cheerio";

const SCRAPER_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const REQUEST_TIMEOUT_MS = 15000;

/**
 * URLs to scrape when SCRAPER_URLS is not set.
 * These match the "Website" links in the app (Go to website button). Same list as frontend restaurantLinks.js.
 * Only use sites you're allowed to scrape; many chains restrict scraping in their ToS.
 */
const BUILT_IN_SCRAPER_URLS = [
  "https://www.mcdonalds.com/us/en-us.html",
  "https://www.tacobell.com",
  "https://www.chipotle.com",
  "https://www.wendys.com",
  "https://www.bk.com",
  "https://www.chick-fil-a.com",
  "https://www.pandaexpress.com",
  "https://www.subway.com",
  "https://www.dominos.com",
  "https://www.papajohns.com",
  "https://www.littlecaesars.com",
  "https://www.pizzahut.com",
  "https://www.olivegarden.com",
  "https://www.buffalowildwings.com",
  "https://www.dunkindonuts.com",
  "https://www.starbucks.com",
  "https://www.sonicdrivein.com",
  "https://www.arbys.com",
  "https://www.jackinthebox.com",
  "https://www.whataburger.com",
  "https://www.wingstop.com",
  "https://www.raisingcanes.com",
  "https://www.zaxbys.com",
  "https://www.popeyes.com",
  "https://www.kfc.com",
  "https://www.panerabread.com",
  "https://www.jimmyjohns.com",
  "https://www.qdoba.com",
  "https://www.ihop.com",
  "https://www.dennys.com",
  "https://www.applebees.com",
  "https://www.chilis.com",
  "https://www.texasroadhouse.com",
  "https://www.dairyqueen.com",
  "https://www.krispykreme.com",
  "https://www.redlobster.com",
  "https://www.pfchangs.com",
];

/** Deal-like phrases (case-insensitive) to detect in link/heading text. */
const DEAL_PATTERNS = [
  /\b(?:free|BOGO|buy one get one|half ?off|%\s*off|\d+%\s*off|save\s+\$|\$\d+ off)/i,
  /\bcoupon|deal|discount|promo|special offer|limited time/i,
  /\b(?:valid|expires?|through)\s+[\w\s,]+(?:20\d{2})?/i,
];

/** Infer a short "restaurant" or source name from URL hostname. */
function hostToName(host) {
  if (!host) return "Online";
  const base = host.replace(/^www\./, "").split(".")[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/** Try to pull a date from text (YYYY-MM-DD or "through Month DD" etc.). */
function extractDate(text) {
  if (!text || typeof text !== "string") return null;
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  const monthDay = text.match(/(?:through|until|expires?|valid)\s+(\w+)\s+(\d{1,2})/i);
  if (monthDay) {
    const months = "jan feb mar apr may jun jul aug sep oct nov dec";
    const i = months.indexOf(monthDay[1].toLowerCase().slice(0, 3));
    if (i >= 0) {
      const m = String(Math.floor(i / 4) + 1).padStart(2, "0");
      const d = String(parseInt(monthDay[2], 10)).padStart(2, "0");
      const y = new Date().getFullYear();
      return `${y}-${m}-${d}`;
    }
  }
  return null;
}

/** Normalize a scraped item to our deal schema. */
function normalizeScraped(raw, index, sourceName) {
  const title = raw.title?.trim() || raw.headline?.trim() || "Deal";
  const description = raw.description?.trim() || "";
  const restaurant = raw.restaurant?.trim() || sourceName;
  const validUntil = raw.validUntil || extractDate(raw.description || raw.title || "");
  return {
    id: `scraped-${index}-${sourceName.replace(/\W/g, "_")}`,
    restaurant,
    cuisine: raw.cuisine || "American",
    title: title.slice(0, 120),
    description: description.slice(0, 255),
    savings: raw.savings || "0%",
    savingsAmount: raw.savingsAmount || "",
    validUntil: validUntil ? String(validUntil).slice(0, 10) : null,
    location: raw.location || "Online",
    image: raw.image || null,
    imageFallback: null,
  };
}

function filterUnexpired(deals) {
  const today = new Date().toISOString().slice(0, 10);
  return (deals || []).filter((d) => !d.validUntil || d.validUntil >= today);
}

/** Fetch HTML from url; return null on failure. */
async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "CheapEatsDealScraper/1.0 (compatible; +https://github.com/your-repo)",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.warn("[dealScraper] Fetch failed:", url, err.message);
    return null;
  }
}

/**
 * Extract deal-like items from a cheerio document.
 * Looks at: a[href], headings, elements with class/id containing "deal", "coupon", "offer".
 */
function extractDeals($, pageUrl) {
  const baseUrl = new URL(pageUrl);
  const hostName = hostToName(baseUrl.hostname);
  const seen = new Set();
  const out = [];

  const candidates = [];
  $("a[href]").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href") || "";
    const text = $el.text().replace(/\s+/g, " ").trim();
    if (text.length < 5 || text.length > 200) return;
    if (/^(#|javascript:)/i.test(href)) return;
    candidates.push({ text, tag: "link" });
  });
  $("h1, h2, h3, h4").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length < 5 || text.length > 200) return;
    candidates.push({ text, tag: "heading" });
  });
  $("[class*='deal' i], [class*='coupon' i], [class*='offer' i], [id*='deal' i]").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length < 5 || text.length > 300) return;
    candidates.push({ text: text.slice(0, 200), tag: "block" });
  });

  for (const { text } of candidates) {
    const key = text.slice(0, 80).toLowerCase();
    if (seen.has(key)) continue;
    const isDealLike = DEAL_PATTERNS.some((re) => re.test(text));
    if (!isDealLike) continue;
    seen.add(key);
    const validUntil = extractDate(text);
    out.push({
      title: text.slice(0, 120),
      description: text.slice(0, 255),
      restaurant: hostName,
      validUntil,
    });
  }

  return out.map((r, i) => normalizeScraped(r, i, hostName));
}

/** Get list of URLs to scrape: from env SCRAPER_URLS, or BUILT_IN_SCRAPER_URLS if env is unset. */
function getTargetUrls() {
  const fromEnv = process.env.SCRAPER_URLS?.trim();
  if (fromEnv) return fromEnv.split(",").map((u) => u.trim()).filter(Boolean);
  return BUILT_IN_SCRAPER_URLS.filter((u) => typeof u === "string" && u.trim().length > 0);
}

let scrapedCache = { deals: [], fetchedAt: 0 };

/**
 * Run the scraper for all configured URLs; update cache with normalized, unexpired deals.
 */
export async function runScraper() {
  const urls = getTargetUrls();
  if (urls.length === 0) return [];

  const allDeals = [];
  for (const url of urls) {
    const html = await fetchPage(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    const deals = extractDeals($, url);
    allDeals.push(...deals);
  }

  const deduped = [];
  const seen = new Set();
  for (const d of allDeals) {
    const key = `${d.restaurant}|${d.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(d);
  }

  const valid = filterUnexpired(deduped);
  scrapedCache = { deals: valid, fetchedAt: Date.now() };
  if (valid.length > 0) {
    console.log("[dealScraper] Found", valid.length, "deals from", urls.length, "page(s)");
  }
  return valid;
}

/** Return cached scraped deals (empty if scraper never run or no URLs configured). */
export function getScrapedDeals() {
  const urls = getTargetUrls();
  if (urls.length === 0) return [];
  return scrapedCache.deals || [];
}

/** Start periodic scraping (run once now, then every SCRAPER_INTERVAL_MS). */
export function startScraperSchedule() {
  const urls = getTargetUrls();
  if (urls.length === 0) return;
  const intervalMs = Number(process.env.SCRAPER_INTERVAL_MS) || SCRAPER_INTERVAL_MS;
  runScraper().catch((err) => console.warn("[dealScraper] Initial run failed:", err.message));
  setInterval(() => runScraper().catch((err) => console.warn("[dealScraper] Scheduled run failed:", err.message)), intervalMs);
  console.log("[dealScraper] Scheduled every", intervalMs / 60000, "min for", urls.length, "URL(s)");
}
