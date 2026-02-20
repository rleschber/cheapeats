import { Router } from "express";
import { deals as dealsData, DEAL_OFFSETS } from "../data/deals.js";

const router = Router();

/**
 * Haversine distance in miles between two lat/lng points.
 */
function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Compute a point (lat, lng) that is `miles` away from (centerLat, centerLng) at `bearingDeg` (0 = north, 90 = east).
 */
function coordsNearUser(centerLat, centerLng, miles, bearingDeg) {
  const MILES_PER_DEG_LAT = 69;
  const deg = miles / MILES_PER_DEG_LAT;
  const rad = (bearingDeg * Math.PI) / 180;
  const lat = centerLat + deg * Math.cos(rad);
  const lng = centerLng + (deg * Math.sin(rad)) / Math.cos((centerLat * Math.PI) / 180);
  return { latitude: lat, longitude: lng };
}

function parseSavingsPercent(str) {
  if (!str || typeof str !== "string") return 0;
  const n = parseInt(str.replace(/\D/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

const MIN_RADIUS = 0.1;
const MAX_RADIUS = 25;

const DEAL_TYPES = [
  "Kids Eat Free",
  "Happy Hour",
  "BOGO",
  "Online Deal",
  "App Deal",
  "Daily Special",
  "Discount",
];

/** Official logo URLs — Apistemic (works in img tags, no CORS). Format: domain for lookup. */
const LOGO_DOMAINS = {
  "McDonald's": "mcdonalds.com",
  "Taco Bell": "tacobell.com",
  "Chipotle": "chipotle.com",
  "Wendy's": "wendys.com",
  "Burger King": "bk.com",
  "Chick-fil-A": "chick-fil-a.com",
  "Panda Express": "pandaexpress.com",
  "Subway": "subway.com",
  "Domino's": "dominos.com",
  "Little Caesars": "littlecaesars.com",
  "Pizza Hut": "pizzahut.com",
  "Olive Garden": "olivegarden.com",
  "Buffalo Wild Wings": "buffalowildwings.com",
  "Dunkin'": "dunkindonuts.com",
  "Starbucks": "starbucks.com",
  "Sonic": "sonicdrivein.com",
  "Arby's": "arbys.com",
  "Jack in the Box": "jackinthebox.com",
  "Whataburger": "whataburger.com",
  "Wingstop": "wingstop.com",
  "Raising Cane's": "raisingcanes.com",
  "Zaxby's": "zaxbys.com",
  "KFC": "kfc.com",
  "Panera Bread": "panerabread.com",
  "IHOP": "ihop.com",
  "Denny's": "dennys.com",
  "Dairy Queen": "dairyqueen.com",
  "Popeyes": "popeyes.com",
  "Five Guys": "fiveguys.com",
  "In-N-Out": "in-n-out.com",
  "Papa John's": "papajohns.com",
  "Moe's Southwest Grill": "moes.com",
  "Firehouse Subs": "firehousesubs.com",
};

/** Get website domain for a restaurant (required for logo fetch). */
function getWebsiteDomain(restaurantName) {
  return LOGO_DOMAINS[restaurantName] || null;
}

/** In-memory cache for Brandfetch logo URLs (domain -> { logoUrl, format }). */
const brandfetchCache = new Map();
const CLEARBIT_MIN_WIDTH = 150;

/**
 * GET /api/deals/logo/:domain
 * Fetches logo from Brandfetch (SVG preferred, then PNG). API key in BRANDFETCH_API_KEY env.
 */
router.get("/logo/:domain", async (req, res) => {
  const domain = (req.params.domain || "").trim().toLowerCase();
  if (!domain) {
    res.status(400).json({ error: "Missing domain" });
    return;
  }
  const cached = brandfetchCache.get(domain);
  if (cached) {
    return res.json(cached);
  }
  const apiKey = process.env.BRANDFETCH_API_KEY;
  if (!apiKey) {
    res.json({ logoUrl: null, format: null });
    return;
  }
  try {
    const url = `https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      res.json({ logoUrl: null, format: null });
      return;
    }
    const data = await response.json();
    const logos = data.logos || [];
    let best = { url: null, format: null };
    for (const logo of logos) {
      const formats = logo.formats || [];
      for (const f of formats) {
        const src = f.src || f.url;
        const fmt = (f.format || "").toLowerCase();
        if (!src) continue;
        if (fmt === "svg") {
          best = { url: src, format: "svg" };
          break;
        }
        if (fmt === "png" && !best.url) best = { url: src, format: "png" };
      }
      if (best.format === "svg") break;
    }
    const result = { logoUrl: best.url, format: best.format };
    brandfetchCache.set(domain, result);
    res.json(result);
  } catch (err) {
    res.json({ logoUrl: null, format: null });
  }
});

function isVerifiedProductUrl(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  return !u.includes("unsplash") && !u.includes("placeholder");
}

/** Keys allowed in frontend foodImageMap. Only set foodType when deal explicitly matches. */
const ALLOWED_FOOD_TYPES = new Set([
  "burger", "sub", "pancakes", "steak", "chicken_sandwich",
]);

/**
 * Derive foodType only from deal title/description when the deal is specifically for that item.
 * No cuisine-based guessing; no default burger.
 */
function getFoodType(d) {
  const text = `${d.title || ""} ${d.description || ""}`.toLowerCase();
  if (/\bburger\b|whopper|mcdouble|mcchicken|single\b|cheeseburger\b/.test(text)) return "burger";
  if (/\bpizza\b|pepperoni|topping|large.*pizza/.test(text)) return "pizza";
  if (/\bsub\b|footlong|sandwich\b(?!\s*sauce)/.test(text)) return "sub";
  if (/\bpancake|waffle\s*fry/.test(text)) return "pancakes";
  if (/\bsteak\b|wing\b|wings\b|boneless/.test(text)) return text.includes("wing") ? "wings" : "steak";
  if (/\bfries?\b|fry\b|waffle\s*fries/.test(text)) return "fries";
  if (/\bchicken\s*sandwich|tender|nugget/.test(text)) return "chicken_sandwich";
  if (/\btaco\b|burrito|nachos?|queso/.test(text)) return "taco";
  if (/\bbowl\b(?!\s*of)/.test(text)) return "bowl";
  if (/\bdrink\b|soda|cold\s*brew|slush|frosty/.test(text)) return "drink";
  if (/\bcoffee\b|latte|espresso|donut/.test(text)) return "coffee";
  if (/\bice\s*cream|blizzard|frosty|smoothie/.test(text)) return "icecream";
  if (/\bpasta\b|entrée|entree\b/.test(text)) return "pasta";
  return null;
}

function getDealType(d) {
  const t = (d.title || "").toLowerCase();
  const desc = (d.description || "").toLowerCase();
  const combined = t + " " + desc;
  if (/kids eat free|kids eat \$\d|kids meal/.test(combined)) return "Kids Eat Free";
  if (/happy hour/.test(combined)) return "Happy Hour";
  if (/bogo|buy one get one|get one free|half-price.*wing/.test(combined)) return "BOGO";
  if (/online only|order online|online\./.test(combined)) return "Online Deal";
  if (/ in app\.| in-app|\. app\.|rewards|app reward|app sign-up|app order/.test(combined)) return "App Deal";
  if (/daily|monday|tuesday|wednesday|thursday|friday|saturday|sunday|rotating|of the day/.test(combined)) return "Daily Special";
  return "Discount";
}

/**
 * GET /api/deals
 * Requires lat, lng (user location). Deals are placed around the user's city — only deals within radius are returned.
 */
router.get("/", (req, res) => {
  let list = [...dealsData];
  const { sort, radius, lat, lng } = req.query;
  const cuisineParam = req.query.cuisine;
  const dealTypeParam = req.query.dealType;
  const cuisines = [].concat(cuisineParam || []).filter(Boolean).map((c) => String(c).trim().toLowerCase());
  const dealTypes = [].concat(dealTypeParam || []).filter(Boolean).map((t) => String(t).trim());

  const today = new Date().toISOString().slice(0, 10);
  list = list.filter((d) => !d.validUntil || d.validUntil >= today);

  const userLat = lat != null && lat !== "" ? Number(lat) : null;
  const userLng = lng != null && lng !== "" ? Number(lng) : null;
  let radiusMiles = 25;
  if (radius != null && radius !== "") {
    const n = Number(radius);
    if (!isNaN(n)) radiusMiles = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, n));
  }

  const hasUserLocation =
    userLat != null && userLng != null &&
    !isNaN(userLat) && !isNaN(userLng) &&
    userLat >= -90 && userLat <= 90 && userLng >= -180 && userLng <= 180;

  if (!hasUserLocation) {
    res.json({ deals: [], message: "Share your location to see deals in your area." });
    return;
  }

  const seenRestaurants = new Set();
  list = list.map((d, i) => {
    const isFirstOfBrand = !seenRestaurants.has(d.restaurant);
    if (isFirstOfBrand) seenRestaurants.add(d.restaurant);
    const defaultOffset = DEAL_OFFSETS[i] || { miles: 2, bearing: 0 };
    const offset = isFirstOfBrand
      ? { miles: 0.15, bearing: (i * 37) % 360 }
      : defaultOffset;
    const { latitude, longitude } = coordsNearUser(userLat, userLng, offset.miles, offset.bearing);
    const distMi = Math.round(
      distanceMiles(userLat, userLng, latitude, longitude) * 10
    ) / 10;
    const type = getDealType(d);
    const websiteDomain = getWebsiteDomain(d.restaurant);
    const productImageUrl =
      d.image && isVerifiedProductUrl(d.image) ? d.image : null;
    const foodType = getFoodType(d);
    return {
      ...d,
      latitude,
      longitude,
      distanceMiles: distMi,
      dealType: type,
      websiteDomain,
      productImageUrl,
      foodType: foodType && ALLOWED_FOOD_TYPES.has(foodType) ? foodType : null,
    };
  });

  list = list.filter((d) => d.distanceMiles <= radiusMiles);

  if (dealTypes.length > 0) {
    const set = new Set(dealTypes.filter((t) => DEAL_TYPES.includes(t)));
    if (set.size) list = list.filter((d) => set.has(d.dealType));
  }

  if (cuisines.length > 0) {
    const set = new Set(cuisines);
    list = list.filter((d) => d.cuisine && set.has(d.cuisine.toLowerCase()));
  }

  if (sort === "newest") {
    list.sort((a, b) => (b.validUntil || "").localeCompare(a.validUntil || ""));
  } else {
    list.sort(
      (a, b) =>
        parseSavingsPercent(b.savings) - parseSavingsPercent(a.savings)
    );
  }

  res.json({ deals: list });
});

router.get("/cuisines", (req, res) => {
  const set = new Set(dealsData.map((d) => d.cuisine).filter(Boolean));
  const cuisines = Array.from(set).sort();
  res.json({ cuisines });
});

router.get("/deal-types", (req, res) => {
  res.json({ dealTypes: DEAL_TYPES });
});

export default router;
