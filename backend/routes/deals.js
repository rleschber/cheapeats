import { Router } from "express";
import { deals as dealsData, DEAL_OFFSETS } from "../data/deals.js";
import { getLiveDeals, invalidateCache } from "../services/liveDealsService.js";

const router = Router();

const today = () => new Date().toISOString().slice(0, 10);

/** Get base deal list: live (cached) if available and non-empty, else static filtered to unexpired only. */
async function getBaseDeals() {
  const { deals: liveDeals, fetchedAt, source } = await getLiveDeals();
  if (liveDeals != null && liveDeals.length > 0) {
    return { list: liveDeals, fetchedAt, source };
  }
  const filtered = (dealsData || []).filter((d) => !d.validUntil || d.validUntil >= today());
  return { list: filtered, fetchedAt: null, source: "static" };
}

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

const FOOD_IMAGES = {
  taco: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80",
  burrito: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80",
  nachos: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400&q=80",
  wings: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
  fries: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&q=80",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80",
  sub: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80",
  chicken: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80",
  nuggets: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&q=80",
  icecream: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
  donut: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80",
  drinks: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&q=80",
  pasta: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80",
  bowl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  chinese: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80",
  gyro: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80",
  corndog: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&q=80",
  breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80",
  apps: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
  soup: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80",
};

const DEFAULT_FOOD_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

const RESTAURANT_FOOD = {
  "McDonald's": "burger", "Wendy's": "burger", "Burger King": "burger",
  "Taco Bell": "taco", "Chipotle": "burrito",
  "IHOP": "breakfast", "Denny's": "breakfast",
  "Buffalo Wild Wings": "wings", "Wingstop": "wings",
  "Dunkin'": "donut", "Starbucks": "coffee",
  "Raising Cane's": "chicken", "Zaxby's": "chicken",
  "KFC": "chicken", "Popeyes": "chicken", "Chick-fil-A": "chicken",
  "Panda Express": "chinese", "Olive Garden": "pasta", "Dairy Queen": "icecream",
  "Subway": "sub", "Domino's": "pizza", "Pizza Hut": "pizza",
  "Little Caesars": "pizza", "Papa John's": "pizza",
  "Sonic": "burger", "Arby's": "sub", "Jack in the Box": "burger",
  "Whataburger": "burger", "Five Guys": "burger", "In-N-Out": "burger",
  "Panera Bread": "sub", "Firehouse Subs": "sub", "Moe's Southwest Grill": "burrito",
};

const CUISINE_FOOD = {
  "Fast Food": "burger", "Mexican": "taco", "American": "wings",
  "Pizza": "pizza", "Sandwiches": "sub", "Italian": "pasta", "Chinese": "chinese",
};

function pickFoodImage(d) {
  const title = (d.title || d.dealTitle || "").toString();
  const desc = (d.description || "").toString();
  const text = (title + " " + desc).toLowerCase();
  const rest = (d.restaurant || d.restaurantName || "").toString();

  if (/\btaco[s]?\b/.test(text)) return FOOD_IMAGES.taco;
  if (/\bburrito/.test(text)) return FOOD_IMAGES.burrito;
  if (/nachos|queso/.test(text)) return FOOD_IMAGES.nachos;
  if (/\bwing[s]?\b|boneless/.test(text)) return FOOD_IMAGES.wings;
  if (/\bfries?\b|waffle fries|curly fries/.test(text)) return FOOD_IMAGES.fries;
  if (/\bburger\b|whopper|mcdouble|cheeseburger|dave.s single|biggie|big mac/.test(text)) return FOOD_IMAGES.burger;
  if (/\bpizza\b|pepperoni|hot-n-ready/.test(text)) return FOOD_IMAGES.pizza;
  if (/chicken sandwich/.test(text)) return FOOD_IMAGES.chicken;
  if (/\bsub\b|footlong/.test(text)) return FOOD_IMAGES.sub;
  if (/tender|nugget/.test(text)) return FOOD_IMAGES.nuggets;
  if (/frosty|milkshake|ice cream|blizzard/.test(text)) return FOOD_IMAGES.icecream;
  if (/cold brew|coffee|latte|espresso/.test(text)) return FOOD_IMAGES.coffee;
  if (/donut|doughnut/.test(text)) return FOOD_IMAGES.donut;
  if (/pancake|waffle\b|breakfast/.test(text)) return FOOD_IMAGES.breakfast;
  if (/corn dog/.test(text)) return FOOD_IMAGES.corndog;
  if (/gyro/.test(text)) return FOOD_IMAGES.gyro;
  if (/\bpasta\b|never ending pasta/.test(text)) return FOOD_IMAGES.pasta;
  if (/\bbowl\b|guac|guacamole/.test(text)) return FOOD_IMAGES.bowl;
  if (/soup|salad/.test(text)) return FOOD_IMAGES.soup;
  if (/\bslush/.test(text)) return FOOD_IMAGES.drinks;
  if (/happy hour/.test(text)) return FOOD_IMAGES.apps;

  const rKey = RESTAURANT_FOOD[rest];
  if (rKey && FOOD_IMAGES[rKey]) return FOOD_IMAGES[rKey];
  const cKey = CUISINE_FOOD[(d.cuisine || "").toString().trim()];
  if (cKey && FOOD_IMAGES[cKey]) return FOOD_IMAGES[cKey];
  return DEFAULT_FOOD_IMAGE;
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
 * Requires lat, lng (user location). Deals come from live feed (when DEALS_FEED_URL is set) or static catalog; expired deals are never shown.
 */
router.get("/", async (req, res) => {
  const { list: baseList, fetchedAt, source } = await getBaseDeals();
  let list = [...baseList];

  const { sort, radius, lat, lng } = req.query;
  const cuisineParam = req.query.cuisine;
  const dealTypeParam = req.query.dealType;
  const cuisines = [].concat(cuisineParam || []).filter(Boolean).map((c) => String(c).trim().toLowerCase());
  const dealTypes = [].concat(dealTypeParam || []).filter(Boolean).map((t) => String(t).trim());

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
    res.json({ deals: [], message: "Share your location to see deals in your area.", fetchedAt: fetchedAt ?? undefined, source: source ?? undefined });
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
    return {
      ...d,
      latitude,
      longitude,
      distanceMiles: distMi,
      dealType: type,
      foodImage: pickFoodImage(d),
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

  res.json({ deals: list, fetchedAt: fetchedAt ?? undefined, source: source ?? undefined });
});

router.get("/cuisines", async (req, res) => {
  const { list } = await getBaseDeals();
  const set = new Set((list || []).map((d) => d.cuisine).filter(Boolean));
  const cuisines = Array.from(set).sort();
  res.json({ cuisines });
});

router.get("/deal-types", (req, res) => {
  res.json({ dealTypes: DEAL_TYPES });
});

/**
 * GET /api/deals/feed
 * Returns unexpired deals as JSON (our schema). Use as DEALS_FEED_URL when no external API
 * (e.g. http://localhost:3001/api/deals/feed) so the app still uses the live pipeline and never shows expired.
 */
router.get("/feed", (req, res) => {
  const filtered = (dealsData || []).filter((d) => !d.validUntil || d.validUntil >= today());
  res.json(filtered);
});

/** Force refresh of live deals cache on next request (e.g. when customer taps Refresh). */
router.post("/refresh", (req, res) => {
  invalidateCache();
  res.json({ ok: true, message: "Deals cache cleared; next request will fetch live." });
});

export default router;
