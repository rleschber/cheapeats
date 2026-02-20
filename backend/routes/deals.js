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
  const { cuisine, sort, radius, lat, lng, dealType } = req.query;

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
    return {
      ...d,
      latitude,
      longitude,
      distanceMiles: distMi,
      image: d.image || null,
      dealType: type,
    };
  });

  list = list.filter((d) => d.distanceMiles <= radiusMiles);

  if (dealType && dealType.trim() && DEAL_TYPES.includes(dealType.trim())) {
    const want = dealType.trim();
    list = list.filter((d) => d.dealType === want);
  }

  if (cuisine && cuisine.trim()) {
    const c = cuisine.trim().toLowerCase();
    list = list.filter(
      (d) => d.cuisine && d.cuisine.toLowerCase().includes(c)
    );
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
