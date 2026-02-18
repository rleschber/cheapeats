/**
 * Fallback images by cuisine (priority 3 when deal image and logo fail).
 */
export const CUISINE_IMAGES = {
  "Fast Food": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
  Mexican: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600",
  Pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
  Chinese: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600",
  Sandwiches: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600",
  Italian: "https://images.unsplash.com/photo-1551183053-bf91a1f81141?w=600",
  American: "https://images.unsplash.com/photo-1567620832903-7fcb3dc8ab95?w=600",
  Desserts: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600",
};

const DEFAULT_CUISINE_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";

export function getCuisineImage(cuisine) {
  if (!cuisine) return DEFAULT_CUISINE_IMAGE;
  const key = Object.keys(CUISINE_IMAGES).find((k) => k.toLowerCase() === cuisine.toLowerCase());
  return key ? CUISINE_IMAGES[key] : DEFAULT_CUISINE_IMAGE;
}
