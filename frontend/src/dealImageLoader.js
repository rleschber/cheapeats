import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { getBrandfetchLogo } from "./api";
import { getStockImageForFoodType } from "./foodImageMap";

const CLEARBIT_BASE = "https://logo.clearbit.com/";
const APISTEMIC_BASE = "https://logos-api.apistemic.com/domain:";
const CLEARBIT_MIN_WIDTH = 150;

/** Fallback when API doesn't send websiteDomain — same mapping as backend. */
const RESTAURANT_DOMAINS = {
  "McDonald's": "mcdonalds.com", "Taco Bell": "tacobell.com", "Chipotle": "chipotle.com",
  "Wendy's": "wendys.com", "Burger King": "bk.com", "Chick-fil-A": "chick-fil-a.com",
  "Panda Express": "pandaexpress.com", "Subway": "subway.com", "Domino's": "dominos.com",
  "Little Caesars": "littlecaesars.com", "Pizza Hut": "pizzahut.com", "Olive Garden": "olivegarden.com",
  "Buffalo Wild Wings": "buffalowildwings.com", "Dunkin'": "dunkindonuts.com", "Starbucks": "starbucks.com",
  "Sonic": "sonicdrivein.com", "Arby's": "arbys.com", "Jack in the Box": "jackinthebox.com",
  "Whataburger": "whataburger.com", "Wingstop": "wingstop.com", "Raising Cane's": "raisingcanes.com",
  "Zaxby's": "zaxbys.com", "KFC": "kfc.com", "Panera Bread": "panerabread.com", "IHOP": "ihop.com",
  "Denny's": "dennys.com", "Dairy Queen": "dairyqueen.com", "Popeyes": "popeyes.com",
  "Five Guys": "fiveguys.com", "In-N-Out": "in-n-out.com", "Papa John's": "papajohns.com",
  "Moe's Southwest Grill": "moes.com", "Firehouse Subs": "firehousesubs.com",
};

/**
 * Deterministic hybrid logo strategy:
 * 1) Brandfetch SVG/PNG (if available from API)
 * 2) Apistemic (works in img, no API key) — used immediately so no white box
 * 3) Clearbit (reject if naturalWidth < 150px)
 * 4) Controlled stock food image
 *
 * @param {Object} deal - { websiteDomain, foodType, restaurant?, title?, dealTitle? }
 */
export function useDealImage(deal) {
  const websiteDomain =
    (deal && typeof deal.websiteDomain === "string" && deal.websiteDomain.trim())
      ? deal.websiteDomain.trim().toLowerCase()
      : (deal && deal.restaurant && RESTAURANT_DOMAINS[deal.restaurant]) || null;
  const foodType =
    deal && deal.foodType && typeof deal.foodType === "string"
      ? deal.foodType.trim()
      : null;
  const stockSrc = getStockImageForFoodType(foodType);
  const cleanDomain = websiteDomain
    ? websiteDomain.replace(/^https?:\/\//, "").split("/")[0]
    : null;
  const clearbitUrl = cleanDomain ? CLEARBIT_BASE + cleanDomain : null;
  const apistemicUrl = cleanDomain ? APISTEMIC_BASE + cleanDomain : null;

  const [brandfetchUrl, setBrandfetchUrl] = useState(null);
  const [source, setSource] = useState(
    () => apistemicUrl ? "apistemic" : clearbitUrl ? "clearbit" : stockSrc ? "food" : null
  );

  // Keep source in sync when Brandfetch returns or when fallbacks change.
  useLayoutEffect(() => {
    if (brandfetchUrl) {
      setSource("brandfetch");
    } else if (apistemicUrl) {
      setSource("apistemic");
    } else if (clearbitUrl) {
      setSource("clearbit");
    } else if (stockSrc) {
      setSource("food");
    } else {
      setSource(null);
    }
  }, [brandfetchUrl, apistemicUrl, clearbitUrl, stockSrc]);

  // Optional: try Brandfetch in background; if it returns a URL we'll prefer it.
  useEffect(() => {
    if (!websiteDomain) return;
    let cancelled = false;
    getBrandfetchLogo(websiteDomain)
      .then(({ logoUrl }) => {
        if (!cancelled && logoUrl) setBrandfetchUrl(logoUrl);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [websiteDomain]);

  const onLoad = useCallback(
    (e) => {
      if (source === "clearbit") {
        const w = e.target.naturalWidth;
        if (typeof w === "number" && w < CLEARBIT_MIN_WIDTH) {
          setSource(stockSrc ? "food" : null);
        }
      }
    },
    [source, stockSrc]
  );

  const onError = useCallback(() => {
    if (source === "brandfetch") {
      setSource(apistemicUrl ? "apistemic" : clearbitUrl ? "clearbit" : stockSrc ? "food" : null);
    } else if (source === "apistemic") {
      setSource(clearbitUrl ? "clearbit" : stockSrc ? "food" : null);
    } else if (source === "clearbit") {
      setSource(stockSrc ? "food" : null);
    } else if (source === "food") {
      setSource(null);
    }
  }, [source, apistemicUrl, clearbitUrl, stockSrc]);

  const src =
    source === "brandfetch"
      ? brandfetchUrl
      : source === "apistemic"
        ? apistemicUrl
        : source === "clearbit"
          ? clearbitUrl
          : source === "food"
            ? stockSrc
            : null;

  return {
    src,
    type: source,
    onLoad,
    onError,
    isLoading: false,
    isLogo: source === "brandfetch" || source === "apistemic" || source === "clearbit",
    isFood: source === "food",
  };
}
