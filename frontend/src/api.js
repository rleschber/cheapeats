const API_BASE = "/api";

async function handleRes(res) {
  if (!res.ok) throw new Error(res.statusText || "Request failed");
  return res.json();
}

export async function getDeals({ cuisine, sort = "savings", radius, lat, lng, dealType } = {}) {
  const params = new URLSearchParams();
  if (cuisine) params.set("cuisine", cuisine);
  if (sort) params.set("sort", sort);
  if (radius != null && radius !== "") params.set("radius", String(radius));
  if (lat != null && lat !== "") params.set("lat", String(lat));
  if (lng != null && lng !== "") params.set("lng", String(lng));
  if (dealType) params.set("dealType", dealType);
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
