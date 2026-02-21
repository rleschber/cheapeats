const API_BASE = "/api";

async function handleRes(res) {
  if (!res.ok) throw new Error(res.statusText || "Request failed");
  return res.json();
}

export async function getDeals({ cuisines = [], dealTypes = [], sort = "savings", radius, lat, lng } = {}) {
  const params = new URLSearchParams();
  if (Array.isArray(cuisines) && cuisines.length) cuisines.forEach((c) => params.append("cuisine", c));
  if (Array.isArray(dealTypes) && dealTypes.length) dealTypes.forEach((t) => params.append("dealType", t));
  if (sort) params.set("sort", sort);
  if (radius != null && radius !== "") params.set("radius", String(radius));
  if (lat != null && lat !== "") params.set("lat", String(lat));
  if (lng != null && lng !== "") params.set("lng", String(lng));
  const qs = params.toString();
  const url = `${API_BASE}/deals${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);
  return handleRes(res);
}

export async function getCuisines() {
  const res = await fetch(`${API_BASE}/deals/cuisines`);
  return handleRes(res);
}

export async function getDealTypes() {
  const res = await fetch(`${API_BASE}/deals/deal-types`);
  return handleRes(res);
}

/** Clear server cache so next getDeals() fetches fresh live data. */
export async function refreshDeals() {
  const res = await fetch(`${API_BASE}/deals/refresh`, { method: "POST" });
  return handleRes(res);
}

/**
 * Fetches logo from Brandfetch (via backend). Returns { logoUrl, format }.
 * Prefer SVG; format is 'svg' | 'png' | null.
 */
export async function getBrandfetchLogo(websiteDomain) {
  if (!websiteDomain || typeof websiteDomain !== "string") return { logoUrl: null, format: null };
  const domain = websiteDomain.trim().toLowerCase();
  if (!domain) return { logoUrl: null, format: null };
  const res = await fetch(`${API_BASE}/deals/logo/${encodeURIComponent(domain)}`);
  return handleRes(res);
}
