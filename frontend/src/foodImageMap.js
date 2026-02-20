/**
 * Controlled food image library. Only these keys may be used.
 * No dynamic fetch, no cuisine guessing. foodType must match dealTitle context.
 * Add high-resolution images to public/images/food/ for each key.
 */
export const FOOD_IMAGE_MAP = {
  burger: "/images/food/burger.jpg",
  sub: "/images/food/sub.jpg",
  pancakes: "/images/food/pancakes.jpg",
  steak: "/images/food/steak.jpg",
  chicken_sandwich: "/images/food/chicken-sandwich.jpg",
};

/**
 * Returns stock image path only if foodType is in the controlled map.
 */
export function getStockImageForFoodType(foodType) {
  if (!foodType || typeof foodType !== "string") return null;
  const key = foodType.trim().toLowerCase();
  return FOOD_IMAGE_MAP[key] || null;
}
