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

/** Official logo URLs only. No stock or auto-fetched images. */
const OFFICIAL_LOGO_URLS = {
  "McDonald's": "https://logo.clearbit.com/mcdonalds.com",
  "Taco Bell": "https://logo.clearbit.com/tacobell.com",
  "Chipotle": "https://logo.clearbit.com/chipotle.com",
  "Wendy's": "https://logo.clearbit.com/wendys.com",
  "Burger King": "https://logo.clearbit.com/bk.com",
  "Chick-fil-A": "https://logo.clearbit.com/chick-fil-a.com",
  "Panda Express": "https://logo.clearbit.com/pandaexpress.com",
  "Subway": "https://logo.clearbit.com/subway.com",
  "Domino's": "https://logo.clearbit.com/dominos.com",
  "Little Caesars": "https://logo.clearbit.com/littlecaesars.com",
  "Pizza Hut": "https://logo.clearbit.com/pizzahut.com",
  "Olive Garden": "https://logo.clearbit.com/olivegarden.com",
  "Buffalo Wild Wings": "https://logo.clearbit.com/buffalowildwings.com",
  "Dunkin'": "https://logo.clearbit.com/dunkindonuts.com",
  "Starbucks": "https://logo.clearbit.com/starbucks.com",
  "Sonic": "https://logo.clearbit.com/sonicdrivein.com",
  "Arby's": "https://logo.clearbit.com/arbys.com",
  "Jack in the Box": "https://logo.clearbit.com/jackinthebox.com",
  "Whataburger": "https://logo.clearbit.com/whataburger.com",
  "Wingstop": "https://logo.clearbit.com/wingstop.com",
  "Raising Cane's": "https://logo.clearbit.com/raisingcanes.com",
  "Zaxby's": "https://logo.clearbit.com/zaxbys.com",
  "KFC": "https://logo.clearbit.com/kfc.com",
  "Panera Bread": "https://logo.clearbit.com/panerabread.com",
  "IHOP": "https://logo.clearbit.com/ihop.com",
  "Denny's": "https://logo.clearbit.com/dennys.com",
  "Dairy Queen": "https://logo.clearbit.com/dairyqueen.com",
  "Popeyes": "https://logo.clearbit.com/popeyes.com",
  "Five Guys": "https://logo.clearbit.com/fiveguys.com",
  "In-N-Out": "https://logo.clearbit.com/in-n-out.com",
  "Papa John's": "https://logo.clearbit.com/papajohns.com",
  "Moe's Southwest Grill": "https://logo.clearbit.com/moes.com",
  "Firehouse Subs": "https://logo.clearbit.com/firehousesubs.com",
};

function isVerifiedProductUrl(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  return !u.includes("unsplash") && !u.includes("placeholder");
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
    const logoUrl = OFFICIAL_LOGO_URLS[d.restaurant] || null;
    const productImageUrl =
      d.image && isVerifiedProductUrl(d.image) ? d.image : null;
    return {
      ...d,
      latitude,
      longitude,
      distanceMiles: distMi,
      dealType: type,
      logoUrl,
      productImageUrl,
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
