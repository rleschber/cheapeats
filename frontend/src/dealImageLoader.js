import { useState, useEffect, useCallback } from "react";
import { getBrandfetchLogo } from "./api";
import { getStockImageForFoodType } from "./foodImageMap";

const CLEARBIT_BASE = "https://logo.clearbit.com/";
const CLEARBIT_MIN_WIDTH = 150;

/**
 * Deterministic hybrid logo strategy:
 * 1) Brandfetch SVG/PNG
 * 2) Clearbit (reject if naturalWidth < 150px)
 * 3) Controlled stock food image
 * No letter tiles, no random placeholders.
 *
 * @param {Object} deal - { websiteDomain, foodType, restaurant?, title?, dealTitle? }
 */
export function useDealImage(deal) {
  const websiteDomain =
    deal && typeof deal.websiteDomain === "string"
      ? deal.websiteDomain.trim().toLowerCase()
      : null;
  const foodType =
    deal && deal.foodType && typeof deal.foodType === "string"
      ? deal.foodType.trim()
      : null;
  const stockSrc = getStockImageForFoodType(foodType);
  const clearbitUrl = websiteDomain
    ? CLEARBIT_BASE + websiteDomain.replace(/^https?:\/\//, "").split("/")[0]
    : null;

  const [brandfetchUrl, setBrandfetchUrl] = useState(null);
  const [brandfetchDone, setBrandfetchDone] = useState(false);
  const [source, setSource] = useState(null); // 'brandfetch' | 'clearbit' | 'food' | null

  useEffect(() => {
    if (!websiteDomain) {
      setBrandfetchDone(true);
      return;
    }
    let cancelled = false;
    getBrandfetchLogo(websiteDomain)
      .then(({ logoUrl }) => {
        if (!cancelled && logoUrl) setBrandfetchUrl(logoUrl);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBrandfetchDone(true);
      });
    return () => { cancelled = true; };
  }, [websiteDomain]);

  useEffect(() => {
    if (!brandfetchDone) return;
    if (brandfetchUrl) setSource("brandfetch");
    else if (clearbitUrl) setSource("clearbit");
    else if (stockSrc) setSource("food");
    else setSource(null);
  }, [brandfetchDone, brandfetchUrl, clearbitUrl, stockSrc]);

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
      setSource(clearbitUrl ? "clearbit" : stockSrc ? "food" : null);
    } else if (source === "clearbit") {
      setSource(stockSrc ? "food" : null);
    } else if (source === "food") {
      setSource(null);
    }
  }, [source, clearbitUrl, stockSrc]);

  const src =
    source === "brandfetch"
      ? brandfetchUrl
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
    isLoading: !brandfetchDone && !!websiteDomain,
    isLogo: source === "brandfetch" || source === "clearbit",
    isFood: source === "food",
  };
}
